"""Contract & SLA awareness — penalties are deterministic once the clauses are structured."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from pydantic import BaseModel, Field

import db


class ContractTerms(BaseModel):
    """What the Contracts agent extracts from pasted contract / SLA text."""

    counterparty: str
    kind: str = Field(description="customer | supplier | carrier")
    site_hint: Optional[str] = Field(default=None, description="Site / city / DC named in the clause, if any")
    lead_time_commit_days: Optional[float] = None
    grace_days: float = 0
    penalty_per_day_usd: float = 0
    penalty_cap_usd: Optional[float] = None
    service_level_pct: Optional[float] = None
    expires_at: Optional[str] = Field(default=None, description="YYYY-MM-DD")
    notes: str = ""


@dataclass
class Exposure:
    total_usd: float = 0.0
    lines: list[dict] = field(default_factory=list)
    contracts_considered: int = 0


def penalty_for(c: dict, delay_days: float) -> float:
    late = max(0.0, float(delay_days) - float(c.get("grace_days") or 0))
    p = late * float(c.get("penalty_per_day_usd") or 0)
    cap = c.get("penalty_cap_usd")
    return round(min(p, float(cap)) if cap is not None else p, 0)


def exposure(contracts: list[dict], delay_days: float, affected_node_ids: list[str], labels: dict[str, str] | None = None) -> Exposure:
    """Penalties on contracts attached to affected sites (contracts with no site count network-wide)."""
    labels = labels or {}
    aff = set(affected_node_ids)
    ex = Exposure()
    for c in contracts:
        if c.get("node_id") and c["node_id"] not in aff:
            continue
        ex.contracts_considered += 1
        p = penalty_for(c, delay_days)
        if p > 0:
            ex.lines.append({"counterparty": c.get("counterparty"), "kind": c.get("kind"), "site": labels.get(c.get("node_id"), c.get("node_id")), "penalty_usd": p,
                             "grace_days": c.get("grace_days") or 0, "per_day": c.get("penalty_per_day_usd") or 0, "capped": c.get("penalty_cap_usd") is not None and p >= float(c["penalty_cap_usd"])})
            ex.total_usd += p
    ex.lines.sort(key=lambda l: -l["penalty_usd"])
    return ex


def load(supply_chain_id: str) -> list[dict]:
    try:
        return db.client().table("contracts").select("*").eq("supply_chain_id", supply_chain_id).execute().data or []
    except Exception:
        return []
