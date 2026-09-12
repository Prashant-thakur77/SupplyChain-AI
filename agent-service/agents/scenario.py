"""Scenario planner — realistic what-ifs grounded in the twin's geography."""
from schemas import ScenarioSet, Twin

from .base import call_structured, make_agent

PROMPT = """You are the Scenario planner. Generate 3 realistic, distinct what-if disruption scenarios for this twin, each naming real node ids
to fail, with a probability (0-1) and a duration in days. Ground them in the twin's geography and transport modes. Ids like s1, s2, s3."""


def build(hooks, model=None):
    return make_agent("scenario", PROMPT, hooks=hooks, model=model)


def run_scenario(agent, twin: Twin, disruption_type: str = "all") -> ScenarioSet:
    out = call_structured(
        agent,
        f"Supply chain id: {twin.supply_chain_id}. Nodes: {[(n.id, n.label, n.type, n.country) for n in twin.nodes]}. "
        f"Edges: {[(e.source, e.target, e.mode) for e in twin.edges]}\nType: {disruption_type}\nGenerate scenarios.",
        ScenarioSet,
    )
    return out
