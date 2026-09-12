"""Impact — quantifies business impact, anchored on the deterministic baseline tool."""
from routing import ReroutePlan
from schemas import Assessment, ImpactEstimate, Twin
from tools.twin import estimate_impact_numbers

from .base import make_agent

PROMPT = """You are the Impact analyst. Quantify the business impact of a disruption. Call estimate_impact_numbers first for the deterministic
baseline (nodes affected, network share, revenue at risk), then adjust with judgement (seasonality, mode, buffer stock hints in node data).
State assumptions explicitly. Your numbers must be consistent with the tool output — never contradict it."""


def build(hooks):
    return make_agent("impact", PROMPT, tools=[estimate_impact_numbers], hooks=hooks)


def run_impact(agent, twin: Twin, a: Assessment, plan: ReroutePlan) -> ImpactEstimate:
    delay = max([c.added_days for c in plan.candidates if c.feasible] or [7.0])
    res = agent(
        f"Supply chain id: {twin.supply_chain_id}\nDisruption: {a.model_dump_json()}\n"
        f"Best reroute adds {delay} days. Infeasible lanes: {plan.infeasible_count}.\nQuantify impact.",
        structured_output_model=ImpactEstimate,
    )
    return res.structured_output
