"""Router — ranks route candidates the engine computed. It never computes routes itself."""
from routing import ReroutePlan
from schemas import Assessment, RouteRanking, Twin

from .base import make_agent

PROMPT = """You are the Router. You NEVER compute routes yourself — the candidates you receive were computed exactly by a Dijkstra engine.
Rank the feasible candidates for an operations manager weighing added cost, added days, and risk (max_risk on the path and node risk levels).
Prefer the lowest added cost unless it adds 5 or more days more than the next option, or passes through a node with risk_level >= 4.
Decide whether simply waiting is viable (only if the disruption is likely to clear within the baseline transit slack).
Explain trade-offs in plain language an operator can repeat to their boss."""


def build(hooks):
    return make_agent("router", PROMPT, hooks=hooks)


def run_router(agent, twin: Twin, a: Assessment, plan: ReroutePlan) -> RouteRanking:
    risk = {n.id: n.risk_level for n in twin.nodes}
    cands = "\n".join(
        f"- {c.id}: {' -> '.join(c.labels)} | modes={c.modes} | cost=${c.cost:.0f} (+{c.added_cost:.0f}) | "
        f"days={c.transit_days:.0f} (+{c.added_days:.0f}) | max_risk={c.max_risk} | node_risks={[risk.get(n, 0) for n in c.path]} | feasible={c.feasible}"
        for c in plan.candidates
    )
    res = agent(
        f"Disruption: {a.title} ({a.severity.value}) — {a.summary}\nSevered pairs: {plan.severed_pairs}\nCandidates:\n{cands}\n\nRank them.",
        structured_output_model=RouteRanking,
    )
    r: RouteRanking = res.structured_output
    feasible = {c.id: c for c in plan.candidates if c.feasible}
    r.ranked_candidate_ids = [i for i in r.ranked_candidate_ids if i in feasible] or sorted(
        feasible, key=lambda i: (feasible[i].added_cost, feasible[i].added_days)
    )
    if r.recommended_candidate_id not in feasible:
        r.recommended_candidate_id = r.ranked_candidate_ids[0] if r.ranked_candidate_ids else None
    return r
