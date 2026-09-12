"""Report agents that feed the existing web screens (simulation results, mitigation strategies, forecast cards, live intel).

Each one is a Strands Agent with a typed output; every number they receive comes from routing.py first.
"""
from __future__ import annotations

import json
from typing import Any, Optional

from routing import monte_carlo_cascade, network_stats, reroute_plan
from schemas import ForecastReport, LiveIntelReport, NodeRisk, SimulationReport, StrategyReport, Twin
from tools.intel import search_news
from tools.memory import recall_memory

from .base import call_structured, make_agent

SIM_PROMPT = """You are the Simulation analyst for a supply chain digital twin. You receive a disruption scenario and DETERMINISTIC
pre-computed facts: blast radius, reroute candidates with exact added cost/days, Monte Carlo cascade probabilities and network statistics.
Write the impact report for an operations director. Every number you state must be consistent with the facts given; when you must estimate
(e.g. total cost impact in USD), derive it from lane costs, added reroute cost and delay days and say so in keyFindings.
Use the exact node labels. networkAnalysis must copy the provided statistics verbatim. Give 3-5 mitigation strategies and 2-5 cascading effects."""

STRAT_PROMPT = """You are the Mitigation Strategist. Using the scenario, impact facts and reroute candidates, produce an execution-ready
portfolio of strategies: 2-3 immediate (this week), 2-3 shortTerm (this quarter), 1-3 longTerm (structural). Ids 1..n unique across all.
Costs as strings like "$120K – $180K". riskMitigationMetrics.currentRisk/targetRisk are 0-100. Reuse what worked before from the past memories given."""

FORECAST_PROMPT = """You are the Forecaster. Produce 2-4 forward-looking disruption scenarios for the next horizon days for THIS twin, grounded
in recent news (search_news) and geography. affectedNode must be an exact node label from the twin. Severity and duration should vary."""

LIVE_PROMPT = """You are the Live Intelligence scanner. For each node, search recent news for its region/country and assign a risk score:
0.10-0.30 calm, 0.31-0.60 elevated, 0.61-0.80 high, 0.81-0.99 critical disruption in progress. Every node in the request must appear in nodeRisks.
Include source URLs you used. disruptionsFound is true only if any node scores > 0.80."""


def _facts(twin: Twin, failed_ids: list[str], severity_pct: float, duration_days: float, threshold_pct: float, runs: int) -> dict[str, Any]:
    plan = reroute_plan(twin, failed_ids, [], k=3)
    stats = network_stats(twin)
    mc = monte_carlo_cascade(twin, failed_ids, runs=min(max(runs, 100), 5000), severity=max(0.1, min(severity_pct / 100.0, 0.95)),
                             failure_threshold_pct=threshold_pct)
    labels = {n.id: n.label for n in twin.nodes}
    return {
        "failed": [labels.get(i, i) for i in failed_ids],
        "severed_pairs": [(labels.get(a, a), labels.get(b, b)) for a, b in plan.severed_pairs],
        "reroute": {"severity": plan.severity, "feasible": plan.feasible_count, "infeasible": plan.infeasible_count,
                     "candidates": [{"route": " → ".join(c.labels), "added_cost": c.added_cost, "added_days": c.added_days, "feasible": c.feasible}
                                    for c in plan.candidates]},
        "monte_carlo": {"runs": mc.runs, "mean_nodes_hit": mc.mean_nodes_hit, "p_network_failure": mc.p_network_failure,
                         "node_hit_probability": {labels.get(k, k): v for k, v in mc.node_hit_probability.items() if v > 0}},
        "network": {"totalNodes": stats.total_nodes, "totalEdges": stats.total_edges, "networkDensity": stats.density,
                     "criticalNodes": [labels.get(i, i) for i in stats.critical_nodes], "singlePointsOfFailure": [labels.get(i, i) for i in stats.single_points_of_failure],
                     "alternativeRoutes": stats.alternative_routes, "averageShortestPath": stats.average_shortest_path},
        "lane_cost_total_usd": sum(e.cost for e in twin.edges),
        "duration_days": duration_days,
    }


def resolve_node_ids(twin: Twin, refs: list[str]) -> list[str]:
    """Accept ids or labels (the simulation form stores whichever the user picked)."""
    by_label = {n.label.lower(): n.id for n in twin.nodes}
    ids = {n.id for n in twin.nodes}
    out = []
    for r in refs:
        if not r:
            continue
        if r in ids:
            out.append(r)
        elif r.lower() in by_label:
            out.append(by_label[r.lower()])
    return out


