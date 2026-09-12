"""SupplyChain AI agent-service — FastAPI front door for the Strands agents.

Also implements the Amazon Bedrock AgentCore Runtime contract (`GET /ping`, `POST /invocations`, port 8080) so the
same container deploys unchanged to AgentCore.
"""
from __future__ import annotations

import asyncio
import dataclasses
import json
import queue
import threading
from typing import Any, Callable, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

import db
from agents import copilot, forecaster, impact, router, scenario, sentinel, strategist
from config import settings
from graphs.analysis import run_analysis
from graphs.incident import run_incident
from routing import reroute_plan
from schemas import Assessment, Event, GraphEvent, Severity, Twin
from tools.twin import twin_cache
from tracing import TraceHooks, new_session_id

app = FastAPI(title="SupplyChain AI agent-service", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def auth(x_agent_secret: Optional[str] = Header(default=None)):
    if settings.agent_service_secret and x_agent_secret != settings.agent_service_secret:
        raise HTTPException(401, "bad secret")


# ---- request models --------------------------------------------------------------------------------------------------
class RerouteIn(BaseModel):
    supply_chain_id: str
    failed_node_ids: list[str] = []
    failed_edge_ids: list[str] = []
    k: int = 3
    twin: Optional[Twin] = None


class IncidentIn(BaseModel):
    supply_chain_id: str
    user_id: str
    event: Event
    persist: bool = True
    twin: Optional[Twin] = None


class ScanIn(BaseModel):
    supply_chain_id: str
    user_id: str


class AnalysisIn(BaseModel):
    supply_chain_id: str
    user_id: str
    query: str
    twin: Optional[Twin] = None


class ChatIn(BaseModel):
    supply_chain_id: str
    user_id: str
    message: str
    twin: Optional[Twin] = None


class SimpleIn(BaseModel):
    supply_chain_id: str
    user_id: str = "system"
    horizon: str = "30d"
    disruption_type: str = "all"
    context: str = ""
    assessment: Optional[Assessment] = None
    failed_node_ids: list[str] = []
    twin: Optional[Twin] = None


# ---- helpers ---------------------------------------------------------------------------------------------------------
def _dump(o: Any):
    if hasattr(o, "model_dump"):
        return o.model_dump(mode="json")
    if dataclasses.is_dataclass(o):
        return {f.name: getattr(o, f.name) for f in dataclasses.fields(o)}
    if isinstance(o, Severity):
        return o.value
    return str(o)


def to_json(o: Any) -> Any:
    return json.loads(json.dumps(o, default=_dump))


def _stream(worker: Callable[[Callable[[GraphEvent], None]], Any]) -> EventSourceResponse:
    """Run a blocking worker in a thread; forward GraphEvents as SSE frames; the final `result` frame carries the return value."""
    q: "queue.Queue[Any]" = queue.Queue()

    def emit(e: GraphEvent) -> None:
        q.put(e)

    def run() -> None:
        try:
            q.put(("__result__", worker(emit)))
        except Exception as ex:  # noqa: BLE001
            q.put(GraphEvent(type="error", payload={"error": str(ex)}))
            q.put(("__result__", None))

    threading.Thread(target=run, daemon=True).start()

    async def gen():
        loop = asyncio.get_event_loop()
        while True:
            item = await loop.run_in_executor(None, q.get)
            if isinstance(item, tuple):
                yield {"event": "final", "data": json.dumps(to_json(item[1]))}
                return
            yield {"event": item.type, "data": item.model_dump_json()}

    return EventSourceResponse(gen())


def _twin(inp) -> Twin:
    if getattr(inp, "twin", None):
        twin_cache.put(inp.twin)
    return twin_cache.get(inp.supply_chain_id)


def _hooks(stage: str, inp) -> list:
    return [TraceHooks(new_session_id(stage), getattr(inp, "user_id", None), inp.supply_chain_id, stage)]


def _manual_assessment(inp: SimpleIn, title: str) -> Assessment:
    return inp.assessment or Assessment(
        event_id="manual", title=title, summary=inp.context or title, severity=Severity.HIGH, confidence=0.7,
        failed_node_ids=inp.failed_node_ids, affected_node_ids=[], affected_edge_ids=[], sources=[], needs_review=True,
    )


# ---- routes ----------------------------------------------------------------------------------------------------------
@app.get("/ping")
def ping():
    return {"status": "healthy", "provider": settings.agent_model_provider, "model": settings.bedrock_model_id if settings.agent_model_provider == "bedrock" else settings.gemini_model_id}


@app.post("/reroute", dependencies=[Depends(auth)])
def reroute(inp: RerouteIn):
    p = reroute_plan(_twin(inp), inp.failed_node_ids, inp.failed_edge_ids, inp.k)
    return {"severity": p.severity, "feasible_count": p.feasible_count, "infeasible_count": p.infeasible_count,
            "severed_pairs": p.severed_pairs, "baseline": p.baseline, "candidates": [c.model_dump() for c in p.candidates]}


@app.post("/incident", dependencies=[Depends(auth)])
def incident(inp: IncidentIn):
    _twin(inp)
    return _stream(lambda emit: run_incident(inp.supply_chain_id, inp.user_id, inp.event, emit, inp.persist))


@app.post("/incident/sync", dependencies=[Depends(auth)])
def incident_sync(inp: IncidentIn):
    _twin(inp)
    return to_json(run_incident(inp.supply_chain_id, inp.user_id, inp.event, persist=inp.persist))


@app.post("/scan", dependencies=[Depends(auth)])
def scan(inp: ScanIn):
    twin_cache.clear(inp.supply_chain_id)
    twin = twin_cache.get(inp.supply_chain_id)
    sid = new_session_id("scan")
    hooks = [TraceHooks(sid, inp.user_id, inp.supply_chain_id, "scan")]
    events = sentinel.run_sentinel(sentinel.build(hooks), twin)
    seen = db.recent_event_fingerprints(inp.supply_chain_id)
    processed = []
    for ev in events:
        if db.fingerprint(ev.title, ev.failed_node_ids) in seen:
            continue
        r = run_incident(inp.supply_chain_id, inp.user_id, ev, persist=True)
        processed.append({"event": ev.title, "status": r.status, "severity": r.assessment.severity.value, "decision_id": r.decision_id,
                          "notification_id": r.notification_id})
    db.insert_audit(inp.user_id, "Sentinel", f"Scan complete: {len(events)} events found, {len(processed)} new", {"session": sid})
    return {"scanned": len(events), "processed": processed, "trace_id": sid}


class SentinelIn(BaseModel):
    supply_chain_id: str
    user_id: str = "system"
    twin: Optional[Twin] = None


@app.post("/sentinel", dependencies=[Depends(auth)])
def sentinel_ep(inp: SentinelIn):
    """Sentinel only: candidate events for a twin (news + weather), no incident graph. Used by the demo's 'scan live news'."""
    twin = _twin(inp)
    events = sentinel.run_sentinel(sentinel.build(_hooks("sentinel", inp)), twin)
    labels = {n.id: n.label for n in twin.nodes}
    return {"events": [e.model_dump() | {"failed_labels": [labels.get(i, i) for i in e.failed_node_ids]} for e in events], "scanned_at": __import__("datetime").datetime.utcnow().isoformat() + "Z"}


@app.post("/analysis", dependencies=[Depends(auth)])
def analysis(inp: AnalysisIn):
    _twin(inp)
    return _stream(lambda emit: run_analysis(inp.supply_chain_id, inp.user_id, inp.query, emit))


@app.post("/analysis/sync", dependencies=[Depends(auth)])
def analysis_sync(inp: AnalysisIn):
    _twin(inp)
    return to_json(run_analysis(inp.supply_chain_id, inp.user_id, inp.query))


@app.post("/chat", dependencies=[Depends(auth)])
async def chat(inp: ChatIn):
    """Streams the copilot. Transient provider errors before the first token rotate key/model like the batch paths."""
    from models import is_transient, make_model, model_plans

    _twin(inp)
    hooks = _hooks("chat", inp)

    async def gen():
        last_err: Optional[Exception] = None
        for key, mid in model_plans("copilot"):
            agent = copilot.build(hooks, inp.supply_chain_id, model=make_model("copilot", api_key=key, model_id=mid))
            emitted = False
            try:
                async for ev in agent.stream_async(inp.message):
                    if "data" in ev:
                        emitted = True
                        yield {"event": "token", "data": json.dumps({"text": ev["data"]})}
                    elif "current_tool_use" in ev and ev["current_tool_use"].get("name"):
                        yield {"event": "tool", "data": json.dumps({"name": ev["current_tool_use"]["name"]})}
                last_err = None
                break
            except Exception as ex:  # noqa: BLE001
                last_err = ex
                if emitted or not is_transient(ex):
                    break
                print(f"[chat] transient error ({str(ex)[:60]}…) — switching model")
                await asyncio.sleep(1.0)
        if last_err is not None:
            msg = "The model is rate-limited right now — please try again in a minute." if is_transient(last_err) else str(last_err)
            yield {"event": "error", "data": json.dumps({"error": msg})}
        yield {"event": "final", "data": "{}"}

    return EventSourceResponse(gen())


@app.post("/forecast", dependencies=[Depends(auth)])
def forecast(inp: SimpleIn):
    twin = _twin(inp)
    return forecaster.run_forecaster(forecaster.build(_hooks("forecast", inp)), twin, inp.horizon, inp.context).model_dump()


@app.post("/scenario", dependencies=[Depends(auth)])
def scenario_ep(inp: SimpleIn):
    twin = _twin(inp)
    return scenario.run_scenario(scenario.build(_hooks("scenario", inp)), twin, inp.disruption_type).model_dump()


@app.post("/impact", dependencies=[Depends(auth)])
def impact_ep(inp: SimpleIn):
    twin = _twin(inp)
    a = _manual_assessment(inp, "Impact assessment")
    plan = reroute_plan(twin, a.failed_node_ids, a.failed_edge_ids, 3)
    return {"impact": impact.run_impact(impact.build(_hooks("impact", inp)), twin, a, plan).model_dump(),
            "reroute": {"severity": plan.severity, "candidates": [c.model_dump() for c in plan.candidates]}}


@app.post("/strategy", dependencies=[Depends(auth)])
def strategy_ep(inp: SimpleIn):
    twin = _twin(inp)
    hooks = _hooks("strategy", inp)
    a = _manual_assessment(inp, "Strategy request")
    plan = reroute_plan(twin, a.failed_node_ids, a.failed_edge_ids, 3)
    r = router.run_router(router.build(hooks), twin, a, plan)
    i = impact.run_impact(impact.build(hooks), twin, a, plan)
    m = strategist.run_strategist(strategist.build(hooks), twin, a, r, i)
    return {"ranking": r.model_dump(), "impact": i.model_dump(), "plan": m.model_dump(), "candidates": [c.model_dump() for c in plan.candidates]}


@app.post("/weather", dependencies=[Depends(auth)])
def weather_ep(inp: SimpleIn):
    from tools.intel import get_weather

    twin = _twin(inp)
    out = []
    for n in twin.nodes:
        if n.lat is None or n.lng is None:
            continue
        w = get_weather(lat=n.lat, lng=n.lng)
        if w.get("status") == "success":
            out.append({"node_id": n.id, "label": n.label, **w["content"][0]["json"]})
    return {"nodes": out, "severe": [o for o in out if o.get("severe")]}


# ---- AgentCore contract ----------------------------------------------------------------------------------------------
@app.post("/invocations")
def invocations(payload: dict):
    """Single entrypoint used by Bedrock AgentCore Runtime. `action` selects the handler; default is copilot chat."""
    action = payload.pop("action", "chat")
    if action == "reroute":
        return reroute(RerouteIn(**payload))
    if action == "scan":
        return scan(ScanIn(**payload))
    if action == "forecast":
        return forecast(SimpleIn(**payload))
    if action == "scenario":
        return scenario_ep(SimpleIn(**payload))
    if action == "impact":
        return impact_ep(SimpleIn(**payload))
    if action == "strategy":
        return strategy_ep(SimpleIn(**payload))
    if action == "incident":
        return incident_sync(IncidentIn(**payload))
    if action == "analysis":
        return analysis_sync(AnalysisIn(**payload))
    if action == "report_simulation":
        return report_simulation(SimulationIn(**payload))
    if action == "report_strategy":
        return report_strategy(SimulationIn(**payload))
    if action == "report_forecast":
        return report_forecast(ForecastReportIn(**payload))
    if action == "sentinel":
        return sentinel_ep(SentinelIn(**payload))
    if action == "memory":
        return memory_ep(MemoryIn(**payload))
    if action == "report_live_intel":
        return report_live_intel(LiveIntelIn(**payload))
    inp = ChatIn(**{k: v for k, v in payload.items() if k in ChatIn.model_fields} | ({"message": payload["prompt"]} if "prompt" in payload else {}))
    _twin(inp)
    agent = copilot.build(_hooks("chat", inp), inp.supply_chain_id)
    return {"text": str(agent(inp.message))}


# ---- Report endpoints for the existing web screens ------------------------------------------------------------------
from agents import reports  # noqa: E402


class SimulationIn(BaseModel):
    supply_chain_id: str
    user_id: str = "system"
    simulation: dict
    impact: Optional[dict] = None
    twin: Optional[Twin] = None


class ForecastReportIn(BaseModel):
    supply_chain_id: str
    user_id: str = "system"
    horizon_days: int = 30
    node_label: Optional[str] = None
    twin: Optional[Twin] = None


class LiveIntelIn(BaseModel):
    supply_chain_id: str = "canvas"
    user_id: str = "system"
    nodes: list[dict]


@app.post("/reports/simulation", dependencies=[Depends(auth)])
def report_simulation(inp: SimulationIn):
    return reports.run_simulation_report(_hooks("simulation", inp), _twin(inp), inp.simulation).model_dump()


@app.post("/reports/strategy", dependencies=[Depends(auth)])
def report_strategy(inp: SimulationIn):
    return reports.run_strategy_report(_hooks("strategy_report", inp), _twin(inp), inp.simulation, inp.impact).model_dump()


@app.post("/reports/forecast", dependencies=[Depends(auth)])
def report_forecast(inp: ForecastReportIn):
    return reports.run_forecast_report(_hooks("forecast_report", inp), _twin(inp), inp.horizon_days, inp.node_label).model_dump()


class MemoryIn(BaseModel):
    supply_chain_id: str
    user_id: str = "system"
    title: str
    status: str
    option_label: Optional[str] = None
    added_cost: Optional[float] = None
    added_days: Optional[float] = None
    when: Optional[str] = None


@app.post("/memory", dependencies=[Depends(auth)])
def memory_ep(inp: MemoryIn):
    """Store the outcome of a decision so the next incident can recall it."""
    from datetime import date

    from tools.memory import format_decision_memory, store_memory

    text = format_decision_memory(inp.title, inp.status, inp.option_label, inp.added_cost, inp.added_days, inp.when or date.today().isoformat())
    out = store_memory(supply_chain_id=inp.supply_chain_id, text=text)
    db.insert_audit(inp.user_id, "Memory", f"Stored: {text}", {"supply_chain_id": inp.supply_chain_id})
    return {"stored": out.get("status") == "success" and (out["content"][0].get("json") or {}).get("stored", False), "text": text}


class SuggestionsIn(BaseModel):
    supply_chain_id: str = "canvas"
    user_id: str = "system"
    prompt: str


@app.post("/suggestions", dependencies=[Depends(auth)])
def suggestions_ep(inp: SuggestionsIn):
    from agents import suggestions

    return suggestions.run_suggestions(suggestions.build(_hooks("suggestions", inp)), inp.prompt).model_dump()


@app.post("/reports/live-intel", dependencies=[Depends(auth)])
def report_live_intel(inp: LiveIntelIn):
    return reports.run_live_intel(_hooks("live_intel", inp), inp.nodes).model_dump()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=settings.port)
