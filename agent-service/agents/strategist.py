"""Strategist — the executable mitigation plan."""
from schemas import Assessment, ImpactEstimate, MitigationPlan, RouteRanking, Twin
from tools.memory import recall_memory

from .base import call_structured, make_agent

PROMPT = """You are the Strategist. Produce a concrete mitigation plan an operations manager can execute this week: reroute execution,
customer communications, safety stock, alternate supplier outreach, insurance/claims, and monitoring triggers to revisit the decision.
3-6 steps, each with an owner role and due_in_days. Use recall_memory to reuse what worked before for this supply chain.
estimated_cost_usd must include the recommended reroute's added cost."""


def build(hooks, structured: bool = False, model=None):
    return make_agent("strategist", PROMPT, tools=[recall_memory], hooks=hooks, structured_output_model=MitigationPlan if structured else None, model=model)


def run_strategist(agent, twin: Twin, a: Assessment, r: RouteRanking, i: ImpactEstimate) -> MitigationPlan:
    out = call_structured(
        agent,
        f"Supply chain id: {twin.supply_chain_id}\nDisruption: {a.model_dump_json()}\nRouting decision: {r.model_dump_json()}\n"
        f"Impact: {i.model_dump_json()}\nWrite the plan.",
        MitigationPlan,
    )
    return out
