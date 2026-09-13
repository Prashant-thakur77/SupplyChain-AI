"""Explainable site risk score (0–5). Blends structure (concentration, fragility), geography, and recent signals (news, weather).

Deterministic; recomputed nightly by the cron. Each component is 0–1 and weighted; the breakdown is stored so the UI can explain it.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from resilience import audit
from routing import build_graph, shortest_path
from schemas import Twin

# Coarse country risk index (0 calm … 1 volatile) for planning; override per org later. Unknown countries default to 0.35.
COUNTRY_RISK: dict[str, float] = {
    "US": 0.15, "CA": 0.12, "GB": 0.2, "DE": 0.12, "FR": 0.18, "NL": 0.1, "BE": 0.12, "CH": 0.08, "SE": 0.1, "DK": 0.1, "NO": 0.1, "FI": 0.1, "IE": 0.12, "ES": 0.2, "IT": 0.25, "PL": 0.25, "CZ": 0.2, "AT": 0.12,
    "JP": 0.15, "KR": 0.25, "SG": 0.1, "AU": 0.12, "NZ": 0.1, "CN": 0.45, "TW": 0.5, "HK": 0.4, "IN": 0.4, "VN": 0.35, "TH": 0.35, "MY": 0.3, "ID": 0.4, "PH": 0.45, "BD": 0.5, "LK": 0.5, "PK": 0.6,
    "AE": 0.3, "SA": 0.4, "EG": 0.55, "TR": 0.45, "IL": 0.55, "ZA": 0.4, "NG": 0.65, "KE": 0.45, "MA": 0.3, "MX": 0.4, "BR": 0.35, "AR": 0.45, "CL": 0.25, "CO": 0.45, "UA": 0.9, "RU": 0.9, "IR": 0.9, "YE": 0.95, "MM": 0.85, "SD": 0.95,
}
WEIGHTS = {"concentration": 0.30, "fragility": 0.25, "geo": 0.20, "news": 0.15, "weather": 0.10}


@dataclass
class RiskScore:
    node_id: str
    label: str
    score: float  # 0–5
    level: str    # Low | Medium | High | Critical
    components: dict[str, float] = field(default_factory=dict)  # each 0–1
    reasons: list[str] = field(default_factory=list)


def _concentration(twin: Twin) -> dict[str, float]:
    """Share of origin→destination lanes (value-weighted when flows exist) whose healthy path passes through each node."""
    g = build_graph(twin)
    indeg = {n.id: 0 for n in twin.nodes}
    outdeg = {n.id: 0 for n in twin.nodes}
    for e in twin.edges:
        outdeg[e.source] = outdeg.get(e.source, 0) + 1
        indeg[e.target] = indeg.get(e.target, 0) + 1
    lanes = [(a.id, b.id) for a in twin.nodes for b in twin.nodes if a.id != b.id and indeg.get(a.id, 0) == 0 and outdeg.get(b.id, 0) == 0]
    weight = {l: 1.0 for l in lanes}
    if twin.flows:
        w2 = {l: 0.0 for l in lanes}
        for f in twin.flows:
            if (f.origin, f.destination) in w2:
                w2[(f.origin, f.destination)] += f.value_per_week
        if any(w2.values()):
            weight = {l: (v if v else 0.05) for l, v in w2.items()}
    total = sum(weight.values()) or 1.0
    through: dict[str, float] = {n.id: 0.0 for n in twin.nodes}
    for lane, w in weight.items():
        p = shortest_path(g, lane[0], lane[1])
        if not p:
            continue
        for nid in p.path[1:-1]:  # intermediates carry the lane; endpoints are by definition on it
            through[nid] += w
        through[lane[0]] += w * 0.5
        through[lane[1]] += w * 0.5
    return {k: min(1.0, v / total) for k, v in through.items()}


def score_twin(twin: Twin, news_counts: dict[str, int] | None = None, adverse_weather: set[str] | None = None) -> list[RiskScore]:
    news_counts = news_counts or {}
    adverse_weather = adverse_weather or set()
    conc = _concentration(twin)
    rep = audit(twin)
    frag = {c.id: c.fragility / 100.0 for c in rep.cases if c.kind == "node"}
    spof = {c.id for c in rep.cases if c.kind == "node" and c.lanes_cut > 0}
    out: list[RiskScore] = []
    for n in twin.nodes:
        comp = {
            "concentration": round(conc.get(n.id, 0.0), 3),
            "fragility": round(min(1.0, frag.get(n.id, 0.0) + (0.3 if n.id in spof else 0.0)), 3),
            "geo": COUNTRY_RISK.get((n.country or "").upper(), 0.35),
            "news": round(min(1.0, news_counts.get(n.id, 0) / 5.0), 3),
            "weather": 1.0 if n.id in adverse_weather else 0.0,
        }
        raw = sum(WEIGHTS[k] * v for k, v in comp.items())
        score = round(min(5.0, raw * 5.0 * 1.15), 1)  # slight stretch so a fully exposed node reaches the top of the scale
        level = "Critical" if score >= 4 else "High" if score >= 3 else "Medium" if score >= 1.8 else "Low"
        reasons = []
        if comp["concentration"] >= 0.5: reasons.append(f"{int(comp['concentration']*100)}% of flow value passes through it")
        if n.id in spof: reasons.append("single point of failure — no bypass if it fails")
        elif comp["fragility"] >= 0.3: reasons.append("expensive to bypass")
        if comp["geo"] >= 0.45: reasons.append(f"elevated country risk ({n.country})")
        if news_counts.get(n.id, 0): reasons.append(f"{news_counts[n.id]} alert(s) in the last 30 days")
        if n.id in adverse_weather: reasons.append("adverse weather right now")
        if not reasons: reasons.append("redundant and quiet")
        out.append(RiskScore(n.id, n.label, score, level, comp, reasons))
    out.sort(key=lambda r: r.score, reverse=True)
    return out
