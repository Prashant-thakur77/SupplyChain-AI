"""Demand shocks on the twin — couple a demand change to flows and see what breaks first.

Deterministic: for each flow whose destination is in scope, scale units by the multiplier, walk the baseline path,
check lane capacity (edges.capacity = units/week when set), and time the stock-out from days of cover.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from routing import build_graph, shortest_path
from schemas import Twin

UNITS_PER_SHIPMENT = 100.0  # same convention as the flow-weighted routing (~100 units per container/truck)


@dataclass
class LaneImpact:
    origin: str
    destination: str
    label: str
    product: str | None
    base_units: float
    new_units: float
    extra_units: float
    extra_cost_per_week: float
    days_of_cover_before: float | None
    days_of_cover_after: float | None
    saturated_lanes: list[str]      # lane ids on the baseline path whose capacity is exceeded
    shortfall_units: float          # units/week that cannot move because of capacity
    lost_value_per_week: float


@dataclass
class DemandShockReport:
    multiplier: float
    duration_weeks: int
    scope: list[str]
    lanes: list[LaneImpact] = field(default_factory=list)
    extra_cost_total: float = 0
    lost_value_total: float = 0
    first_stockout_days: float | None = None
    saturated: list[str] = field(default_factory=list)
    summary: list[str] = field(default_factory=list)


def simulate(twin: Twin, multiplier: float, duration_weeks: int = 4, destination_ids: list[str] | None = None) -> DemandShockReport:
    g = build_graph(twin)
    labels = g.labels
    scope = set(destination_ids or [])
    rep = DemandShockReport(multiplier=multiplier, duration_weeks=duration_weeks, scope=[labels.get(d, d) for d in scope] or ["all destinations"])
    load: dict[str, float] = {}  # edge id → units/week after shock
    per_flow = []
    for f in twin.flows:
        if scope and f.destination not in scope:
            continue
        p = shortest_path(g, f.origin, f.destination)
        if not p:
            continue
        new_units = f.units_per_week * multiplier
        for e in p.edge_ids:
            load[e] = load.get(e, 0) + new_units
        per_flow.append((f, p, new_units))
    cap_hit = {e for e, u in load.items() if g.edges[e].capacity and u > g.edges[e].capacity}
    for f, p, new_units in per_flow:
        sat = [e for e in p.edge_ids if e in cap_hit]
        # shortfall: pro-rata share of the tightest lane's excess
        shortfall = 0.0
        for e in sat:
            excess = load[e] - g.edges[e].capacity
            shortfall = max(shortfall, excess * (new_units / load[e]))
        extra_units = new_units - f.units_per_week
        lane_cost_per_unit = p.cost / UNITS_PER_SHIPMENT
        extra_cost = round(max(0.0, extra_units - shortfall) * lane_cost_per_unit, 0)
        doc_before = f.inventory_days or None
        doc_after = round(f.inventory_days / multiplier, 1) if f.inventory_days and multiplier > 0 else None
        li = LaneImpact(origin=f.origin, destination=f.destination, label=f"{labels.get(f.origin, f.origin)} → {labels.get(f.destination, f.destination)}", product=f.product,
                        base_units=f.units_per_week, new_units=round(new_units, 0), extra_units=round(extra_units, 0), extra_cost_per_week=extra_cost,
                        days_of_cover_before=doc_before, days_of_cover_after=doc_after, saturated_lanes=[f"{labels.get(g.edges[e].source, '')} → {labels.get(g.edges[e].target, '')}" for e in sat],
                        shortfall_units=round(shortfall, 0), lost_value_per_week=round(shortfall * f.value_per_unit, 0))
        rep.lanes.append(li)
        rep.extra_cost_total += extra_cost
        rep.lost_value_total += li.lost_value_per_week
        if doc_after is not None and (rep.first_stockout_days is None or doc_after < rep.first_stockout_days):
            rep.first_stockout_days = doc_after
    rep.saturated = sorted({s for l in rep.lanes for s in l.saturated_lanes})
    rep.lanes.sort(key=lambda l: (-l.lost_value_per_week, -l.extra_cost_per_week))
    pct = round((multiplier - 1) * 100)
    rep.summary.append(f"Demand {'+' if pct >= 0 else ''}{pct}% for {duration_weeks} week(s) on {', '.join(rep.scope)}.")
    if rep.saturated:
        rep.summary.append(f"{len(rep.saturated)} lane(s) saturate: {', '.join(rep.saturated)} — ${rep.lost_value_total:,.0f}/week of demand cannot be served without extra capacity.")
    else:
        rep.summary.append("No lane hits its capacity limit; the shock is a cost problem, not a capacity problem.")
    rep.summary.append(f"Serving the extra volume costs about ${rep.extra_cost_total:,.0f}/week (${rep.extra_cost_total * duration_weeks:,.0f} over the shock).")
    if rep.first_stockout_days is not None:
        rep.summary.append(f"Stock at the tightest destination now covers {rep.first_stockout_days:.0f} days instead of {max(l.days_of_cover_before or 0 for l in rep.lanes):.0f}.")
    return rep


def to_dict(r: DemandShockReport) -> dict:
    return {"multiplier": r.multiplier, "duration_weeks": r.duration_weeks, "scope": r.scope, "extra_cost_total": r.extra_cost_total, "lost_value_total": r.lost_value_total,
            "first_stockout_days": r.first_stockout_days, "saturated": r.saturated, "summary": r.summary, "lanes": [l.__dict__ for l in r.lanes]}
