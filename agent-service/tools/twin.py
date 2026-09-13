"""Twin tools: the deterministic core exposed to agents. Agents call these; they never compute routes themselves."""
from __future__ import annotations

from strands import tool

import db
import calibration
from enrich import enrich_twin
from routing import blast_radius, reroute_plan
from schemas import Twin
from tools._result import err, ok


class _TwinCache:
    """Process-local cache so demo twins (passed inline) and DB twins share one code path."""

    def __init__(self) -> None:
        self._m: dict[str, Twin] = {}

    def put(self, t: Twin) -> None:
        self._m[t.supply_chain_id] = enrich_twin(t)[0]

    def get(self, supply_chain_id: str) -> Twin:
        if supply_chain_id in self._m:
            return self._m[supply_chain_id]
        t = enrich_twin(db.load_twin(supply_chain_id))[0]
        calibration.apply(t, calibration.factors(supply_chain_id))  # learn from recorded outcomes
        self._m[supply_chain_id] = t
        return t

    def clear(self, supply_chain_id: str) -> None:
        self._m.pop(supply_chain_id, None)


twin_cache = _TwinCache()


@tool
def load_twin(supply_chain_id: str) -> dict:
    """Load the supply chain digital twin (nodes with type/location/capacity/risk and edges with mode, cost, transit days) for a supply chain id."""
    try:
        t = twin_cache.get(supply_chain_id)
        return ok({"name": t.name, "nodes": [n.model_dump(exclude={"data"}) for n in t.nodes], "edges": [e.model_dump() for e in t.edges]})
    except Exception as e:
        return err(f"load_twin failed: {e}")


@tool
def compute_blast_radius(supply_chain_id: str, failed_node_ids: list[str], failed_edge_ids: list[str] = []) -> dict:
    """Deterministically compute which downstream nodes and edges are cut off when the given nodes/edges fail."""
    try:
        t = twin_cache.get(supply_chain_id)
        br = blast_radius(t, failed_node_ids, failed_edge_ids)
        labels = {n.id: n.label for n in t.nodes}
        return ok({
            "downstream_node_ids": br.downstream_node_ids,
            "downstream_labels": [labels.get(i, i) for i in br.downstream_node_ids],
            "broken_edge_ids": br.broken_edge_ids,
            "severed_pairs": br.severed_pairs,
        })
    except Exception as e:
        return err(f"compute_blast_radius failed: {e}")


@tool
def find_reroutes(supply_chain_id: str, failed_node_ids: list[str], failed_edge_ids: list[str] = [], k: int = 3) -> dict:
    """Compute the k cheapest feasible alternate routes around failed nodes/edges with weighted Dijkstra. Returns exact added cost and days per candidate."""
    try:
        plan = reroute_plan(twin_cache.get(supply_chain_id), failed_node_ids, failed_edge_ids, k)
        return ok({
            "severity": plan.severity,
            "feasible_count": plan.feasible_count,
            "infeasible_count": plan.infeasible_count,
            "severed_pairs": plan.severed_pairs,
            "candidates": [c.model_dump() for c in plan.candidates],
        })
    except Exception as e:
        return err(f"find_reroutes failed: {e}")


@tool
def estimate_impact_numbers(supply_chain_id: str, failed_node_ids: list[str], delay_days: float) -> dict:
    """Deterministic impact baseline: downstream node count, share of network cut off, and revenue-at-risk using node capacity and lane cost as proxies."""
    try:
        t = twin_cache.get(supply_chain_id)
        br = blast_radius(t, failed_node_ids, [])
        cap = {n.id: n.capacity for n in t.nodes}
        total = sum(cap.values()) or 1.0
        hit = sum(cap.get(i, 0) for i in br.downstream_node_ids + failed_node_ids)
        share = min(100.0, 100.0 * hit / total)
        # Value-weighted when the twin has flows: weekly value on lanes whose healthy path crosses the failure.
        from routing import flow_value_at_risk, lanes_through

        lanes = lanes_through(t, failed_node_ids, [])
        var = flow_value_at_risk(t, lanes)
        if var:
            weekly = sum(var.values())
            penalties = sum(f.penalty_per_day for f in t.flows if (f.origin, f.destination) in var) * max(delay_days, 0)
            cover = [f.inventory_days for f in t.flows if (f.origin, f.destination) in var and f.inventory_days]
            return ok({
                "basis": "flows", "nodes_affected": len(br.downstream_node_ids) + len(failed_node_ids), "network_share_pct": round(share, 1),
                "weekly_value_on_affected_lanes_usd": round(weekly, 0), "revenue_at_risk_usd": round(weekly * max(delay_days, 1) / 7.0 + penalties, 0),
                "late_penalties_usd": round(penalties, 0), "min_days_of_cover": min(cover) if cover else None, "delay_days": delay_days,
                "lanes": [{"origin": a, "destination": b, "weekly_value_usd": round(v, 0)} for (a, b), v in var.items()],
            })
        flow_cost = sum(e.cost for e in t.edges) or 1.0
        return ok({
            "basis": "capacity-proxy (add flows for value-weighted impact)",
            "nodes_affected": len(br.downstream_node_ids) + len(failed_node_ids),
            "network_share_pct": round(share, 1),
            "revenue_at_risk_usd": round(flow_cost * (share / 100.0) * max(delay_days, 1) * 10, 0),
            "delay_days": delay_days,
        })
    except Exception as e:
        return err(f"estimate_impact_numbers failed: {e}")


@tool
def list_delayed_shipments(supply_chain_id: str) -> dict:
    """Shipments currently in flight on this supply chain that are delayed or past their planned ETA, with value and lane."""
    try:
        from datetime import datetime, timezone

        rows = db.client().table("shipments").select("reference,origin_node_id,destination_node_id,mode,carrier,status,planned_eta,current_eta,progress,last_event,value_usd") \
            .eq("supply_chain_id", supply_chain_id).in_("status", ["in_transit", "delayed"]).execute().data or []
        labels = {n.id: n.label for n in twin_cache.get(supply_chain_id).nodes}
        now = datetime.now(timezone.utc).isoformat()
        out = []
        for r in rows:
            late_days = 0.0
            if r.get("current_eta") and r.get("planned_eta"):
                from datetime import datetime as dt
                late_days = round((dt.fromisoformat(r["current_eta"].replace("Z", "+00:00")) - dt.fromisoformat(r["planned_eta"].replace("Z", "+00:00"))).total_seconds() / 86400, 1)
            if r["status"] == "delayed" or late_days > 0 or (r.get("planned_eta") and r["planned_eta"] < now):
                out.append({"reference": r["reference"], "lane": f"{labels.get(r['origin_node_id'], r['origin_node_id'])} → {labels.get(r['destination_node_id'], r['destination_node_id'])}", "mode": r["mode"], "carrier": r.get("carrier"),
                            "status": r["status"], "late_days": late_days, "progress": r.get("progress"), "last_event": r.get("last_event"), "value_usd": r.get("value_usd")})
        return ok({"delayed": out, "count": len(out), "total_value_usd": sum(float(x.get("value_usd") or 0) for x in out)})
    except Exception as e:
        return err(f"list_delayed_shipments failed: {e}")
