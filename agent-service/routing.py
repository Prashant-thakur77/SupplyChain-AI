"""Pure graph math for the twin. No LLM here.

- shortest_path: weighted Dijkstra (directed — supply flows one way)
- k_best_routes: Yen's k-shortest loopless paths around failed nodes/edges
- blast_radius: downstream reachability from a failure
- reroute_plan: everything the Router agent needs, with exact cost/day deltas
"""
from __future__ import annotations

import heapq
from dataclasses import dataclass, field
from typing import Optional

from schemas import RouteCandidate, Twin, TwinEdge


@dataclass
class Graph:
    labels: dict[str, str]
    adj: dict[str, list[TwinEdge]]
    edges: dict[str, TwinEdge]


@dataclass
class Path:
    path: list[str]
    edge_ids: list[str]
    cost: float
    days: float
    max_risk: float


@dataclass
class BlastRadius:
    downstream_node_ids: list[str]
    broken_edge_ids: list[str]
    severed_pairs: list[tuple[str, str]]


@dataclass
class ReroutePlan:
    candidates: list[RouteCandidate]
    severed_pairs: list[tuple[str, str]]
    feasible_count: int
    infeasible_count: int
    severity: str
    baseline: dict[str, float] = field(default_factory=dict)
    carbon_weight: float = 0.0


def build_graph(twin: Twin) -> Graph:
    labels = {n.id: n.label for n in twin.nodes}
    adj: dict[str, list[TwinEdge]] = {n.id: [] for n in twin.nodes}
    for e in twin.edges:
        adj.setdefault(e.source, []).append(e)
        adj.setdefault(e.target, [])
        labels.setdefault(e.source, e.source)
        labels.setdefault(e.target, e.target)
    return Graph(labels=labels, adj=adj, edges={e.id: e for e in twin.edges})


def _weight(e: TwinEdge, weight: str) -> float:
    return e.cost if weight == "cost" else e.transit_days


def _path_from_edges(g: Graph, nodes: list[str], edge_ids: list[str]) -> Path:
    es = [g.edges[i] for i in edge_ids]
    return Path(
        path=nodes,
        edge_ids=edge_ids,
        cost=sum(e.cost for e in es),
        days=sum(e.transit_days for e in es),
        max_risk=max((e.risk_multiplier for e in es), default=1.0),
    )


