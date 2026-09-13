"""Resilience audit: fail every node and every lane, one at a time, and measure what it costs to keep goods moving.

Pure routing math (no LLM). Produces a ranked fragility table, single points of failure, and a 0–100 resilience score.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass

from routing import lanes_through, network_stats, reroute_plan
from schemas import Twin


@dataclass
class FailureCase:
    kind: str  # node | lane
    id: str
    label: str
    lanes_affected: int
    lanes_reroutable: int
    lanes_cut: int  # no bypass at all
    best_added_cost: float  # cheapest bypass across affected lanes (max over lanes = worst lane's best option)
    best_added_days: float
    downstream_nodes: int
    fragility: float  # 0–100


@dataclass
class ResilienceReport:
    score: float  # 0–100, higher is more resilient
    grade: str
    total_lanes: int
    single_points_of_failure: list[str]   # transit hubs with no bypass (fix with a route)
    single_source_sites: list[str]        # origins/destinations with no alternative site (fix with dual sourcing / a second DC)
    cases: list[FailureCase]
    summary: list[str]
    network: dict


def _fragility(case_lanes: int, cut: int, added_cost: float, added_days: float, total_lanes: int) -> float:
    if case_lanes == 0:
        return 0.0
    exposure = case_lanes / max(total_lanes, 1)
    cut_pen = cut / case_lanes
    cost_pen = min(added_cost / 5000.0, 1.0)
    day_pen = min(added_days / 14.0, 1.0)
    return round(min(100.0, 100 * exposure * (0.55 * cut_pen + 0.25 * cost_pen + 0.20 * day_pen + 0.15)), 1)


def audit(twin: Twin) -> ResilienceReport:
    labels = {n.id: n.label for n in twin.nodes}
    base_lanes = lanes_through(twin, [], []) or []
    # Total origin→destination lanes in the healthy network (sources → sinks that are connected)
    from routing import build_graph, shortest_path

    g = build_graph(twin)
    indeg = {n.id: 0 for n in twin.nodes}
    outdeg = {n.id: 0 for n in twin.nodes}
    for e in twin.edges:
        outdeg[e.source] = outdeg.get(e.source, 0) + 1
        indeg[e.target] = indeg.get(e.target, 0) + 1
    sources = [n.id for n in twin.nodes if indeg.get(n.id, 0) == 0]
    sinks = [n.id for n in twin.nodes if outdeg.get(n.id, 0) == 0]
    total_lanes = sum(1 for a in sources for b in sinks if a != b and shortest_path(g, a, b))

    endpoint_ids = set(sources) | set(sinks)
    cases: list[FailureCase] = []
    for n in twin.nodes:
        plan = reroute_plan(twin, [n.id], [], k=1)
        if not plan.severed_pairs:
            continue
        is_endpoint = n.id in endpoint_ids
        feas = [c for c in plan.candidates if c.feasible]
        worst_cost = max((c.added_cost for c in feas), default=0.0)
        worst_days = max((c.added_days for c in feas), default=0.0)
        from routing import blast_radius

        br = blast_radius(twin, [n.id], [])
        frag = _fragility(len(plan.severed_pairs), plan.infeasible_count, worst_cost, worst_days, total_lanes)
        cases.append(FailureCase("endpoint" if is_endpoint else "node", n.id, n.label, len(plan.severed_pairs), plan.feasible_count, plan.infeasible_count, worst_cost, worst_days,
                                 len(br.downstream_node_ids), round(frag * (0.8 if is_endpoint else 1.0), 1)))
    for e in twin.edges:
        plan = reroute_plan(twin, [], [e.id], k=1)
        if not plan.severed_pairs:
            continue
        feas = [c for c in plan.candidates if c.feasible]
        worst_cost = max((c.added_cost for c in feas), default=0.0)
        worst_days = max((c.added_days for c in feas), default=0.0)
        cases.append(FailureCase("lane", e.id, f"{labels.get(e.source, e.source)} → {labels.get(e.target, e.target)} ({e.mode})", len(plan.severed_pairs),
                                 plan.feasible_count, plan.infeasible_count, worst_cost, worst_days, 0,
                                 _fragility(len(plan.severed_pairs), plan.infeasible_count, worst_cost, worst_days, total_lanes)))
    cases.sort(key=lambda c: c.fragility, reverse=True)

    spof = [c.label for c in cases if c.kind == "node" and c.lanes_cut > 0]
    single_sites = [c.label for c in cases if c.kind == "endpoint" and c.lanes_cut > 0]
    worst = max((c.fragility for c in cases), default=0.0)
    mean_top = sum(c.fragility for c in cases[:5]) / max(1, min(5, len(cases)))
    score = round(max(0.0, 100 - (0.6 * worst + 0.4 * mean_top)), 1)
    if spof:
        score = min(score, 50.0)  # a transit single point of failure caps the grade: one event can stop all flow
    elif single_sites:
        score = min(score, 65.0)  # single-sourced endpoints are common but still a structural risk
    grade = "A" if score >= 85 else "B" if score >= 70 else "C" if score >= 55 else "D" if score >= 35 else "E"
    stats = network_stats(twin)
    summary: list[str] = []
    if spof:
        summary.append(f"{len(spof)} single point{'s' if len(spof) > 1 else ''} of failure: {', '.join(spof[:4])}{'…' if len(spof) > 4 else ''}. A failure there cuts a lane with no bypass.")
    if single_sites:
        summary.append(f"Single-sourced: {', '.join(single_sites[:4])}{'…' if len(single_sites) > 4 else ''} — an outage there stops flow; the fix is a second site (dual sourcing / backup DC), not a route.")
    if cases:
        top = cases[0]
        bypass = f"best bypass +${top.best_added_cost:,.0f} / +{top.best_added_days:.0f}d" if top.lanes_cut == 0 else f"{top.lanes_cut} lane{'s' if top.lanes_cut != 1 else ''} with no bypass at all"
        summary.append(f"Most fragile: {top.label} — {top.lanes_affected} lane{'s' if top.lanes_affected != 1 else ''} affected, {bypass}.")
    cheap = [c for c in cases if c.kind == "node" and c.lanes_cut == 0 and c.best_added_cost <= 1500]
    if cheap:
        summary.append(f"{len(cheap)} site{'s' if len(cheap) != 1 else ''} can fail with a bypass under $1,500 — good redundancy there.")
    summary.append(f"Network density {stats.density:.2f}; {stats.alternative_routes} alternative routings exist across {total_lanes} origin→destination lane{'s' if total_lanes != 1 else ''}.")
    return ResilienceReport(score, grade, total_lanes, spof, single_sites, cases, summary,
                            {"totalNodes": stats.total_nodes, "totalEdges": stats.total_edges, "density": stats.density, "alternativeRoutes": stats.alternative_routes,
                             "averageShortestPath": stats.average_shortest_path, "criticalNodes": [labels.get(i, i) for i in stats.critical_nodes]})


def report_to_dict(r: ResilienceReport) -> dict:
    return {"score": r.score, "grade": r.grade, "total_lanes": r.total_lanes, "single_points_of_failure": r.single_points_of_failure, "single_source_sites": r.single_source_sites,
            "cases": [asdict(c) for c in r.cases], "summary": r.summary, "network": r.network}
