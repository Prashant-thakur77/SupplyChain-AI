"""Autonomy policy: when the agent may approve a reroute itself, and how long a pending decision stays valid."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from schemas import Decision, DecisionOption


@dataclass
class Policy:
    auto_approve: bool = False
    max_added_cost: float = 2000
    max_added_days: float = 5
    min_confidence: float = 0.8
    expire_hours: int = 48
    webhook_url: Optional[str] = None
    carbon_weight: float = 0.0   # 0 = cost only … 1 = every tonne priced at carbon_price in the ranking
    carbon_price: float = 100.0  # USD per tCO2e

    @classmethod
    def from_row(cls, row: Optional[dict]) -> "Policy":
        if not row:
            return cls()
        return cls(auto_approve=bool(row.get("auto_approve")), max_added_cost=float(row.get("max_added_cost") or 2000), max_added_days=float(row.get("max_added_days") or 5),
                   min_confidence=float(row.get("min_confidence") or 0.8), expire_hours=int(row.get("expire_hours") or 48), webhook_url=row.get("webhook_url") or None,
                   carbon_weight=float(row.get("carbon_weight") or 0), carbon_price=float(row.get("carbon_price") or 100))


def evaluate(policy: Policy, decision: Decision, infeasible_lanes: int, needs_review: bool) -> tuple[bool, str]:
    """(auto_approve?, reason). Only the recommended *reroute* option can be auto-approved, and only inside every guardrail."""
    if not policy.auto_approve:
        return False, "policy: auto-approve off"
    rec: Optional[DecisionOption] = next((o for o in decision.options if o.id == decision.recommended_option_id), None)
    if rec is None or rec.kind != "reroute":
        return False, "policy: recommendation is not a reroute"
    if needs_review:
        return False, "policy: analyst flagged needs_review"
    if decision.confidence < policy.min_confidence:
        return False, f"policy: confidence {decision.confidence:.2f} < {policy.min_confidence:.2f}"
    if infeasible_lanes > 0:
        return False, "policy: some lanes have no bypass — human call"
    if rec.added_cost > policy.max_added_cost:
        return False, f"policy: +${rec.added_cost:,.0f} exceeds ${policy.max_added_cost:,.0f}"
    if rec.added_days > policy.max_added_days:
        return False, f"policy: +{rec.added_days:.0f}d exceeds {policy.max_added_days:.0f}d"
    if rec.risk.value in ("HIGH", "CRITICAL"):
        return False, "policy: recommended route carries high risk"
    return True, f"auto-approved: +${rec.added_cost:,.0f} ≤ ${policy.max_added_cost:,.0f}, +{rec.added_days:.0f}d ≤ {policy.max_added_days:.0f}d, confidence {decision.confidence:.2f}"
