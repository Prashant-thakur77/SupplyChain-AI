"""Supabase access (service role). Pure mapping helpers are kept separate so they are unit-testable without a DB."""
from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any, Optional

from config import settings
from schemas import Assessment, Decision, Flow, MitigationPlan, RouteCandidate, Twin, TwinEdge, TwinNode


@lru_cache(maxsize=1)
def client():
    from supabase import create_client

    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def _num(x: Any, default: float = 0.0) -> float:
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


def rows_to_twin(supply_chain_id: str, name: str, nodes: list[dict], edges: list[dict]) -> Twin:
    tn: list[TwinNode] = []
    for n in nodes:
        d = n.get("data") or {}
        tn.append(
            TwinNode(
                id=n["node_id"],
                label=d.get("label") or n.get("name") or n["node_id"],
                type=n.get("type") or d.get("type") or "warehouse",
                lat=n.get("location_lat"),
                lng=n.get("location_lng"),
                country=d.get("country"),
                capacity=_num(n.get("capacity")),
                risk_level=_num(n.get("risk_level")),
                data=d,
            )
        )
    te: list[TwinEdge] = []
    for e in edges:
        d = e.get("data") or {}
        source = e.get("from_node_id") or d.get("source")
        target = e.get("to_node_id") or d.get("target")
        if not source or not target:
            continue
        te.append(
            TwinEdge(
                id=e["edge_id"],
                source=source,
                target=target,
                mode=d.get("mode") or "road",
                cost=_num(d.get("cost")),
                transit_days=_num(d.get("transitTime") if d.get("transitTime") is not None else d.get("transit_days")),
                risk_multiplier=_num(d.get("riskMultiplier"), 1.0) or 1.0,
                capacity=d.get("capacity"),
            )
        )
    return Twin(supply_chain_id=supply_chain_id, name=name, nodes=tn, edges=te)


def load_flows(supply_chain_id: str) -> list[Flow]:
    try:
        rows = client().table("flows").select("*").eq("supply_chain_id", supply_chain_id).eq("active", True).execute().data or []
    except Exception as e:  # table may not exist yet
        print(f"[flows] load failed: {e}")
        return []
    return [Flow(id=r["id"], origin=r["origin_node_id"], destination=r["destination_node_id"], product=r.get("product"), units_per_week=_num(r.get("units_per_week")),
                 value_per_unit=_num(r.get("value_per_unit")), lead_time_days=r.get("lead_time_days"), penalty_per_day=_num(r.get("penalty_per_day")), inventory_days=_num(r.get("inventory_days")))
            for r in rows]


def load_twin(supply_chain_id: str) -> Twin:
    sb = client()
    sc = sb.table("supply_chains").select("name").eq("supply_chain_id", supply_chain_id).limit(1).execute().data
    nodes = sb.table("nodes").select("*").eq("supply_chain_id", supply_chain_id).execute().data or []
    edges = sb.table("edges").select("*").eq("supply_chain_id", supply_chain_id).execute().data or []
    twin = rows_to_twin(supply_chain_id, (sc[0]["name"] if sc else ""), nodes, edges)
    twin.flows = load_flows(supply_chain_id)
    return twin


def list_supply_chains() -> list[dict]:
    return client().table("supply_chains").select("supply_chain_id,user_id,name").execute().data or []


def fingerprint(title: str, node_ids: list[str]) -> str:
    key = title.strip().lower() + "|" + ",".join(sorted(node_ids))
    return hashlib.sha1(key.encode()).hexdigest()[:16]


def recent_event_fingerprints(supply_chain_id: str, hours: int = 48) -> set[str]:
    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    rows = client().table("notifications").select("citations").gte("created_at", since).execute().data or []
    out: set[str] = set()
    for r in rows:
        c = r.get("citations")
        if isinstance(c, dict) and c.get("supplyChainId") == supply_chain_id and c.get("fingerprint"):
            out.add(c["fingerprint"])
    return out


