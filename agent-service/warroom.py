"""War-room: compare several what-if scenarios side by side. Pure routing/flow math."""
from __future__ import annotations

from dataclasses import asdict, dataclass

from routing import blast_radius, flow_value_at_risk, lanes_through, monte_carlo_cascade, reroute_plan
from schemas import Twin


@dataclass
class ScenarioIn:
    name: str
    failed_node_ids: list[str]
    failed_edge_ids: list[str]
    duration_days: float = 14


@dataclass
class ScenarioOut:
    name: str
    failed: list[str]
    severity: str
    lanes_affected: int
    lanes_cut: int
    best_added_cost: float
    best_added_days: float
    reroute_cost_over_duration: float
    value_at_risk_usd: float
    downstream_nodes: int
    p_network_failure: float
    recommended: str


def compare(twin: Twin, scenarios: list[ScenarioIn]) -> list[ScenarioOut]:
    labels = {n.id: n.label for n in twin.nodes}
    out: list[ScenarioOut] = []
    for sc in scenarios:
        plan = reroute_plan(twin, sc.failed_node_ids, sc.failed_edge_ids, k=1)
        feas = [c for c in plan.candidates if c.feasible]
        best_cost = max((c.added_cost for c in feas), default=0.0)
        best_days = max((c.added_days for c in feas), default=0.0)
        lanes = lanes_through(twin, sc.failed_node_ids, sc.failed_edge_ids)
        var = flow_value_at_risk(twin, lanes)
        weekly = sum(var.values())
        value_at_risk = weekly * sc.duration_days / 7.0 if weekly else 0.0
        weeks = max(sc.duration_days / 7.0, 1.0)
        reroute_total = sum(c.added_cost_per_week or c.added_cost for c in feas) * weeks
        br = blast_radius(twin, sc.failed_node_ids, sc.failed_edge_ids)
        mc = monte_carlo_cascade(twin, sc.failed_node_ids, runs=300) if sc.failed_node_ids else None
        if plan.infeasible_count:
            rec = "No full bypass — mitigate (alternate supplier / buffer stock) and escalate."
        elif not lanes:
            rec = "No lane is affected — monitor only."
        elif value_at_risk and reroute_total < value_at_risk:
            rec = f"Reroute: ${reroute_total:,.0f} over {sc.duration_days:.0f}d protects ${value_at_risk:,.0f} of flow."
        elif value_at_risk:
            rec = f"Waiting may be cheaper: reroute ${reroute_total:,.0f} vs ${value_at_risk:,.0f} at risk — check days of cover."
        else:
            rec = f"Reroute available at +${best_cost:,.0f} / +{best_days:.0f}d (add flows for value-based advice)."
        out.append(ScenarioOut(sc.name, [labels.get(i, i) for i in sc.failed_node_ids] + [i for i in sc.failed_edge_ids], plan.severity if lanes else "LOW", len(lanes), plan.infeasible_count,
                               best_cost, best_days, round(reroute_total, 0), round(value_at_risk, 0), len(br.downstream_node_ids), mc.p_network_failure if mc else 0.0, rec))
    return out


def presets(twin: Twin) -> list[ScenarioIn]:
    """Useful starting scenarios: each country outage, the two most fragile sites together, every port."""
    by_country: dict[str, list[str]] = {}
    for n in twin.nodes:
        if n.country:
            by_country.setdefault(n.country.upper(), []).append(n.id)
    out = [ScenarioIn(f"All sites in {c} down", ids, [], 14) for c, ids in sorted(by_country.items()) if len(ids) >= 1][:6]
    ports = [n.id for n in twin.nodes if "port" in n.type.lower()]
    if len(ports) >= 2:
        out.append(ScenarioIn("Two busiest ports closed", ports[:2], [], 21))
    from resilience import audit

    rep = audit(twin)
    top = [c.id for c in rep.cases if c.kind == "node"][:2] or [c.id for c in rep.cases][:2]
    if len(top) == 2:
        out.append(ScenarioIn("Two most fragile sites down", top, [], 14))
    return out


def to_dicts(rows: list[ScenarioOut]) -> list[dict]:
    return [asdict(r) for r in rows]
