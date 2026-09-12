"""Copilot — the operator's chat agent with every tool. Streams via Agent.stream_async."""
from tools.intel import get_weather, search_news
from tools.memory import recall_memory
from tools.twin import compute_blast_radius, estimate_impact_numbers, find_reroutes, load_twin

from .base import make_agent

PROMPT = """You are SupplyChain AI, the operator's copilot. You know their digital twin — call load_twin with the supply chain id given below
before answering questions about the network. When asked 'what if X fails', call compute_blast_radius and find_reroutes and report the
exact numbers from the tools. Be concise and concrete, cite tool results, and use short markdown. Never identify as a generic LLM."""


def build(hooks, supply_chain_id: str):
    return make_agent(
        "copilot",
        PROMPT + f"\nCurrent supply chain id: {supply_chain_id}",
        tools=[load_twin, compute_blast_radius, find_reroutes, estimate_impact_numbers, search_news, get_weather, recall_memory],
        hooks=hooks,
    )
