"""Playbooks — the organisation's standard responses per disruption type. The Strategist must follow a matching playbook;
its steps seed the execution checklist. Built-ins ship with the product; orgs install and edit them (Playbooks page)."""
from __future__ import annotations

from typing import Any

BUILTIN: list[dict[str, Any]] = [
    {"key": "port_closure", "name": "Port closure / congestion", "category": "LOGISTICS", "triggers": ["port", "closure", "congestion", "berth", "terminal", "strike"],
     "guidance": "Divert to the nearest alternative port with a rail/road onward leg before considering air. Book slots within 24h — capacity vanishes fast.",
     "steps": [{"title": "Confirm closure duration with port authority / agent", "owner": "Logistics", "due_in_days": 0, "detail": "Get a written ETA to reopen; check whether transshipment cargo is affected."},
               {"title": "Reroute in-transit containers to the alternative port", "owner": "Logistics", "due_in_days": 1, "detail": "Amend bills of lading; confirm onward rail/road capacity."},
               {"title": "Re-plan production against the new ETA", "owner": "Planning", "due_in_days": 1, "detail": "Check days of cover at each destination; expedite only where stock-out is real."},
               {"title": "Notify customers with revised delivery dates", "owner": "Customer service", "due_in_days": 2, "detail": "Use the impact estimate; offer partial shipments."}]},
    {"key": "supplier_outage", "name": "Supplier plant outage (fire, flood, insolvency)", "category": "SUPPLIER", "triggers": ["supplier", "factory", "plant", "fire", "bankrupt", "insolven", "explosion", "shutdown"],
     "guidance": "Qualify the second source first; do not wait for the primary supplier's recovery estimate — they are always optimistic.",
     "steps": [{"title": "Freeze open POs and quantify committed inventory at the supplier", "owner": "Procurement", "due_in_days": 0, "detail": "Finished goods, WIP, tooling — what can be recovered?"},
               {"title": "Activate the qualified alternate supplier", "owner": "Procurement", "due_in_days": 2, "detail": "Issue POs for the next 8 weeks; expedite samples if a new qualification is required."},
               {"title": "Allocate remaining stock to priority customers", "owner": "Planning", "due_in_days": 1, "detail": "Contractual SLAs first; then margin."},
               {"title": "Claim under business-interruption / contingent BI insurance", "owner": "Finance", "due_in_days": 5, "detail": "Collect the incident report and the impact estimate."}]},
    {"key": "severe_weather", "name": "Cyclone / flood / winter storm", "category": "WEATHER", "triggers": ["cyclone", "typhoon", "hurricane", "flood", "storm", "snow", "monsoon", "tornado"],
     "guidance": "Pull shipments forward before landfall when the forecast is >48h out; after landfall, wait for infrastructure reports before rerouting.",
     "steps": [{"title": "Pull forward departures ahead of the weather window", "owner": "Logistics", "due_in_days": 0, "detail": "Anything that can leave today should leave today."},
               {"title": "Move safety stock to the unaffected DC", "owner": "Planning", "due_in_days": 1, "detail": "Cover 2 weeks of demand for the affected region."},
               {"title": "Check site safety and utilities at affected nodes", "owner": "Site ops", "due_in_days": 1, "detail": "Power, road access, staff availability."},
               {"title": "Re-baseline ETAs once carriers publish recovery schedules", "owner": "Logistics", "due_in_days": 3, "detail": "Update shipment ETAs; close the incident when lanes are back."}]},
    {"key": "chokepoint", "name": "Canal / strait blockage", "category": "GEOPOLITICAL", "triggers": ["suez", "panama", "hormuz", "malacca", "bab", "canal", "strait", "blockage", "houthi", "red sea"],
     "guidance": "Compare the long sea route (Cape) against sea-air via a hub; the long route wins for low-value bulk, sea-air for high value/urgent.",
     "steps": [{"title": "Split cargo by value density: bulk → long sea route, urgent → sea-air", "owner": "Logistics", "due_in_days": 1, "detail": "Use the Router's ranked candidates."},
               {"title": "Lock freight rates for 4 weeks before spot rates spike", "owner": "Procurement", "due_in_days": 1, "detail": "Carriers reprice within days."},
               {"title": "Increase safety stock targets for the affected lanes", "owner": "Planning", "due_in_days": 2, "detail": "Add the added transit days to the reorder point."},
               {"title": "Brief leadership with the cost-of-inaction number", "owner": "Supply chain lead", "due_in_days": 1, "detail": "Weekly value at risk from the impact estimate."}]},
    {"key": "customs_hold", "name": "Customs hold / tariff change / sanctions", "category": "GEOPOLITICAL", "triggers": ["customs", "tariff", "sanction", "export control", "hold", "embargo", "duty"],
     "guidance": "Engage the broker and legal before moving anything; a misdeclared reroute creates a bigger problem than a delay.",
     "steps": [{"title": "Get the hold reason in writing from the broker", "owner": "Trade compliance", "due_in_days": 0, "detail": "Classification, valuation, origin or licensing?"},
               {"title": "Assess whether an alternative origin or routing changes the duty outcome", "owner": "Trade compliance", "due_in_days": 2, "detail": "Rules of origin; FTA eligibility."},
               {"title": "Reprice affected SKUs or absorb the duty", "owner": "Finance", "due_in_days": 3, "detail": "Use the impact estimate for the margin hit."},
               {"title": "Update the customs master data", "owner": "Trade compliance", "due_in_days": 5, "detail": "HS codes, valuation method, licences."}]},
    {"key": "labour_action", "name": "Strike / labour action", "category": "LOGISTICS", "triggers": ["strike", "walkout", "union", "labour", "labor", "industrial action"],
     "guidance": "Strikes are usually announced — pre-clear cargo before the date and avoid the affected gateway for the notice period plus 5 days of backlog.",
     "steps": [{"title": "Confirm strike dates and scope with the terminal / carrier", "owner": "Logistics", "due_in_days": 0, "detail": ""},
               {"title": "Pre-clear and pull forward cargo through the gateway", "owner": "Logistics", "due_in_days": 1, "detail": ""},
               {"title": "Book alternative gateway capacity for the notice period + backlog", "owner": "Logistics", "due_in_days": 1, "detail": ""},
               {"title": "Communicate revised ETAs", "owner": "Customer service", "due_in_days": 2, "detail": ""}]},
]


def builtin_by_key() -> dict[str, dict[str, Any]]:
    return {p["key"]: p for p in BUILTIN}


def match(playbooks: list[dict[str, Any]], category: str, text: str) -> list[dict[str, Any]]:
    """Playbooks that apply: category match or any trigger keyword in the event text. Trigger hits rank first."""
    t = (text or "").lower()
    scored = []
    for p in playbooks:
        if not p.get("enabled", True):
            continue
        hits = sum(1 for k in p.get("triggers", []) if k.lower() in t)
        if hits or p.get("category") == category:
            scored.append((hits, p))
    scored.sort(key=lambda x: -x[0])
    return [p for _, p in scored[:2]]


def render(playbooks: list[dict[str, Any]]) -> str:
    out = []
    for p in playbooks:
        steps = "\n".join(f"  {i + 1}. {s['title']} — {s.get('owner', '')}, due in {s.get('due_in_days', 0)}d. {s.get('detail', '')}".rstrip() for i, s in enumerate(p.get("steps", [])))
        out.append(f"Playbook '{p['name']}' ({p['category']}):\n  Guidance: {p.get('guidance') or '—'}\n{steps}")
    return "\n\n".join(out)
