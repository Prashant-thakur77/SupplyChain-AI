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
        """Cache an inline twin (canvas state / demo). Canvas payloads carry only nodes and lanes, so the saved chain's
        commercial data — flows, rate card, carrier quotes — is merged in; otherwise a canvas call would silently
        downgrade every later call on that chain to "no flows"."""
        sid = t.supply_chain_id
        if sid and not sid.startswith("demo") and sid not in ("canvas", "default-chain"):
            try:
                if not t.flows:
                    t.flows = db.load_flows(sid)
                if not t.rate_card:
                    t.rate_card = db.load_rate_card(sid)
                db.apply_quotes(t, db.load_quotes(sid))
            except Exception as e:  # noqa: BLE001 — commercial data is optional
                print(f"[twin_cache] could not merge saved commercial data for {sid}: {e}")
        self._m[sid] = enrich_twin(t)[0]

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


def resolve_nodes(t, refs: list[str]) -> list[str]:
    """Accept node ids *or* labels (models often pass 'Suez Canal' rather than the uuid). Unknown refs are dropped."""
    by_id = {n.id: n.id for n in t.nodes}
    by_label = {n.label.strip().lower(): n.id for n in t.nodes}
    out: list[str] = []
    for r in refs or []:
        key = str(r).strip()
        nid = by_id.get(key) or by_label.get(key.lower())
        if nid is None:  # loose match: 'Suez' → 'Suez Canal'
            cands = [i for l, i in by_label.items() if key.lower() in l or l in key.lower()]
            nid = cands[0] if len(cands) == 1 else None
        if nid and nid not in out:
            out.append(nid)
    return out


def resolve_edges(t, refs: list[str]) -> list[str]:
    ids = {e.id for e in t.edges}
    return [r for r in (refs or []) if r in ids]


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
        failed_node_ids, failed_edge_ids = resolve_nodes(t, failed_node_ids), resolve_edges(t, failed_edge_ids)
        if not failed_node_ids and not failed_edge_ids:
            return err("no matching sites/lanes — use the exact ids or labels from load_twin")
        br = blast_radius(t, failed_node_ids, failed_edge_ids)
        labels = {n.id: n.label for n in t.nodes}
        return ok({
            "downstream_node_ids": br.downstream_node_ids,
            "downstream_labels": [labels.get(i, i) for i in br.downstream_node_ids],
            "broken_edge_ids": br.broken_edge_ids,
            "severed_pairs": br.severed_pairs,
            "severed_lanes": [f"{labels.get(a, a)} → {labels.get(b, b)}" for a, b in br.severed_pairs],
        })
    except Exception as e:
        return err(f"compute_blast_radius failed: {e}")


@tool
def find_reroutes(supply_chain_id: str, failed_node_ids: list[str], failed_edge_ids: list[str] = [], k: int = 3) -> dict:
    """Compute the k cheapest feasible alternate routes around failed nodes/edges with weighted Dijkstra. Returns exact added cost and days per candidate."""
    try:
        t = twin_cache.get(supply_chain_id)
        failed_node_ids, failed_edge_ids = resolve_nodes(t, failed_node_ids), resolve_edges(t, failed_edge_ids)
        if not failed_node_ids and not failed_edge_ids:
            return err("no matching sites/lanes — use the exact ids or labels from load_twin")
        plan = reroute_plan(t, failed_node_ids, failed_edge_ids, k)
        return ok({
            "severity": plan.severity,
            "feasible_count": plan.feasible_count,
            "infeasible_count": plan.infeasible_count,
            "severed_pairs": plan.severed_pairs,
            "candidates": [c.model_dump(exclude={"path"}) for c in plan.candidates],  # labels carry the route; ids only confuse the reader
        })
    except Exception as e:
        return err(f"find_reroutes failed: {e}")


@tool
def estimate_impact_numbers(supply_chain_id: str, failed_node_ids: list[str], delay_days: float) -> dict:
    """Deterministic impact baseline: downstream node count, share of network cut off, and revenue-at-risk using node capacity and lane cost as proxies."""
    try:
        t = twin_cache.get(supply_chain_id)
        failed_node_ids = resolve_nodes(t, failed_node_ids)
        if not failed_node_ids:
            return err("no matching sites — use the exact ids or labels from load_twin")
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


@tool
def contract_exposure(supply_chain_id: str, delay_days: float, affected_node_ids: list[str] = []) -> dict:
    """Contractual penalties (customer SLAs, supplier/carrier clauses) a delay of delay_days triggers on the affected sites. Deterministic from the contracts register."""
    try:
        import contracts as ct

        twin = twin_cache.get(supply_chain_id)
        labels = {n.id: n.label for n in twin.nodes}
        ex = ct.exposure(ct.load(supply_chain_id), delay_days, affected_node_ids or [n.id for n in twin.nodes], labels)
        return ok({"penalties_usd": ex.total_usd, "lines": ex.lines, "contracts_considered": ex.contracts_considered})
    except Exception as e:
        return err(f"contract_exposure failed: {e}")
