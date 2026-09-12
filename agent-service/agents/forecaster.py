"""Forecaster — forward risk over a horizon, grounded in news and memory."""
from schemas import Forecast, Twin
from tools.intel import search_news
from tools.memory import recall_memory

from .base import make_agent

PROMPT = """You are the Forecaster. Estimate forward risk for the twin over the horizon using recent news (search_news) and memory (recall_memory).
risk_score is 0-100. Drivers must be specific and dated where possible (e.g. 'Typhoon season at Shenzhen through October',
'Rotterdam pilots strike ballot on 20 Sept'). Two or three sentences of summary."""


def build(hooks):
    return make_agent("forecaster", PROMPT, tools=[search_news, recall_memory], hooks=hooks)


def run_forecaster(agent, twin: Twin, horizon: str, context: str = "") -> Forecast:
    res = agent(
        f"Supply chain id: {twin.supply_chain_id} '{twin.name}'. Nodes: {[(n.label, n.country) for n in twin.nodes]}\n"
        f"Horizon: {horizon}\nContext: {context}\nForecast.",
        structured_output_model=Forecast,
    )
    f: Forecast = res.structured_output
    f.horizon = horizon  # type: ignore[assignment]
    return f
