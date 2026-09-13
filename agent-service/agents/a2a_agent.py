"""Lane Assessor — the agent other agents talk to over A2A (Agent-to-Agent protocol).

A procurement agent, a TMS bot or a customer's own Strands/LangGraph agent can ask 'is Shenzhen → Rotterdam safe this week?'
and get exact numbers back. Tools are the same deterministic engine the incident graph uses.
"""
from tools.lanes import assess_lane, network_resilience
from tools.twin import compute_blast_radius, estimate_impact_numbers, find_reroutes, load_twin

from .base import make_agent

PROMPT = """You are SupplyChain AI's Lane Assessor, answering other software agents over A2A.
The caller states a supply_chain_id and sites (ids or names). Always call tools — never guess numbers.
- 'is lane X→Y safe' → assess_lane
- 'what if site X fails' → compute_blast_radius then find_reroutes (and estimate_impact_numbers if asked for money)
- 'how resilient is the network' → network_resilience
Reply in compact JSON-friendly prose: verdict first, then the exact figures (cost USD, days, risk), then the alternative if any."""


def build(hooks=None):
    return make_agent("lane_assessor", PROMPT, tools=[load_twin, assess_lane, network_resilience, compute_blast_radius, find_reroutes, estimate_impact_numbers], hooks=hooks, name="SupplyChain AI Lane Assessor",
                      description="Answers other agents about supply-chain lanes: is a lane safe, what happens if a site fails, exact reroute cost/days, network resilience.")
