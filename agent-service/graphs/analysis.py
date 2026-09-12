"""Analysis graph — the on-demand deep dive (replaces the old orchestrator).

    intel ──▶ forecast ──┐
          └─▶ scenario ──┴─▶ strategy ──▶ report
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Callable, Optional

from strands.multiagent import GraphBuilder

from agents import forecaster, scenario, strategist
from agents.base import make_agent
from schemas import Forecast, GraphEvent, ScenarioSet
from tools.intel import search_news
from tools.memory import recall_memory
from tools.twin import compute_blast_radius, find_reroutes, load_twin, twin_cache
from tracing import TraceHooks, new_session_id


@dataclass
class AnalysisResult:
    forecast: Optional[Forecast]
    scenarios: Optional[ScenarioSet]
    report_markdown: str
    trace_id: str
    execution_order: list[str]
    steps: list[dict]


INTEL_PROMPT = (
    "You are the Intelligence agent. Use load_twin and search_news to summarise the current external situation for this twin in "
    "5 bullets, each with a source URL. Focus on the last 7 days."
)
REPORT_PROMPT = (
    "You are the Report writer. Combine the intelligence, forecast, scenarios and strategy inputs into a crisp markdown briefing with "
    "sections: ## Situation, ## Forecast, ## Scenarios, ## Recommended actions, ## Sources. Be specific, keep it under 500 words."
)


def run_analysis(supply_chain_id: str, user_id: str, query: str, emit: Callable[[GraphEvent], None] = lambda e: None) -> AnalysisResult:
    trace_id = new_session_id("analysis")
    hooks = [TraceHooks(trace_id, user_id, supply_chain_id, "analysis")]
    twin = twin_cache.get(supply_chain_id)

    intel = make_agent("orchestrator", INTEL_PROMPT, tools=[search_news, load_twin], hooks=hooks, name="intel")
    fc = make_agent("forecaster", forecaster.PROMPT, tools=[search_news, recall_memory], hooks=hooks, name="forecast", structured_output_model=Forecast)
    sc = make_agent("scenario", scenario.PROMPT, hooks=hooks, name="scenario", structured_output_model=ScenarioSet)
    st = make_agent("strategist", strategist.PROMPT, tools=[recall_memory, find_reroutes, compute_blast_radius], hooks=hooks, name="strategy")
    rp = make_agent("orchestrator", REPORT_PROMPT, hooks=hooks, name="report")

    gb = GraphBuilder()
    for node_id, agent in [("intel", intel), ("forecast", fc), ("scenario", sc), ("strategy", st), ("report", rp)]:
        gb.add_node(agent, node_id)
    gb.add_edge("intel", "forecast")
    gb.add_edge("intel", "scenario")
    gb.add_edge("forecast", "strategy")
    gb.add_edge("scenario", "strategy")
    gb.add_edge("strategy", "report")
    gb.set_entry_point("intel")
    gb.set_execution_timeout(240)
    graph = gb.build()

    t = time.time()
    emit(GraphEvent(type="node_start", node="analysis_graph"))
    res = graph(
        f"Supply chain id: {supply_chain_id} '{twin.name}'. Nodes: {[(n.id, n.label, n.type, n.country) for n in twin.nodes]}. "
        f"Edges: {[(e.source, e.target, e.mode) for e in twin.edges]}\nOperator question: {query}\nHorizon: 30d"
    )
    order = [n.node_id for n in res.execution_order]
    steps = []
    for node_id in order:
        nr = res.results.get(node_id)
        steps.append({"node": node_id, "status": str(getattr(nr, "status", "")), "elapsed_ms": getattr(nr, "execution_time", None)})
    emit(GraphEvent(type="node_end", node="analysis_graph", elapsed_ms=int((time.time() - t) * 1000), payload={"order": order}))

    def typed(node_id, model):
        so = getattr(getattr(res.results.get(node_id), "result", None), "structured_output", None)
        return so if isinstance(so, model) else None

    report = str(res.results["report"].result) if "report" in res.results else ""
    emit(GraphEvent(type="result", payload={"trace_id": trace_id}))
    return AnalysisResult(typed("forecast", Forecast), typed("scenario", ScenarioSet), report, trace_id, order, steps)
