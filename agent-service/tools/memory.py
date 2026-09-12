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
        res = _client().search(query, user_id=f"sc_{supply_chain_id}", limit=5)
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
