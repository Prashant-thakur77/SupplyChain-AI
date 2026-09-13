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
from tools._ctx import set_current_chain
from tools.twin import twin_cache
from tracing import TraceHooks, new_session_id

app = FastAPI(title="SupplyChain AI agent-service", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ---- A2A: other agents ask us about lanes ---------------------------------------------------------------------------------
# Agent card at /a2a/.well-known/agent-card.json (also agent.json). Auth: x-api-key issued per org (api_keys table) or the service secret.
try:
    from a2a.types import AgentSkill
    from starlette.middleware.base import BaseHTTPMiddleware
    from strands.multiagent.a2a import A2AServer

    from agents import a2a_agent

    _a2a = A2AServer(
        a2a_agent.build(), http_url=(settings.agent_public_url or f"http://localhost:{settings.port}").rstrip("/") + "/a2a", serve_at_root=True, version="1.0.0",
        skills=[
            AgentSkill(id="assess_lane", name="Assess lane", description="Is origin→destination safe? Best path, cost, days, risk, alternative.", tags=["supply-chain", "routing", "risk"],
                       examples=["Is Shenzhen Plant → Port of Rotterdam safe on supply chain abc?"]),
            AgentSkill(id="what_if", name="What if a site fails", description="Blast radius, reroutes with exact added cost/days, revenue at risk.", tags=["simulation"],
                       examples=["What happens on supply chain abc if Port of Singapore closes for 10 days?"]),
            AgentSkill(id="resilience", name="Network resilience", description="Score, grade, single points of failure.", tags=["audit"]),
        ],
    )

    class _A2AAuth(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            if "/.well-known/" in request.url.path:
                return await call_next(request)
            key = request.headers.get("x-api-key") or request.headers.get("x-agent-secret") or ""
            if settings.agent_service_secret and key == settings.agent_service_secret:
                return await call_next(request)
            if key and db.api_key_valid(key):
                return await call_next(request)
            from starlette.responses import JSONResponse

            return JSONResponse({"error": "x-api-key required (issue one on the Team page)"}, status_code=401)

    _a2a_app = _a2a.to_fastapi_app()
    _a2a_app.add_middleware(_A2AAuth)
    app.mount("/a2a", _a2a_app)
except Exception as _e:  # a2a extra not installed — the REST API still works
    import logging

    logging.getLogger("a2a").warning("A2A endpoint disabled: %s", _e)


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
    history: list[dict] = []  # prior turns [{role: user|assistant, text}]
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
    set_current_chain(inp.supply_chain_id)
    if getattr(inp, "twin", None):
        twin_cache.put(inp.twin)
    return twin_cache.get(inp.supply_chain_id)


def _hooks(stage: str, inp) -> list:
    set_current_chain(getattr(inp, 'supply_chain_id', None))
    return [TraceHooks(new_session_id(stage), getattr(inp, "user_id", None), inp.supply_chain_id, stage)]


def _manual_assessment(inp: SimpleIn, title: str) -> Assessment:
    return inp.assessment or Assessment(
        event_id="manual", title=title, summary=inp.context or title, severity=Severity.HIGH, confidence=0.7,
        failed_node_ids=inp.failed_node_ids, affected_node_ids=[], affected_edge_ids=[], sources=[], needs_review=True,
    )


# ---- routes ----------------------------------------------------------------------------------------------------------
@app.get("/ping")
def ping():
    model = {"bedrock": settings.bedrock_model_id, "openai": settings.openai_model_id, "ollama": settings.ollama_model_id}.get(settings.agent_model_provider, settings.gemini_model_id)
    return {"status": "healthy", "provider": settings.agent_model_provider, "model": model, "region": settings.region}


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
            agent = copilot.build(hooks, inp.supply_chain_id, model=make_model("copilot", api_key=key, model_id=mid), history=inp.history)
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
    if action == "warroom":
        return warroom_ep(WarRoomIn(**payload))
    if action == "demand_shock":
        return demand_shock(DemandShockIn(**payload))
    if action == "contracts_parse":
        return contracts_parse(ContractParseIn(**payload))
    if action == "risk_recompute":
        return risk_recompute(RiskIn(**payload))
    if action == "resilience":
        return resilience_ep(ResilienceIn(**payload))
    if action == "twin_draft":
        return twin_draft(TwinDraftIn(**payload))
    if action == "sentinel":
        return sentinel_ep(SentinelIn(**payload))
    if action == "memory":
        return memory_ep(MemoryIn(**payload))
    if action == "report_live_intel":
        return report_live_intel(LiveIntelIn(**payload))
    inp = ChatIn(**{k: v for k, v in payload.items() if k in ChatIn.model_fields} | ({"message": payload["prompt"]} if "prompt" in payload else {}))
    _twin(inp)
    agent = copilot.build(_hooks("chat", inp), inp.supply_chain_id, history=inp.history)
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


class ContractParseIn(BaseModel):
    text: str
    user_id: str = "system"
    supply_chain_id: str = ""


@app.post("/contracts/parse", dependencies=[Depends(auth)])
def contracts_parse(inp: ContractParseIn):
    """Contracts agent: pasted contract / SLA text → structured clauses (lead time, grace, penalty/day, cap, service level)."""
    from agents.base import call_structured, make_agent
    from contracts import ContractTerms
    from pydantic import BaseModel as _BM

    class Terms(_BM):
        contracts: list[ContractTerms]

    agent = make_agent("contracts", "You extract commercial terms from supply-chain contracts and SLAs. Return one entry per counterparty/clause: "
                       "promised lead time in days, grace period before penalties, penalty per day in USD (convert percentages of order value into USD only if a value is stated; otherwise 0 and explain in notes), "
                       "cap, OTIF/service level, expiry, and the site or city the clause names. Never invent numbers not in the text.",
                       hooks=_hooks("contracts", inp), name="contracts_parser")
    out = call_structured(agent, f"Contract text:\n\n{inp.text[:12000]}\n\nExtract the terms.", Terms)
    return {"contracts": [c.model_dump() for c in out.contracts]}


@app.get("/playbooks/catalog", dependencies=[Depends(auth)])
def playbooks_catalog():
    """Built-in playbook catalogue (installed per org from the Playbooks page)."""
    import playbooks as pb

    return {"playbooks": pb.BUILTIN}


@app.post("/memory", dependencies=[Depends(auth)])
def memory_ep(inp: MemoryIn):
    """Store the outcome of a decision so the next incident can recall it."""
    from datetime import date

    from tools.memory import format_decision_memory, store_memory

    text = format_decision_memory(inp.title, inp.status, inp.option_label, inp.added_cost, inp.added_days, inp.when or date.today().isoformat())
    out = store_memory(supply_chain_id=inp.supply_chain_id, text=text)
    db.insert_audit(inp.user_id, "Memory", f"Stored: {text}", {"supply_chain_id": inp.supply_chain_id})
    return {"stored": out.get("status") == "success" and (out["content"][0].get("json") or {}).get("stored", False), "text": text}


class WarRoomIn(BaseModel):
    supply_chain_id: str
    user_id: str = "system"
    twin: Optional[Twin] = None
    scenarios: list[dict] = []
    use_presets: bool = False


class DemandShockIn(BaseModel):
    supply_chain_id: str
    user_id: str = "system"
    twin: Optional[Twin] = None
    multiplier: float = 1.5
    duration_weeks: int = 4
    destination_ids: list[str] = []


@app.post("/demand-shock", dependencies=[Depends(auth)])
def demand_shock(inp: DemandShockIn):
    """Deterministic demand-shock simulation coupled to flows: capacity saturation, cost to serve, stock-out timing."""
    import demand

    rep = demand.simulate(_twin(inp), inp.multiplier, inp.duration_weeks, inp.destination_ids or None)
    db.insert_audit(inp.user_id, "DemandShock", f"Demand shock ×{inp.multiplier} for {inp.duration_weeks}w: {rep.summary[1] if len(rep.summary) > 1 else ''}", {"supply_chain_id": inp.supply_chain_id})
    return demand.to_dict(rep)


@app.post("/warroom", dependencies=[Depends(auth)])
def warroom_ep(inp: WarRoomIn):
    """Compare what-if scenarios side by side (deterministic)."""
    from warroom import ScenarioIn, compare, presets, to_dicts

    twin = _twin(inp)
    scs = [ScenarioIn(str(s.get("name") or "Scenario"), list(s.get("failed_node_ids") or []), list(s.get("failed_edge_ids") or []), float(s.get("duration_days") or 14)) for s in inp.scenarios]
    if inp.use_presets or not scs:
        scs = presets(twin) + scs
    rows = compare(twin, scs)
    return {"scenarios": to_dicts(rows), "has_flows": bool(twin.flows)}


class RiskIn(BaseModel):
    supply_chain_id: str
    user_id: str = "system"
    twin: Optional[Twin] = None
    persist: bool = True


@app.post("/risk/recompute", dependencies=[Depends(auth)])
def risk_recompute(inp: RiskIn):
    """Recompute explainable site risk scores (structure + geography + recent news/weather). Persists to nodes.risk_level / data.riskBreakdown."""
    from datetime import datetime, timedelta, timezone

    from risk import score_twin

    twin = _twin(inp)
    news: dict[str, int] = {}
    adverse: set[str] = set()
    if inp.persist:
        try:
            since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            rows = db.client().table("notifications").select("citations").gte("created_at", since).execute().data or []
            for r in rows:
                c = r.get("citations") or {}
                if c.get("supplyChainId") == inp.supply_chain_id:
                    for nid in (c.get("failedNodes") or []) + (c.get("affectedNodes") or []):
                        news[nid] = news.get(nid, 0) + 1
            w = db.client().table("weather_intelligence").select("node_id,is_adverse").eq("supply_chain_id", inp.supply_chain_id).eq("is_adverse", True).execute().data or []
            adverse = {x["node_id"] for x in w}
        except Exception as e:  # noqa: BLE001
            print(f"[risk] signals unavailable: {e}")
    scores = score_twin(twin, news, adverse)
    if inp.persist:
        for r in scores:
            try:
                node = db.client().table("nodes").select("data").eq("node_id", r.node_id).limit(1).execute().data
                data = (node[0].get("data") if node else None) or {}
                data.update({"riskLevel": r.level, "riskScore": round(r.score / 5.0, 2), "riskBreakdown": {"components": r.components, "reasons": r.reasons, "computed_at": datetime.now(timezone.utc).isoformat()}})
                db.client().table("nodes").update({"risk_level": r.score, "data": data}).eq("node_id", r.node_id).execute()
            except Exception as e:  # noqa: BLE001
                print(f"[risk] persist failed for {r.node_id}: {e}")
        twin_cache.clear(inp.supply_chain_id)
        db.insert_audit(inp.user_id, "RiskScorer", f"Recomputed risk for {len(scores)} sites", {"supply_chain_id": inp.supply_chain_id, "top": [(r.label, r.score) for r in scores[:3]]})
    return {"scores": [r.__dict__ for r in scores]}


class ResilienceIn(BaseModel):
    supply_chain_id: str
    user_id: str = "system"
    twin: Optional[Twin] = None
    narrative: bool = False


@app.post("/resilience", dependencies=[Depends(auth)])
def resilience_ep(inp: ResilienceIn):
    """Deterministic resilience audit (fail every node and lane). `narrative=true` adds a short Strategist write-up."""
    from resilience import audit, report_to_dict

    twin = _twin(inp)
    rep = report_to_dict(audit(twin))
    if inp.narrative:
        try:
            from agents.base import make_agent

            agent = make_agent("strategist", "You are the Strategist. Given a resilience audit (score, single points of failure, fragility table), write 4-6 crisp "
                               "recommendations an operations manager can act on this quarter: dual-sourcing, buffer stock, alternate ports, contracts. Markdown bullets, specific to the sites named.",
                               hooks=_hooks("resilience", inp), name="resilience_narrative")
            rep["narrative"] = str(agent(f"Audit: {json.dumps({k: rep[k] for k in ('score','grade','single_points_of_failure','summary')})}\nTop cases: {json.dumps(rep['cases'][:8])}"))
        except Exception as ex:  # noqa: BLE001
            rep["narrative_error"] = str(ex)
    import benchmark

    real_nodes = [n for n in twin.nodes]
    if inp.supply_chain_id and not inp.supply_chain_id.startswith("demo") and inp.supply_chain_id not in ("canvas", "default-chain"):
        benchmark.record(inp.supply_chain_id, len(real_nodes), len(twin.edges), rep["score"], len(rep["single_points_of_failure"]), len(rep.get("single_source_sites", [])))
    rep["benchmark"] = benchmark.percentile(inp.supply_chain_id, len(real_nodes), rep["score"])
    db.insert_audit(inp.user_id, "ResilienceAudit", f"Resilience audit: score {rep['score']} ({rep['grade']}) — better than {rep['benchmark']['percentile']}% of similar networks", {"supply_chain_id": inp.supply_chain_id})
    return rep


class TwinDraftIn(BaseModel):
    description: str
    user_id: str = "system"


@app.post("/twin/draft", dependencies=[Depends(auth)])
def twin_draft(inp: TwinDraftIn):
    """Text-to-twin: draft nodes and lanes from a description. The web app geocodes and estimates lanes afterwards."""
    from agents import twin_builder

    if len(inp.description.strip()) < 20:
        raise HTTPException(400, "describe the supply chain in at least a sentence")
    hooks = [TraceHooks(new_session_id("twin_draft"), inp.user_id, None, "twin_draft")]
    draft = twin_builder.run_twin_builder(twin_builder.build(hooks), inp.description[:6000])
    ids = {n.id for n in draft.nodes}
    draft.edges = [e for e in draft.edges if e.source in ids and e.target in ids and e.source != e.target]
    connected = {e.source for e in draft.edges} | {e.target for e in draft.edges}
    for n in draft.nodes:
        if n.id not in connected:
            draft.assumptions.append(f"'{n.label}' has no lanes yet — connect it on the canvas or describe how goods reach it.")
    return draft.model_dump()


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
