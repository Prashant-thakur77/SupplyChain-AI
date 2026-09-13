"""Twin enrichment: haversine distances, a mode rate card, and cost/transit estimation for lanes that lack data.

Real users rarely know exact lane costs. A lane with cost 0 would make Dijkstra pick it for free, so every consumer of a
twin runs `enrich_twin` first. Estimates are illustrative planning numbers and are flagged `estimated=True`.
Mirror of lib/twin-enrich.ts — keep the rate card in sync.
"""
from __future__ import annotations

import math
from typing import Optional

from schemas import Twin, TwinEdge

# USD per km (roughly one FEU container), days per km, fixed handling days. Illustrative, tuned for planning not invoicing.
RATE_CARD: dict[str, dict[str, float]] = {
    "sea": {"usd_per_km": 0.35, "km_per_day": 650.0, "fixed_days": 2.0, "min_usd": 400.0},
    "rail": {"usd_per_km": 0.90, "km_per_day": 500.0, "fixed_days": 1.0, "min_usd": 250.0},
    "road": {"usd_per_km": 1.80, "km_per_day": 600.0, "fixed_days": 0.5, "min_usd": 120.0},
    "air": {"usd_per_km": 6.00, "km_per_day": 6000.0, "fixed_days": 1.0, "min_usd": 1500.0},
}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def estimate_lane(mode: str, distance_km: float) -> tuple[float, float]:
    """(cost_usd, transit_days) for a mode and great-circle distance. Sea/rail routes are longer than the crow flies."""
    card = RATE_CARD.get(mode, RATE_CARD["road"])
    detour = 1.35 if mode == "sea" else 1.2 if mode in ("rail", "road") else 1.05
    km = distance_km * detour
    cost = max(card["min_usd"], round(km * card["usd_per_km"], -1))
    days = round(card["fixed_days"] + km / card["km_per_day"], 1)
    return cost, days


def enrich_twin(twin: Twin) -> tuple[Twin, list[str]]:
    """Fill missing lane cost/days from coordinates. Returns (twin, notes). Lanes without coordinates on both ends are left as-is."""
    coords: dict[str, tuple[float, float]] = {n.id: (n.lat, n.lng) for n in twin.nodes if n.lat is not None and n.lng is not None}  # type: ignore[misc]
    notes: list[str] = []
    for e in twin.edges:
        needs_cost, needs_days = (e.cost or 0) <= 0, (e.transit_days or 0) <= 0
        if not (needs_cost or needs_days):
            continue
        a, b = coords.get(e.source), coords.get(e.target)
        if not a or not b:
            notes.append(f"lane {e.id}: no coordinates on both ends — cannot estimate {'cost' if needs_cost else 'days'}")
            continue
        cost, days = estimate_lane(e.mode, haversine_km(a[0], a[1], b[0], b[1]))
        if needs_cost:
            e.cost = cost
        if needs_days:
            e.transit_days = days
        notes.append(f"lane {e.id} ({e.mode}): estimated {'cost $%.0f' % cost if needs_cost else ''}{' and ' if needs_cost and needs_days else ''}{'%.1f days' % days if needs_days else ''}")
    return twin, notes
