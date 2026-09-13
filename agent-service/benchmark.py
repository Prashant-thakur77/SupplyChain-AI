"""Network benchmarking — where does this twin's resilience sit against similar-sized networks?

Snapshots are anonymised (hash of the chain id, counts, score). A seeded reference distribution (built from the product's
industry templates and typical shapes) keeps percentiles meaningful before many tenants exist.
"""
from __future__ import annotations

import hashlib
from bisect import bisect_left

import db

# Reference scores by size band — typical spread seen on template/pilot networks (hub-and-spoke, single-sourced, dual-sourced …).
REFERENCE: dict[str, list[float]] = {
    "small": [22, 28, 31, 35, 38, 41, 44, 47, 49, 52, 55, 58, 61, 64, 68, 72, 76, 81, 86, 90],
    "medium": [30, 34, 38, 41, 44, 47, 50, 53, 55, 58, 60, 63, 66, 69, 72, 75, 79, 83, 87, 91],
    "large": [35, 40, 44, 47, 50, 53, 56, 59, 62, 64, 67, 70, 73, 76, 79, 82, 85, 88, 91, 94],
}


def size_band(node_count: int) -> str:
    return "small" if node_count <= 8 else "medium" if node_count <= 20 else "large"


def chain_hash(supply_chain_id: str) -> str:
    return hashlib.sha256(f"scai:{supply_chain_id}".encode()).hexdigest()


def record(supply_chain_id: str, node_count: int, lane_count: int, score: float, spof: int, single_source: int) -> None:
    try:
        db.client().table("resilience_snapshots").upsert({
            "chain_hash": chain_hash(supply_chain_id), "size_band": size_band(node_count), "node_count": node_count, "lane_count": lane_count,
            "score": score, "spof_count": spof, "single_source_count": single_source, "updated_at": db.datetime.now(db.timezone.utc).isoformat(),
        }).execute()
    except Exception:
        pass


def percentile(supply_chain_id: str, node_count: int, score: float) -> dict:
    band = size_band(node_count)
    peers: list[float] = []
    try:
        rows = db.client().table("resilience_snapshots").select("chain_hash,score").eq("size_band", band).execute().data or []
        me = chain_hash(supply_chain_id)
        peers = [float(r["score"]) for r in rows if r["chain_hash"] != me]
    except Exception:
        peers = []
    pool = sorted(peers + REFERENCE[band])
    below = bisect_left(pool, score)
    pct = round(100 * below / len(pool)) if pool else 50
    median = pool[len(pool) // 2] if pool else None
    top_quartile = pool[int(len(pool) * 0.75)] if pool else None
    return {"size_band": band, "percentile": pct, "peers": len(peers), "reference": len(REFERENCE[band]), "median_score": median, "top_quartile_score": top_quartile,
            "gap_to_top_quartile": round(max(0.0, (top_quartile or 0) - score), 1)}
