"""Twin builder — turns a plain-English description (or a pasted supplier list) into a draft digital twin."""
from schemas import TwinDraft

from .base import call_structured, make_agent

PROMPT = """You are the Twin Builder. The user describes their supply chain in words — suppliers, factories, ports, warehouses,
customers, and how goods move between them. Produce a complete draft twin:
- One node per distinct site. Use real city names and ISO-2 country codes. Fill lat/lng from your own geographic knowledge (approximate is fine).
- Lanes must form a connected flow from sources (suppliers/factories) to sinks (warehouses/retailers/customers). Pick realistic modes
  (sea for intercontinental, road/rail regionally, air only if the user implies urgency). Include at least one alternate lane where a
  sensible one exists (e.g. a second port), so the network is not a single chain.
- Leave cost/transit_days null unless the user gave numbers; the routing engine estimates them from distance.
- risk_level: 4-5 for single-sourced or unstable-region sites, 1-2 for redundant/stable ones.
- List every assumption you made and up to 3 questions that would improve the twin. Keep ids short slugs."""


def build(hooks, model=None):
    return make_agent("scenario", PROMPT, hooks=hooks, name="twin_builder", model=model)


def run_twin_builder(agent, description: str) -> TwinDraft:
    return call_structured(agent, f"Description:\n{description.strip()}\n\nDraft the twin.", TwinDraft, prefer_json=True)
