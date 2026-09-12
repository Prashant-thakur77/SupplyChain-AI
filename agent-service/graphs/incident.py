"""Incident graph — the core of the product.

    analyst ──[severity ≥ HIGH]──▶ routing engine (deterministic) ──▶ Strands Graph: router ∥ impact ──▶ strategist ──▶ decision

Every LLM step is a Strands Agent with a Pydantic structured output; the route math is never delegated to a model.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Callable, Optional

from strands.multiagent import GraphBuilder

from models import invoke_with_retry

import db
from agents import analyst, impact, router, strategist
from routing import ReroutePlan, reroute_plan
from schemas import (
    Assessment, Decision, DecisionOption, Event, GraphEvent, ImpactEstimate, MitigationPlan, RouteRanking, Severity, Twin,
)
from tools.memory import recall_memory
from tools.twin import twin_cache
from tracing import TraceHooks, new_session_id

SEV_ORDER = {Severity.LOW: 0, Severity.MEDIUM: 1, Severity.HIGH: 2, Severity.CRITICAL: 3}
Emit = Callable[[GraphEvent], None]


def severity_gate(a: Assessment) -> bool:
    return SEV_ORDER[a.severity] >= SEV_ORDER[Severity.HIGH]


@dataclass
class IncidentResult:
    assessment: Assessment
    plan: Optional[ReroutePlan]
    ranking: Optional[RouteRanking]
    impact: Optional[ImpactEstimate]
    mitigation: Optional[MitigationPlan]
    decision: Optional[Decision]
    decision_id: Optional[str]
    notification_id: Optional[str]
    trace_id: str
    status: str  # decision | notified | partial
    execution_order: list[str]


def _risk_of(c) -> Severity:
    if c.max_risk >= 2.0:
        return Severity.HIGH
    if c.max_risk >= 1.3:
        return Severity.MEDIUM
    return Severity.LOW


def build_decision(
    twin: Twin, a: Assessment, plan: ReroutePlan, r: RouteRanking, i: Optional[ImpactEstimate], m: Optional[MitigationPlan], trace_id: str
) -> Decision:
    by_id = {c.id: c for c in plan.candidates}
    opts: list[DecisionOption] = []
    for cid in r.ranked_candidate_ids[:3]:
        c = by_id[cid]
        opts.append(
            DecisionOption(
                id=cid, label=" → ".join(c.labels), kind="reroute", added_cost=c.added_cost, added_days=c.added_days,
                risk=_risk_of(c), route_candidate_id=cid,
                detail=f"{'/'.join(sorted(set(c.modes)))} · ${c.cost:,.0f} total · {c.transit_days:.0f} days",
            )
        )
    opts.append(
        DecisionOption(
            id="wait", label="Wait and monitor", kind="wait", added_days=i.delay_days if i else 0,
            risk=Severity.MEDIUM if r.wait_is_viable else Severity.HIGH, detail=r.wait_rationale,
        )
    )
    if m:
        opts.append(DecisionOption(id="mitigate", label=m.title, kind="mitigate", added_cost=m.estimated_cost_usd, risk=m.risk_after, detail=m.summary))
    rec = r.recommended_candidate_id if r.recommended_candidate_id in by_id else ("wait" if r.wait_is_viable else opts[0].id)
    title = f"{a.title}: choose a route" if plan.feasible_count else f"{a.title}: no full bypass available"
    return Decision(
        supply_chain_id=twin.supply_chain_id, event_id=a.event_id, title=title, summary=a.summary, options=opts,
        recommended_option_id=rec, rationale=r.rationale, confidence=a.confidence, sources=a.sources, trace_id=trace_id,
    )


def _candidates_block(twin: Twin, plan: ReroutePlan) -> str:
    risk = {n.id: n.risk_level for n in twin.nodes}
    return "\n".join(
        f"- {c.id}: {' -> '.join(c.labels)} | modes={c.modes} | cost=${c.cost:.0f} (+{c.added_cost:.0f}) | days={c.transit_days:.0f} "
        f"(+{c.added_days:.0f}) | max_risk={c.max_risk} | node_risks={[risk.get(n, 0) for n in c.path]} | feasible={c.feasible}"
        for c in plan.candidates
    )


def _structured(gres, node_id: str, model):
    """Pull the typed output of a graph node, if the node ran and produced one."""
    nr = gres.results.get(node_id)
    res = getattr(nr, "result", None)
    so = getattr(res, "structured_output", None)
    return so if isinstance(so, model) else None


def run_incident(supply_chain_id: str, user_id: str, event: Event, emit: Emit = lambda e: None, persist: bool = True) -> IncidentResult:
    trace_id = new_session_id("incident")
    hooks = [TraceHooks(trace_id, user_id, supply_chain_id, "incident")]
    twin = twin_cache.get(supply_chain_id)
    order: list[str] = []
    t0 = time.time()

    def stage(name: str) -> float:
        emit(GraphEvent(type="node_start", node=name))
        order.append(name)
        return time.time()

    def done(name: str, t: float, payload: Optional[dict] = None) -> None:
        emit(GraphEvent(type="node_end", node=name, elapsed_ms=int((time.time() - t) * 1000), payload=payload))

    # 1. Analyst
    t = stage("analyst")
    mem = recall_memory(supply_chain_id=supply_chain_id, query=event.title)
    memories = (mem["content"][0].get("json", {}) or {}).get("memories", []) if mem.get("status") == "success" else []
    a = analyst.run_analyst(analyst.build(hooks), twin, event, memories)
    done("analyst", t, {"severity": a.severity.value, "confidence": a.confidence, "failed": a.failed_node_ids, "affected": a.affected_node_ids,
                        "needs_review": a.needs_review})

    notification_id = db.insert_notification(user_id, supply_chain_id, a) if persist else None
    if not severity_gate(a):
        emit(GraphEvent(type="result", payload={"status": "notified", "notification_id": notification_id}))
        return IncidentResult(a, None, None, None, None, None, None, notification_id, trace_id, "notified", order)

    # 2. Deterministic routing — never the LLM
    t = stage("routing_engine")
    plan = reroute_plan(twin, a.failed_node_ids, a.failed_edge_ids, k=3)
    done("routing_engine", t, {"feasible": plan.feasible_count, "infeasible": plan.infeasible_count, "candidates": len(plan.candidates),
                               "severity": plan.severity})

    # 3. Strands Graph: router ∥ impact → strategist (typed outputs on every node)
    ranking: Optional[RouteRanking] = None
    imp: Optional[ImpactEstimate] = None
    mit: Optional[MitigationPlan] = None
    status = "decision"
    t = stage("graph")
    try:
        delay = max([c.added_days for c in plan.candidates if c.feasible] or [7.0])
        task = (
            f"Supply chain id: {supply_chain_id}\nDisruption: {a.model_dump_json()}\nSevered pairs: {plan.severed_pairs}\n"
            f"Best feasible reroute adds {delay} days; infeasible lanes: {plan.infeasible_count}.\n"
            f"Route candidates (computed exactly by the routing engine — do not recompute):\n{_candidates_block(twin, plan)}\n\n"
            "Instructions by role — only follow the line for your own role:\n"
            "- router: rank the feasible candidates by added cost/days/risk and decide whether waiting is viable.\n"
            "- impact: quantify the business impact; you are the only node with estimate_impact_numbers — call it first.\n"
            "- strategist: you receive the router and impact outputs as input; write the mitigation plan. Do not call tools you don't have."
        )

        def attempt(model):
            gb = GraphBuilder()
            gb.add_node(router.build(hooks, structured=True, model=model), "router")
            gb.add_node(impact.build(hooks, structured=True, model=model), "impact")
            gb.add_node(strategist.build(hooks, structured=True, model=model), "strategist")
            gb.add_edge("router", "strategist")
            gb.add_edge("impact", "strategist")
            gb.set_entry_point("router")
            gb.set_entry_point("impact")
            gb.set_execution_timeout(150)
            return gb.build()(task)

        gres = invoke_with_retry("orchestrator", attempt)
        exec_order = [n.node_id for n in gres.execution_order]
        order.extend(exec_order)
        ranking = _structured(gres, "router", RouteRanking)
        imp = _structured(gres, "impact", ImpactEstimate)
        mit = _structured(gres, "strategist", MitigationPlan)
        done("graph", t, {"status": str(gres.status), "order": exec_order,
                          "usage": dict(gres.accumulated_usage) if gres.accumulated_usage else None})
    except Exception as e:  # graph failure must not lose the deterministic result
        emit(GraphEvent(type="error", node="graph", payload={"error": str(e)}))
        status = "partial"

    # Fallbacks: any node that did not yield a typed result gets a single structured pass.
    if ranking is None:
        t = stage("router")
        try:
            ranking = router.run_router(router.build(hooks), twin, a, plan)
        except Exception as e:
            emit(GraphEvent(type="error", node="router", payload={"error": str(e)}))
            feasible = [c for c in plan.candidates if c.feasible]
            ranking = RouteRanking(ranked_candidate_ids=[c.id for c in feasible], recommended_candidate_id=feasible[0].id if feasible else None,
                                   rationale="Model unavailable — ranked by lowest added cost (deterministic fallback). Needs review.",
                                   tradeoffs=[], wait_is_viable=False, wait_rationale="Unknown — model unavailable.")
            status = "partial"
        done("router", t, {"recommended": ranking.recommended_candidate_id})
    else:
        ranking = _sanitise(ranking, plan)
    if imp is None:
        t = stage("impact")
        try:
            imp = impact.run_impact(impact.build(hooks), twin, a, plan)
        except Exception as e:
            emit(GraphEvent(type="error", node="impact", payload={"error": str(e)}))
            status = "partial"
        done("impact", t, {"revenue_at_risk_usd": imp.revenue_at_risk_usd if imp else None})
    if mit is None and imp is not None:
        t = stage("strategist")
        try:
            mit = strategist.run_strategist(strategist.build(hooks), twin, a, ranking, imp)
        except Exception as e:
            emit(GraphEvent(type="error", node="strategist", payload={"error": str(e)}))
            status = "partial"
        done("strategist", t, {"steps": len(mit.steps) if mit else 0})

    decision = build_decision(twin, a, plan, ranking, imp, mit, trace_id)
    if status == "partial":
        decision.confidence = min(decision.confidence, 0.5)
    decision_id = db.insert_decision(user_id, decision, plan.candidates) if persist else None
    if persist:
        db.insert_audit(user_id, "IncidentGraph", f"Decision created: {decision.title}",
                        {"decision_id": decision_id, "trace_id": trace_id, "elapsed_ms": int((time.time() - t0) * 1000), "order": order})
    emit(GraphEvent(type="result", payload={"status": status, "decision_id": decision_id}))
    return IncidentResult(a, plan, ranking, imp, mit, decision, decision_id, notification_id, trace_id, status, order)


def _sanitise(r: RouteRanking, plan: ReroutePlan) -> RouteRanking:
    feasible = {c.id: c for c in plan.candidates if c.feasible}
    r.ranked_candidate_ids = [i for i in r.ranked_candidate_ids if i in feasible] or sorted(
        feasible, key=lambda i: (feasible[i].added_cost, feasible[i].added_days)
    )
    if r.recommended_candidate_id not in feasible:
        r.recommended_candidate_id = r.ranked_candidate_ids[0] if r.ranked_candidate_ids else None
    return r
