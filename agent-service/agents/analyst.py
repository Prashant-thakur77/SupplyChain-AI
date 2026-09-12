"""Analyst — grades one event against the twin: severity, confidence, affected ids, sources."""
from schemas import Assessment, Event, Twin
from tools.twin import compute_blast_radius

from .base import call_structured, make_agent

PROMPT = """You are the Analyst. You receive one candidate disruption event and the twin. Decide how bad it is for THIS network.
Distinguish carefully:
- failed_node_ids / failed_edge_ids = the nodes or lanes that are actually DOWN or unusable (usually the event's location). Use exact twin ids.
- affected_node_ids = downstream nodes whose flow is impacted but which still operate (from compute_blast_radius).
Use compute_blast_radius(failed_node_ids) to see what is cut off. Severity rubric:
- CRITICAL = a node with no alternate path is down, or more than half of downstream nodes are cut off
- HIGH = a key lane or node is down but alternates exist
- MEDIUM = delays or cost increases likely, flow continues
- LOW = monitor only
confidence is 0-1 and reflects source quality AND how directly the event maps to the twin.
Set needs_review=true if confidence < 0.6 or there are no sources.
Keep the summary to 2-3 sentences an operations manager can act on. Copy sources from the event. Pick the best category."""


def build(hooks, model=None):
    return make_agent("analyst", PROMPT, tools=[compute_blast_radius], hooks=hooks, model=model)


def run_analyst(agent, twin: Twin, event: Event, memories: list[str]) -> Assessment:
    mem = "\n".join(f"- {m}" for m in memories) or "- none"
    out = call_structured(
        agent,
        f"Supply chain id: {twin.supply_chain_id}\nEvent: {event.model_dump_json()}\n"
        f"Nodes: {[(n.id, n.label, n.type) for n in twin.nodes]}\nPast memories:\n{mem}\n\nAssess it.",
        Assessment,
    )
    a: Assessment = out
    a.event_id = event.id
    if not a.sources:
        a.sources = event.sources
    if not a.failed_node_ids and not a.failed_edge_ids:
        a.failed_node_ids, a.failed_edge_ids = list(event.failed_node_ids), list(event.failed_edge_ids)
    # Downstream nodes are never "failed"; keep the two sets disjoint.
    a.affected_node_ids = [n for n in a.affected_node_ids if n not in a.failed_node_ids]
    a.needs_review = a.needs_review or a.confidence < 0.6 or len(a.sources) == 0
    return a
