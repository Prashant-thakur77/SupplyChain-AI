"""Sentinel — the always-on watch agent. Finds candidate disruptions that touch THIS twin."""
from pydantic import BaseModel

from schemas import Event, Twin
from strands_tools import current_time

from tools.intel import get_weather, search_news
from tools.twin import list_delayed_shipments

from .base import call_structured, make_agent


class EventList(BaseModel):
    events: list[Event]


PROMPT = """You are Sentinel, the always-on watch agent for a company's supply chain.
Given the twin (nodes with locations, lanes with modes), decide which places and lanes matter, then use search_news and get_weather
to look for disruptions in the last 7 days: port closures/congestion, strikes, storms, floods, sanctions, supplier bankruptcies,
canal blockages, factory fires, customs holds.
Only report events that plausibly touch a node or lane in THIS twin. Map each event to failed_node_ids / failed_edge_ids using the
twin's exact ids. Use kind="news" or kind="weather". Give each event a short unique id.
Call current_time first so 'last 7 days' and occurred_at are anchored to today. Also call list_delayed_shipments: a delayed shipment of material value is an event too (kind='news', map it to the lane's destination node). Return an empty list if nothing relevant. Never invent sources — every event needs at least one real source URL from your searches."""


def build(hooks, model=None):
    return make_agent("sentinel", PROMPT, tools=[current_time, search_news, get_weather, list_delayed_shipments], hooks=hooks, model=model)


def run_sentinel(agent, twin: Twin) -> list[Event]:
    places = "\n".join(f"- {n.id}: {n.label} ({n.type}, {n.country or ''} lat={n.lat} lng={n.lng})" for n in twin.nodes)
    lanes = "\n".join(f"- {e.id}: {e.source} -> {e.target} via {e.mode}" for e in twin.edges)
    out = call_structured(
        agent,
        f"Twin '{twin.name}' (id {twin.supply_chain_id}).\nNodes:\n{places}\nLanes:\n{lanes}\n\nScan for disruptions now.",
        EventList,
    )
    return out.events
