"""Copilot — the operator's chat agent with every tool. Streams via Agent.stream_async."""
from strands.agent.conversation_manager import SlidingWindowConversationManager

from tools.intel import get_weather, search_news
from tools.memory import recall_memory
from tools.twin import compute_blast_radius, estimate_impact_numbers, find_reroutes, list_delayed_shipments, load_twin

from .base import make_agent

PROMPT = """You are SupplyChain AI, the operator's copilot. You know their digital twin — call load_twin with the supply chain id given below
before answering questions about the network. When asked 'what if X fails', call compute_blast_radius and find_reroutes and report the
exact numbers from the tools. Be concise and concrete, cite tool results, and use short markdown. Never identify as a generic LLM.
Always refer to sites and lanes by their names (labels) — never print raw ids or uuids. Lead with the answer (one sentence), then the numbers."""


def to_messages(history: list[dict]) -> list[dict]:
    """Convert client turns [{role: user|assistant, text}] into Strands/Bedrock-style messages."""
    out = []
    for h in history or []:
        role = "assistant" if h.get("role") == "assistant" else "user"
        text = (h.get("text") or "").strip()
        if not text:
            continue
        if out and out[-1]["role"] == role:  # providers reject consecutive same-role turns
            out[-1]["content"][0]["text"] += "\n\n" + text
        else:
            out.append({"role": role, "content": [{"text": text}]})
    # Conversations must start with the user and end with the assistant before the new user turn.
    while out and out[0]["role"] != "user":
        out.pop(0)
    if out and out[-1]["role"] == "user":
        out.pop()
    return out


def build(hooks, supply_chain_id: str, model=None, history: list[dict] | None = None):
    agent = make_agent(
        "copilot",
        PROMPT + f"\nCurrent supply chain id: {supply_chain_id}",
        tools=[load_twin, compute_blast_radius, find_reroutes, estimate_impact_numbers, list_delayed_shipments, search_news, get_weather, recall_memory],
        hooks=hooks,
        model=model,
    )
    agent.conversation_manager = SlidingWindowConversationManager(window_size=20)
    if history:
        agent.messages = to_messages(history)
    return agent
