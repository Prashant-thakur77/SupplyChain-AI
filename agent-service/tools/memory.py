"""Longitudinal memory (Mem0). Degrades to no-op when no key is configured."""
from __future__ import annotations

from strands import tool

from config import settings
from tools._result import err, ok


def _client():
    from mem0 import MemoryClient

    return MemoryClient(api_key=settings.mem0_api_key)


@tool
def recall_memory(supply_chain_id: str, query: str) -> dict:
    """Recall past disruptions, decisions and outcomes for this supply chain that resemble the query."""
    if not settings.mem0_api_key:
        return ok({"memories": []})
    try:
        client = _client()
        try:
            res = client.search(query, filters={"user_id": f"sc_{supply_chain_id}"}, limit=5)
        except TypeError:  # older mem0 clients
            res = client.search(query, user_id=f"sc_{supply_chain_id}", limit=5)
        items = res.get("results", res) if isinstance(res, dict) else res
        return ok({"memories": [r.get("memory") for r in (items or []) if isinstance(r, dict)]})
    except Exception as e:
        return err(f"recall_memory failed: {e}")


@tool
def store_memory(supply_chain_id: str, text: str) -> dict:
    """Store a durable memory (event, decision taken, outcome) for this supply chain."""
    if not settings.mem0_api_key:
        return ok({"stored": False})
    try:
        _client().add([{"role": "user", "content": text}], user_id=f"sc_{supply_chain_id}")
        return ok({"stored": True})
    except Exception as e:
        return err(f"store_memory failed: {e}")


def format_decision_memory(title: str, status: str, option_label: str | None, added_cost: float | None, added_days: float | None, when: str) -> str:
    """One durable sentence per decision so the Analyst/Strategist can recall what was done last time."""
    outcome = {"approved": "approved", "rejected": "rejected", "snoozed": "snoozed"}.get(status, status)
    detail = ""
    if option_label:
        parts = []
        if added_cost:
            parts.append(f"{'+' if added_cost > 0 else ''}${added_cost:,.0f}")
        if added_days:
            parts.append(f"{'+' if added_days > 0 else ''}{added_days:.0f} days")
        detail = f" → {outcome}: {option_label}" + (f" ({', '.join(parts)})" if parts else "")
    else:
        detail = f" → {outcome}"
    return f"{when}: {title}{detail}."