def shortest_path(
    g: Graph,
    src: str,
    dst: str,
    avoid_nodes: Optional[set[str]] = None,
    avoid_edges: Optional[set[str]] = None,
    weight: str = "cost",
) -> Optional[Path]:
    avoid_nodes = avoid_nodes or set()
    avoid_edges = avoid_edges or set()
    if src in avoid_nodes or dst in avoid_nodes:
        return None
    if src == dst:
        return Path(path=[src], edge_ids=[], cost=0, days=0, max_risk=1.0)

    dist: dict[str, float] = {src: 0.0}
    prev: dict[str, tuple[str, TwinEdge]] = {}
    pq: list[tuple[float, str]] = [(0.0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if u == dst:
            break
        if d > dist.get(u, float("inf")):
            continue
        for e in g.adj.get(u, []):
            if e.target in avoid_nodes or e.id in avoid_edges:
                continue
            nd = d + _weight(e, weight)
            if nd < dist.get(e.target, float("inf")):
                dist[e.target] = nd
                prev[e.target] = (u, e)
                heapq.heappush(pq, (nd, e.target))
    if dst not in dist:
        return None

    nodes, edge_ids, cur = [dst], [], dst
    while cur != src:
        p, e = prev[cur]
        nodes.append(p)
        edge_ids.append(e.id)
        cur = p
    nodes.reverse()
    edge_ids.reverse()
    return _path_from_edges(g, nodes, edge_ids)


def blast_radius(twin: Twin, failed_node_ids: list[str], failed_edge_ids: list[str]) -> BlastRadius:
    g = build_graph(twin)
    failed = set(failed_node_ids)
    broken = {e.id for e in twin.edges if e.source in failed or e.target in failed} | set(failed_edge_ids)

    # Downstream = everything reachable (following edge direction) from the failure.
    seeds = set(failed) | {g.edges[i].target for i in broken if i in g.edges}
    seen: set[str] = set()
    stack = list(seeds)
    while stack:
        u = stack.pop()
        for e in g.adj.get(u, []):
            if e.target not in seen and e.target not in failed:
                seen.add(e.target)
                stack.append(e.target)
    downstream = sorted(seen - failed)

    preds = {g.edges[i].source for i in broken if i in g.edges and g.edges[i].source not in failed}
    succs = {g.edges[i].target for i in broken if i in g.edges and g.edges[i].target not in failed}
    severed = sorted({(p, s) for p in preds for s in succs if p != s})
    return BlastRadius(downstream_node_ids=downstream, broken_edge_ids=sorted(broken), severed_pairs=severed)


def _to_candidate(g: Graph, p: Path, idx: int, origin: str, destination: str, base: Optional[Path]) -> RouteCandidate:
    bc = base.cost if base else p.cost
    bd = base.days if base else p.days
    co2 = round(sum(g.edges[i].co2_kg for i in p.edge_ids if i in g.edges), 1)
    bco2 = round(sum(g.edges[i].co2_kg for i in base.edge_ids if i in g.edges), 1) if base else co2
    return RouteCandidate(
        id=f"r{idx}",
        origin=origin,
        destination=destination,
        path=p.path,
        labels=[g.labels.get(n, n) for n in p.path],
        modes=[g.edges[i].mode for i in p.edge_ids],
        co2_kg=co2, baseline_co2_kg=bco2, added_co2_kg=round(co2 - bco2, 1),
        cost=p.cost,
        transit_days=p.days,
        max_risk=p.max_risk,
        baseline_cost=bc,
        baseline_days=bd,
        added_cost=p.cost - bc,
        added_days=p.days - bd,
        feasible=True,
    )


def k_best_routes(
    twin: Twin,
    origin: str,
    destination: str,
    failed_node_ids: list[str],
    failed_edge_ids: list[str],
    k: int = 3,
) -> list[RouteCandidate]:
    """Yen's k-shortest loopless paths on cost, avoiding failures. Baseline = healthy-network shortest path."""
    g = build_graph(twin)
    base = shortest_path(g, origin, destination)
    avoid_n, avoid_e = set(failed_node_ids), set(failed_edge_ids)
    first = shortest_path(g, origin, destination, avoid_n, avoid_e)
    if not first:
        return []

    A: list[Path] = [first]
    B: list[tuple[float, int, Path]] = []
    counter = 0
    for _ in range(1, k):
        prev_path = A[-1]
        for i in range(len(prev_path.path) - 1):
            spur = prev_path.path[i]
            root_nodes = prev_path.path[: i + 1]
            root_edges = prev_path.edge_ids[:i]
            removed = set(avoid_e)
            for p in A:
                if p.path[: i + 1] == root_nodes and len(p.edge_ids) > i:
                    removed.add(p.edge_ids[i])
            sp = shortest_path(g, spur, destination, avoid_n | set(root_nodes[:-1]), removed)
            if not sp:
                continue
            total = _path_from_edges(g, root_nodes[:-1] + sp.path, root_edges + sp.edge_ids)
            if all(total.path != p.path for p in A) and all(total.path != b[2].path for b in B):
                counter += 1
                heapq.heappush(B, (total.cost, counter, total))
        if not B:
            break
        A.append(heapq.heappop(B)[2])
    return [_to_candidate(g, p, i + 1, origin, destination, base) for i, p in enumerate(A)]


def lanes_through(twin: Twin, failed_node_ids: list[str], failed_edge_ids: list[str]) -> list[tuple[str, str]]:
    """Origin→destination lanes whose healthy shortest path crosses the failure.

    Lanes are (source, sink) pairs — sources have no inbound edges, sinks no outbound. That is what an operator reroutes
    ("Shenzhen → Berlin"), not an arbitrary local segment. Falls back to predecessor→successor segments for cyclic twins.
    """
    g = build_graph(twin)
    failed_n, failed_e = set(failed_node_ids), set(failed_edge_ids)
    indeg = {n.id: 0 for n in twin.nodes}
    outdeg = {n.id: 0 for n in twin.nodes}
    for e in twin.edges:
        outdeg[e.source] = outdeg.get(e.source, 0) + 1
        indeg[e.target] = indeg.get(e.target, 0) + 1
    # Failed endpoints stay in the lists on purpose: a lane whose origin or destination is down has no bypass at all.
    sources = [n.id for n in twin.nodes if indeg.get(n.id, 0) == 0 and outdeg.get(n.id, 0) > 0]
    sinks = [n.id for n in twin.nodes if outdeg.get(n.id, 0) == 0 and indeg.get(n.id, 0) > 0]
    lanes: list[tuple[str, str]] = []
    healthy_lanes = 0
    for a in sources:
        for b in sinks:
            base = shortest_path(g, a, b)
            if not base:
                continue
            healthy_lanes += 1
            if failed_n & set(base.path) or failed_e & set(base.edge_ids):
                lanes.append((a, b))
    if healthy_lanes or not (failed_n or failed_e):
        return lanes  # a failure the healthy lanes never touch is simply not a routing problem
    # Fallback only for cyclic twins with no sources/sinks: local segments around the failed nodes.
    br = blast_radius(twin, failed_node_ids, failed_edge_ids)
    return [(p_, s_) for p_, s_ in br.severed_pairs if (bp := shortest_path(g, p_, s_)) and (failed_n & set(bp.path) or failed_e & set(bp.edge_ids))]


def flow_value_at_risk(twin: Twin, lanes: list[tuple[str, str]]) -> dict[tuple[str, str], float]:
    """Weekly commercial value moving on each origin→destination lane (0 when the twin has no flows)."""
    out: dict[tuple[str, str], float] = {}
    for f in twin.flows:
        key = (f.origin, f.destination)
        if key in lanes:
            out[key] = out.get(key, 0.0) + f.value_per_week
    return out


def _apply_flows(twin: Twin, candidates: list[RouteCandidate]) -> None:
    if not twin.flows:
        return
    by_lane: dict[tuple[str, str], list] = {}
    for f in twin.flows:
        by_lane.setdefault((f.origin, f.destination), []).append(f)
    for c in candidates:
        fl = by_lane.get((c.origin, c.destination))
        if not fl:
            continue
        units = sum(f.units_per_week for f in fl)
        c.weekly_value = sum(f.value_per_week for f in fl)
        c.added_cost_per_week = round(c.added_cost * max(units / 100.0, 1.0), 0) if c.feasible else 0  # ~100 units per container/truck
        c.delay_penalty = round(c.added_days * sum(f.penalty_per_day for f in fl), 0) if c.feasible else 0
        cover = [f.inventory_days for f in fl if f.inventory_days]
        c.days_of_cover = min(cover) if cover else None


DEFAULT_CARBON_PRICE = 100.0  # USD per tonne CO2e used to fold carbon into the ranking objective


def objective(c: RouteCandidate, carbon_weight: float = 0.0, carbon_price: float = DEFAULT_CARBON_PRICE) -> float:
    """Weighted cost the engine ranks on: added USD + carbon_weight × added tCO2e × carbon price."""
    return c.added_cost + carbon_weight * (c.added_co2_kg / 1000.0) * carbon_price


def reroute_plan(twin: Twin, failed_node_ids: list[str], failed_edge_ids: list[str], k: int = 3, carbon_weight: float = 0.0, carbon_price: float = DEFAULT_CARBON_PRICE) -> ReroutePlan:
    g = build_graph(twin)
    lanes = lanes_through(twin, failed_node_ids, failed_edge_ids)
    candidates: list[RouteCandidate] = []
    feasible = infeasible = 0
    idx = 0
    for p, s in lanes:
        routes = k_best_routes(twin, p, s, failed_node_ids, failed_edge_ids, k)
        if routes:
            feasible += 1
            for r in routes:
                idx += 1
                r.id = f"r{idx}"
                candidates.append(r)
        else:
            infeasible += 1
            idx += 1
            candidates.append(
                RouteCandidate(
                    id=f"r{idx}", origin=p, destination=s, path=[], labels=[g.labels.get(p, p), g.labels.get(s, s)], modes=[],
                    cost=0, transit_days=0, max_risk=0, baseline_cost=0, baseline_days=0, added_cost=0, added_days=0, feasible=False,
                )
            )
    _apply_flows(twin, candidates)
    candidates.sort(key=lambda c: (not c.feasible, objective(c, carbon_weight, carbon_price), c.added_days))

    if infeasible:
        sev = "CRITICAL"
    elif any(c.added_cost > 0 or c.added_days > 0 for c in candidates):
        sev = "HIGH" if any(c.added_days >= 5 for c in candidates if c.feasible) else "MEDIUM"
    else:
        sev = "LOW"
    baseline = {}
    if candidates and candidates[0].feasible:
        baseline = {"cost": candidates[0].baseline_cost, "days": candidates[0].baseline_days}
    return ReroutePlan(candidates=candidates, severed_pairs=lanes, feasible_count=feasible,
                       infeasible_count=infeasible, severity=sev, baseline=baseline, carbon_weight=carbon_weight)


# ---- Network statistics & Monte Carlo cascade (deterministic, used by the simulation report) --------------------------
@dataclass
class NetworkStats:
    total_nodes: int
    total_edges: int
    density: float
    single_points_of_failure: list[str]
    critical_nodes: list[str]
    alternative_routes: int
    average_shortest_path: float


def network_stats(twin: Twin) -> NetworkStats:
    g = build_graph(twin)
    n, m = len(twin.nodes), len(twin.edges)
    density = m / (n * (n - 1)) if n > 1 else 0.0
    spof: list[str] = []
    crit: list[tuple[float, str]] = []
    for node in twin.nodes:
        plan = reroute_plan(twin, [node.id], [], k=1)
        if plan.severed_pairs and plan.infeasible_count > 0:
            spof.append(node.id)
        br = blast_radius(twin, [node.id], [])
        crit.append((len(br.downstream_node_ids) + (1 if plan.infeasible_count else 0), node.id))
    crit.sort(reverse=True)
    critical = [nid for score, nid in crit if score > 0][:5]
    alt = 0
    lengths: list[int] = []
    ids = [x.id for x in twin.nodes]
    for a in ids:
        for b in ids:
            if a == b:
                continue
            p = shortest_path(g, a, b)
            if p:
                lengths.append(len(p.path) - 1)
                alt += max(0, len(k_best_routes(twin, a, b, [], [], k=2)) - 1)
    return NetworkStats(n, m, round(density, 3), spof, critical, alt, round(sum(lengths) / len(lengths), 2) if lengths else 0.0)


@dataclass
class CascadeResult:
    runs: int
    node_hit_probability: dict[str, float]
    mean_nodes_hit: float
    p_network_failure: float


def monte_carlo_cascade(twin: Twin, failed_node_ids: list[str], runs: int = 1000, severity: float = 0.7,
                        failure_threshold_pct: float = 40.0, seed: int = 7) -> CascadeResult:
    """Each downstream hop propagates with probability severity * risk_multiplier (capped at 0.95)."""
    import random as _r

    rng = _r.Random(seed)
    g = build_graph(twin)
    hits: dict[str, int] = {n.id: 0 for n in twin.nodes}
    total_hit = 0
    failures = 0
    n_total = max(len(twin.nodes), 1)
    for _ in range(runs):
        down = set(failed_node_ids)
        frontier = list(failed_node_ids)
        while frontier:
            u = frontier.pop()
            for e in g.adj.get(u, []):
                if e.target in down:
                    continue
                if rng.random() < min(0.95, severity * e.risk_multiplier):
                    down.add(e.target)
                    frontier.append(e.target)
        for nid in down:
            hits[nid] = hits.get(nid, 0) + 1
        total_hit += len(down)
        if 100.0 * len(down) / n_total >= failure_threshold_pct:
            failures += 1
    return CascadeResult(runs, {k: round(v / runs, 3) for k, v in hits.items()}, round(total_hit / runs, 2), round(failures / runs, 3))
