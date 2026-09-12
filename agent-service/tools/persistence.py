"""Persistence tools so agents can write alerts and decisions themselves when used interactively."""
from __future__ import annotations

from strands import tool

import db
from schemas import Assessment, Decision, RouteCandidate
from tools._result import err, ok


@tool
def persist_notification(user_id: str, supply_chain_id: str, assessment_json: dict) -> dict:
    """Save an assessed disruption as a notification the operator will see in the alerts feed."""
    try:
        nid = db.insert_notification(user_id, supply_chain_id, Assessment.model_validate(assessment_json))
        return ok({"notification_id": nid})
    except Exception as e:
        return err(f"persist_notification failed: {e}")


@tool
def create_decision(user_id: str, decision_json: dict, candidates_json: list[dict] = []) -> dict:
    """Create a pending decision (ranked options + recommendation) in the operator's Decision Inbox."""
    try:
        did = db.insert_decision(user_id, Decision.model_validate(decision_json), [RouteCandidate.model_validate(c) for c in candidates_json])
        return ok({"decision_id": did})
    except Exception as e:
        return err(f"create_decision failed: {e}")
