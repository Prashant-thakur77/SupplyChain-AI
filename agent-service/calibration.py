"""Learning from outcomes — observed bias between estimated and actual added cost/days, applied to *estimated* lanes only.

Quotes and user-entered lanes are trusted as-is. Factors are clamped to [0.5, 2.0] and need at least MIN_SAMPLES outcomes.
"""
from __future__ import annotations

from dataclasses import dataclass
from statistics import median

import db
from schemas import Twin

MIN_SAMPLES = 3


@dataclass
class Calibration:
    cost_factor: float = 1.0
    days_factor: float = 1.0
    samples: int = 0


def factors(supply_chain_id: str) -> Calibration:
    try:
        rows = db.client().table("decision_outcomes").select("estimated_added_cost,estimated_added_days,actual_added_cost,actual_added_days") \
            .eq("supply_chain_id", supply_chain_id).order("created_at", desc=True).limit(50).execute().data or []
    except Exception:
        return Calibration()
    cr = [float(r["actual_added_cost"]) / float(r["estimated_added_cost"]) for r in rows if r.get("actual_added_cost") is not None and r.get("estimated_added_cost") and float(r["estimated_added_cost"]) > 0]
    dr = [float(r["actual_added_days"]) / float(r["estimated_added_days"]) for r in rows if r.get("actual_added_days") is not None and r.get("estimated_added_days") and float(r["estimated_added_days"]) > 0]
    c = Calibration(samples=max(len(cr), len(dr)))
    if len(cr) >= MIN_SAMPLES:
        c.cost_factor = max(0.5, min(2.0, median(cr)))
    if len(dr) >= MIN_SAMPLES:
        c.days_factor = max(0.5, min(2.0, median(dr)))
    return c


def apply(twin: Twin, cal: Calibration) -> int:
    """Scale estimated lanes in place. Returns the number of lanes adjusted."""
    if cal.cost_factor == 1.0 and cal.days_factor == 1.0:
        return 0
    n = 0
    for e in twin.edges:
        if e.provenance == "estimate":
            e.cost = round(e.cost * cal.cost_factor, 0)
            e.transit_days = round(e.transit_days * cal.days_factor, 1)
            n += 1
    return n