def run_simulation_report(hooks, twin: Twin, simulation: dict) -> SimulationReport:
    params = simulation.get("parameters") or {}
    refs = params.get("affected_nodes") or params.get("affectedNode") or []
    refs = refs if isinstance(refs, list) else [refs]
    failed = resolve_node_ids(twin, [str(r) for r in refs])
    if not failed:
        stats = network_stats(twin)
        failed = stats.critical_nodes[:1] or [twin.nodes[0].id]
    sev = float(params.get("severity") or params.get("disruptionSeverity") or 70)
    dur = float(params.get("duration") or params.get("disruptionDuration") or 14)
    facts = _facts(twin, failed, sev, dur, float(params.get("failureThreshold") or 40), int(params.get("monteCarloRuns") or 1000))
    agent = make_agent("impact", SIM_PROMPT, hooks=hooks, name="simulation")
    report: SimulationReport = call_structured(
        agent,
        f"Scenario: {simulation.get('name')} ({simulation.get('scenario_type')})\nParameters: {json.dumps(params)}\n"
        f"Twin '{twin.name}': nodes={[(n.label, n.type, n.country) for n in twin.nodes]}\nFACTS (deterministic):\n{json.dumps(facts, indent=1)}\n\nWrite the report.",
        SimulationReport,
        prefer_json=True,
    )
    report.networkAnalysis = report.networkAnalysis.model_copy(update=facts["network"])
    return report


def run_strategy_report(hooks, twin: Twin, simulation: dict, impact: Optional[dict]) -> StrategyReport:
    params = simulation.get("parameters") or {}
    refs = params.get("affected_nodes") or params.get("affectedNode") or []
    refs = refs if isinstance(refs, list) else [refs]
    failed = resolve_node_ids(twin, [str(r) for r in refs]) or [twin.nodes[0].id]
    plan = reroute_plan(twin, failed, [], k=3)
    mem = recall_memory(supply_chain_id=twin.supply_chain_id, query=str(simulation.get("name") or "disruption"))
    memories = (mem["content"][0].get("json", {}) or {}).get("memories", []) if mem.get("status") == "success" else []
    agent = make_agent("strategist", STRAT_PROMPT, hooks=hooks, name="strategy_report")
    return call_structured(
        agent,
        f"Supply chain id: {twin.supply_chain_id}\nScenario: {simulation.get('name')} ({simulation.get('scenario_type')}) params={json.dumps(params)}\n"
        f"Past memories: {memories or 'none'}\n"
        f"Impact facts: {json.dumps(impact)[:3000] if impact else 'n/a'}\n"
        f"Reroute candidates: {[(' → '.join(c.labels), c.added_cost, c.added_days, c.feasible) for c in plan.candidates]}\n"
        f"Nodes: {[(n.label, n.type, n.country) for n in twin.nodes]}\nBuild the strategy portfolio.",
        StrategyReport,
        prefer_json=True,
    )


def run_forecast_report(hooks, twin: Twin, horizon_days: int, node_label: Optional[str] = None) -> ForecastReport:
    agent = make_agent("forecaster", FORECAST_PROMPT, tools=[search_news, recall_memory], hooks=hooks, name="forecast_report")
    return call_structured(
        agent,
        f"Supply chain id: {twin.supply_chain_id} '{twin.name}'. Horizon: {horizon_days} days. {('Focus node: ' + node_label) if node_label else ''}\n"
        f"Nodes: {[(n.label, n.type, n.country) for n in twin.nodes]}\nLanes: {[(e.source, e.target, e.mode) for e in twin.edges]}\nForecast.",
        ForecastReport,
    )


def run_live_intel(hooks, nodes: list[dict]) -> LiveIntelReport:
    agent = make_agent("sentinel", LIVE_PROMPT, tools=[search_news], hooks=hooks, name="live_intel")
    compact = [{"id": n.get("id"), "label": n.get("label") or n.get("name"), "country": n.get("country"), "type": n.get("type")} for n in nodes]
    rep: LiveIntelReport = call_structured(agent, f"Nodes to score: {json.dumps(compact)}\nScan now.", LiveIntelReport)
    seen = {r.nodeId for r in rep.nodeRisks}
    for n in compact:  # every node must be present for the twin's status colouring
        if n["id"] not in seen:
            rep.nodeRisks.append(NodeRisk(nodeId=n["id"], riskScore=0.2, reason="No relevant news found."))
    return rep
