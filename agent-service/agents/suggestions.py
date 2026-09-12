"""Suggestions — proactive advice for the twin builder (drives the assistant panel's suggestion chips)."""
from schemas import SuggestionList

from .base import call_structured, make_agent

PROMPT = """You are a supply chain optimization advisor embedded in a digital twin builder.
Analyse the supply chain graph context you are given (nodes, connections, risks, costs) and return 3-5 actionable suggestions.
Rules:
1. Each suggestion must name a specific node, a specific route by its endpoints, or a specific structural pattern visible in the context.
2. Describe a concrete action — what to do, not what the problem is.
3. A suggestion that would apply equally to a completely different supply chain is generic and must be rewritten or dropped.
4. Sort by descending impact: the highest-risk or highest-cost weakness first.
5. Categories: optimization, risk, efficiency, cost, planning. Title max 3 words. confidence 0-100.
If the graph is empty or has fewer than 2 nodes, return an empty list."""


def build(hooks):
    return make_agent("copilot", PROMPT, hooks=hooks, name="suggestions")


def run_suggestions(agent, prompt: str) -> SuggestionList:
    return call_structured(agent, prompt, SuggestionList)