def insert_notification(user_id: str, supply_chain_id: str, a: Assessment, kind: str = "supply_chain_alert") -> str:
    row = {
        "user_id": user_id,
        "title": a.title,
        "message": a.summary,
        "notification_type": kind,
        "severity": a.severity.value,
        "read_status": False,
        "citations": {
            "category": a.category,
            "confidence": a.confidence,
            "needsReview": a.needs_review,
            "failedNodes": a.failed_node_ids,
            "failedEdges": a.failed_edge_ids,
            "affectedNodes": a.affected_node_ids,
            "affectedEdges": a.affected_edge_ids,
            "supplyChainId": supply_chain_id,
            "fingerprint": fingerprint(a.title, a.failed_node_ids or a.affected_node_ids),
            "sources": [s.model_dump() for s in a.sources],
        },
    }
    return client().table("notifications").insert(row).execute().data[0]["notification_id"]


def load_policy(supply_chain_id: str) -> Optional[dict]:
    try:
        rows = client().table("autonomy_policies").select("*").eq("supply_chain_id", supply_chain_id).limit(1).execute().data
        return rows[0] if rows else None
    except Exception as e:  # table may not exist on older databases
        print(f"[policy] load failed: {e}")
        return None


def insert_decision(user_id: str, d: Decision, candidates: list[RouteCandidate], auto_approved: bool = False, policy_reason: Optional[str] = None,
                    mitigation: Optional[MitigationPlan] = None) -> str:
    sb = client()
    row = {
        "user_id": user_id,
        "supply_chain_id": d.supply_chain_id,
        "event_id": d.event_id,
        "title": d.title,
        "summary": d.summary,
        "options": [o.model_dump() for o in d.options],
        "recommended_option_id": d.recommended_option_id,
        "rationale": d.rationale,
        "confidence": d.confidence,
        "sources": [s.model_dump() for s in d.sources],
        "trace_id": d.trace_id,
        "status": "approved" if auto_approved else "pending",
        "chosen_option_id": d.recommended_option_id if auto_approved else None,
        "decided_at": datetime.now(timezone.utc).isoformat() if auto_approved else None,
        "auto_approved": auto_approved,
        "policy_reason": policy_reason,
    }
    did = sb.table("decisions").insert(row).execute().data[0]["id"]
    if candidates:
        sb.table("route_plans").insert(
            [
                {
                    "decision_id": did, "candidate_id": c.id, "path": c.path, "labels": c.labels, "modes": c.modes,
                    "cost": c.cost, "transit_days": c.transit_days, "added_cost": c.added_cost, "added_days": c.added_days,
                    "max_risk": c.max_risk, "feasible": c.feasible,
                }
                for c in candidates
            ]
        ).execute()
    if mitigation and mitigation.steps:
        try:
            sb.table("decision_tasks").insert([
                {"decision_id": did, "user_id": user_id, "position": i, "title": st.title, "owner": st.owner, "due_in_days": st.due_in_days, "detail": st.detail}
                for i, st in enumerate(mitigation.steps)
            ]).execute()
        except Exception as e:  # older databases without the table
            print(f"[tasks] insert failed: {e}")
    return did


def insert_trace(
    session_id: str, agent_name: str, started_at: datetime, ended_at: datetime, success: bool, error: Optional[str],
    user_id: Optional[str], supply_chain_id: Optional[str], stage: Optional[str], in_tok: Optional[int], out_tok: Optional[int],
) -> None:
    try:
        client().table("agent_traces").insert(
            {
                "session_id": session_id, "agent_name": agent_name, "started_at": started_at.isoformat(), "ended_at": ended_at.isoformat(),
                "duration_ms": int((ended_at - started_at).total_seconds() * 1000), "success": success, "error": error,
                "workflow_stage": stage, "user_id": user_id, "supply_chain_id": supply_chain_id, "input_tokens": in_tok, "output_tokens": out_tok,
            }
        ).execute()
    except Exception as e:  # tracing must never break a run
        print(f"[trace] insert failed: {e}")


def insert_audit(user_id: Optional[str], actor: str, action: str, details: Optional[dict] = None) -> None:
    try:
        client().table("audit_logs").insert(
            {"user_id": user_id, "actor": actor, "action": action, "details": details or {}, "status": "success"}
        ).execute()
    except Exception as e:
        print(f"[audit] insert failed: {e}")
