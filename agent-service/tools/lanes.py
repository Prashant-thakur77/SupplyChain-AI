"""Lane-level tools exposed to other agents over A2A (and to the copilot)."""
from __future__ import annotations

from strands import tool

from tools._ctx import chain_id

import resilience
import risk
from routing import build_graph, k_best_routes, shortest_path
from tools._result import err, ok
from tools.twin import twin_cache


def _resolve(twin, ref: str) -> str | None:
    r = (ref or "").strip().lower()
    for n in twin.nodes:
        if n.id.lower() == r or n.label.strip().lower() == r:
            return n.id
    return None


@tool
def assess_lane(supply_chain_id: str = "", origin: str = "", destination: str = "") -> dict:
    """Is this lane safe? Returns the current best path, cost, days, max node risk on the path, whether an alternative exists,
    and how much the alternative would cost. Origin/destination accept site ids or names."""
    supply_chain_id = chain_id(supply_chain_id)
    try:
        twin = twin_cache.get(supply_chain_id)
        o, d = _resolve(twin, origin), _resolve(twin, destination)
        if not o or not d:
            return err(f"unknown site(s): {origin if not o else ''} {destination if not d else ''}".strip())
        g = build_graph(twin)
        best = shortest_path(g, o, d, set(), set())
        if not best:
            return err("no path between these sites")
        risk_by = {n.id: n.risk_level for n in twin.nodes}
        path_risk = max(risk_by.get(n, 0) for n in best.path)
        # alternative that avoids the riskiest transit node
        transit = [n for n in best.path[1:-1]]
        worst = max(transit, key=lambda n: risk_by.get(n, 0)) if transit else None
        alt = k_best_routes(twin, o, d, [worst] if worst else [], [], 1) if worst else []
        scores = {s.node_id: s for s in risk.score_twin(twin)}
        return ok({
            "lane": f"{g.labels.get(o, o)} → {g.labels.get(d, d)}",
            "best_path": [g.labels.get(n, n) for n in best.path], "cost_usd": round(best.cost, 0), "transit_days": best.days, "modes": sorted({g.edges[e].mode for e in best.edge_ids if e in g.edges}),
            "max_node_risk": path_risk, "riskiest_transit": g.labels.get(worst, worst) if worst else None,
            "risk_score": round(max((scores[n].score for n in best.path if n in scores), default=0), 1),
            "alternative": ({"path": alt[0].labels, "added_cost_usd": alt[0].added_cost, "added_days": alt[0].added_days} if alt else None),
            "verdict": "safe" if path_risk <= 2 else ("watch" if path_risk == 3 else "at_risk"),
        })
    except Exception as e:
        return err(f"assess_lane failed: {e}")


@tool
def network_resilience(supply_chain_id: str = "") -> dict:
    """Resilience score (0-100), grade, single points of failure and single-source sites for a supply chain."""
    supply_chain_id = chain_id(supply_chain_id)
    try:
        r = resilience.audit(twin_cache.get(supply_chain_id))
        return ok(r.model_dump() if hasattr(r, "model_dump") else r.__dict__)
    except Exception as e:
        return err(f"network_resilience failed: {e}")
