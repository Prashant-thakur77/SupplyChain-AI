"""Inventory / safety-stock model — decides deterministically whether "wait and monitor" is survivable.

For every severed lane we know (from flows) the destination's days of cover. Waiting is viable only if the
disruption is expected to clear before the least-covered destination runs dry, with a safety margin.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from routing import ReroutePlan
from schemas import Twin

SAFETY_MARGIN_DAYS = 2.0


@dataclass
class LaneCover:
    origin: str
    destination: str
    label: str
    days_of_cover: float | None
    units_per_week: float
    value_per_week: float
    stockout_in_days: float | None  # cover minus expected outage; negative = stockout
    reroute_days: float | None       # best feasible bypass transit time on this lane


@dataclass
class InventoryPosition:
    expected_outage_days: float
    lanes: list[LaneCover] = field(default_factory=list)
    wait_is_viable: bool = True
    rationale: str = ""
    stockout_lanes: list[str] = field(default_factory=list)
    reroute_beats_stockout: list[str] = field(default_factory=list)  # lanes where the best reroute lands before stockout


def assess(twin: Twin, plan: ReroutePlan, expected_outage_days: float) -> InventoryPosition:
    labels = {n.id: n.label for n in twin.nodes}
    by_lane: dict[tuple[str, str], list] = {}
    for f in twin.flows:
        by_lane.setdefault((f.origin, f.destination), []).append(f)
    best_reroute: dict[tuple[str, str], float] = {}
    for c in plan.candidates:
        if c.feasible:
            k = (c.origin, c.destination)
            best_reroute[k] = min(best_reroute.get(k, 1e9), c.transit_days)

    pos = InventoryPosition(expected_outage_days=expected_outage_days)
    for o, d in plan.severed_pairs:
        fl = by_lane.get((o, d), [])
        cover = [f.inventory_days for f in fl if f.inventory_days] or None
        doc = min(cover) if cover else None
        stockout = (doc - expected_outage_days) if doc is not None else None
        lc = LaneCover(
            origin=o, destination=d, label=f"{labels.get(o, o)} → {labels.get(d, d)}", days_of_cover=doc,
            units_per_week=sum(f.units_per_week for f in fl), value_per_week=sum(f.value_per_week for f in fl),
            stockout_in_days=stockout, reroute_days=best_reroute.get((o, d)),
        )
        pos.lanes.append(lc)
        if stockout is not None and stockout < SAFETY_MARGIN_DAYS:
            pos.stockout_lanes.append(lc.label)
            if lc.reroute_days is not None and lc.reroute_days < doc:
                pos.reroute_beats_stockout.append(lc.label)

    known = [l for l in pos.lanes if l.days_of_cover is not None]
    if not known:
        pos.wait_is_viable = True  # nothing known — leave the judgement to the Router
        pos.rationale = "No inventory data on the severed lanes; waiting judged on transit slack only."
        return pos
    pos.wait_is_viable = not pos.stockout_lanes
    worst = min(known, key=lambda l: l.stockout_in_days or 0)
    if pos.wait_is_viable:
        pos.rationale = (f"Every destination stays covered: tightest is {worst.label} with {worst.days_of_cover:.0f} days of cover "
                         f"against an expected {expected_outage_days:.0f}-day outage (margin {worst.stockout_in_days:.0f}d).")
    else:
        pos.rationale = (f"Waiting causes a stockout on {len(pos.stockout_lanes)} lane(s): {worst.label} has {worst.days_of_cover:.0f} days of cover "
                         f"but the outage is expected to last {expected_outage_days:.0f} days (safety margin {SAFETY_MARGIN_DAYS:.0f}d).")
        if pos.reroute_beats_stockout:
            pos.rationale += f" Rerouting arrives before stock runs out on: {', '.join(pos.reroute_beats_stockout)}."
    return pos
