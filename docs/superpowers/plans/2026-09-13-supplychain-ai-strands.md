# SupplyChain AI — Strands Agent Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Google-ADK agent layer with a Strands Agents multi-agent service, add a deterministic routing + decision engine, a Decision Inbox / incident UI, a public demo, and all hackathon submission artifacts.

**Architecture:** A Python `agent-service/` (FastAPI + Strands) owns every LLM call and exposes JSON/SSE endpoints plus the AgentCore `/invocations` + `/ping` contract. Next.js keeps its `app/api/agent/*` paths as thin proxies so the existing UI keeps working, and gains a Decision Inbox, an incident view on the twin, and a no-login `/demo`. Deterministic math (blast radius, Dijkstra, k-best reroutes) lives in `routing.py`; agents only rank and explain.

**Tech Stack:** Python 3.10, `strands-agents[gemini]`, `strands-agents-tools`, FastAPI, Pydantic v2, httpx, supabase-py, pytest; Next.js 16, React 19, Tailwind, shadcn/ui, React Flow, vitest; Supabase Postgres; Cloud Run.

**Spec:** `docs/superpowers/specs/2026-09-13-supplychain-ai-strands-design.md`

## Global Constraints

- Product name is **SupplyChain AI** everywhere; the string "PRISM" must not appear in the repo.
- Every LLM call goes through Strands `Agent` — no direct Gemini/`google-generativeai` calls anywhere.
- Model provider is selected by `AGENT_MODEL_PROVIDER=gemini|bedrock` (default `gemini`); nothing else changes between providers.
- The LLM never computes routes, costs, or blast radius — `routing.py` does; agents receive computed candidates.
- Every agent returns a Pydantic `structured_output_model`.
- Every agent run writes a row to `agent_traces` and an `audit_logs` entry (hooks in `tracing.py`).
- `agent-service` must respond on `GET /ping` and `POST /invocations` (AgentCore contract) and listen on port 8080.
- Existing `app/api/agent/*` route paths and response shapes stay backward compatible for current UI call sites.
- New tables are RLS-scoped to `user_id`.
- Run Python commands from `agent-service/` with `uv run`; run JS with `pnpm`.
- Commit after every task with a conventional-commit message; no attribution trailers.

---

## File Structure

**agent-service/** (new)
- `pyproject.toml` — deps + pytest config
- `config.py` — `Settings` from env
- `models.py` — `make_model(role)` provider factory
- `schemas.py` — Pydantic models shared by agents, API, and Next.js types
- `routing.py` — pure graph math
- `db.py` — Supabase client + typed helpers
- `tracing.py` — Strands hooks → `agent_traces`/`audit_logs`
- `tools/twin.py`, `tools/intel.py`, `tools/memory.py`, `tools/persistence.py`
- `agents/{sentinel,analyst,router,impact,strategist,forecaster,scenario,copilot}.py`
- `graphs/incident.py`, `graphs/analysis.py`
- `app.py` — FastAPI app + SSE
- `agentcore_entry.py` — `BedrockAgentCoreApp` wrapper
- `Dockerfile`, `.env.example`, `tests/`

**Next.js**
- `lib/agent-client.ts` — typed client for agent-service (JSON + SSE)
- `types/agent.ts` — TS mirror of `schemas.py`
- `app/api/agent/*/route.ts` — proxies
- `app/api/cron/scan/route.ts`, `app/api/decisions/route.ts`, `app/api/decisions/[id]/route.ts`
- `supabase/migrations/20260913_decisions.sql`
- `lib/decisions.ts`, `lib/grounding.ts`, `lib/alert-actions.ts`, `lib/import/twin-import.ts`
- `components/decisions/*`, `components/agent-activity/*`, `components/digital-twin/incident/*`
- `app/(main)/decisions/page.tsx`, `app/demo/page.tsx`
- `LICENSE`, `README.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/submission/*`, `.env.example`

---

## Phase A — agent-service foundation

### Task A1: Scaffold agent-service with config and model factory

**Files:**
- Create: `agent-service/pyproject.toml`, `agent-service/config.py`, `agent-service/models.py`, `agent-service/.env.example`, `agent-service/tests/test_models.py`, `agent-service/__init__.py` (empty)

**Interfaces:**
- Produces: `config.settings: Settings` (fields below); `models.make_model(role: str) -> Model` (Strands model instance); `models.ROLE_TEMPERATURE: dict[str, float]`

- [ ] **Step 1: Write pyproject**

```toml
[project]
name = "supplychain-agent-service"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
  "strands-agents[gemini]>=1.0",
  "strands-agents-tools>=0.2",
  "fastapi>=0.115",
  "uvicorn[standard]>=0.30",
  "pydantic>=2.7",
  "pydantic-settings>=2.3",
  "httpx>=0.27",
  "supabase>=2.5",
  "sse-starlette>=2.1",
  "python-dotenv>=1.0",
]

[project.optional-dependencies]
bedrock = ["boto3>=1.34", "bedrock-agentcore>=0.1"]
memory = ["mem0ai>=0.1"]
dev = ["pytest>=8", "pytest-asyncio>=0.23", "respx>=0.21"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
pythonpath = ["."]
```

- [ ] **Step 2: Write config.py**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    agent_model_provider: str = "gemini"          # gemini | bedrock
    gemini_model_id: str = "gemini-2.5-flash"
    google_api_key: str = ""
    google_api_key_agents: str = ""
    google_api_key_orchestrator: str = ""
    bedrock_model_id: str = "us.anthropic.claude-sonnet-4-6"
    aws_region: str = "us-east-1"

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    tavily_api_key: str = ""
    openweather_api_key: str = ""
    mem0_api_key: str = ""

    agent_service_secret: str = ""               # shared secret with Next.js
    port: int = 8080

    def gemini_key(self, role: str) -> str:
        if role == "orchestrator" and self.google_api_key_orchestrator:
            return self.google_api_key_orchestrator
        return self.google_api_key_agents or self.google_api_key


settings = Settings()
```

- [ ] **Step 3: Write failing test for make_model**

```python
# tests/test_models.py
from models import make_model, ROLE_TEMPERATURE


def test_role_temperatures_cover_all_agents():
    for role in ["sentinel", "analyst", "router", "impact", "strategist", "forecaster", "scenario", "copilot", "orchestrator"]:
        assert role in ROLE_TEMPERATURE


def test_make_model_gemini(monkeypatch):
    monkeypatch.setenv("AGENT_MODEL_PROVIDER", "gemini")
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    from importlib import reload
    import config, models
    reload(config); reload(models)
    m = models.make_model("router")
    assert type(m).__name__ == "GeminiModel"
```

- [ ] **Step 4: Run to verify it fails**

Run: `cd agent-service && uv sync --extra dev && uv run pytest tests/test_models.py -v`
Expected: FAIL with `ModuleNotFoundError: models`

- [ ] **Step 5: Write models.py**

```python
"""Model provider factory. AGENT_MODEL_PROVIDER decides Gemini vs Bedrock; nothing else changes."""
from config import settings

ROLE_TEMPERATURE: dict[str, float] = {
    "sentinel": 0.2,
    "analyst": 0.2,
    "router": 0.1,
    "impact": 0.2,
    "strategist": 0.4,
    "forecaster": 0.3,
    "scenario": 0.6,
    "copilot": 0.5,
    "orchestrator": 0.3,
}


def make_model(role: str):
    temperature = ROLE_TEMPERATURE.get(role, 0.3)
    if settings.agent_model_provider == "bedrock":
        from strands.models import BedrockModel
        return BedrockModel(model_id=settings.bedrock_model_id, region_name=settings.aws_region, temperature=temperature)
    from strands.models.gemini import GeminiModel
    return GeminiModel(
        client_args={"api_key": settings.gemini_key(role)},
        model_id=settings.gemini_model_id,
        params={"temperature": temperature, "max_output_tokens": 4096},
    )
```

- [ ] **Step 6: Write .env.example**

```
AGENT_MODEL_PROVIDER=gemini
GEMINI_MODEL_ID=gemini-2.5-flash
GOOGLE_API_KEY=
# BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-6
# AWS_REGION=us-east-1
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TAVILY_API_KEY=
OPENWEATHER_API_KEY=
MEM0_API_KEY=
AGENT_SERVICE_SECRET=change-me
PORT=8080
```

- [ ] **Step 7: Run tests — PASS**, then commit

```bash
git add agent-service && git commit -m "feat(agent-service): scaffold with config and Strands model factory"
```

### Task A2: Shared Pydantic schemas

**Files:**
- Create: `agent-service/schemas.py`, `agent-service/tests/test_schemas.py`

**Interfaces:**
- Produces (all Pydantic `BaseModel`): `TwinNode`, `TwinEdge`, `Twin`, `Event`, `Source`, `Assessment`, `RouteCandidate`, `RouteRanking`, `ImpactEstimate`, `MitigationStep`, `MitigationPlan`, `DecisionOption`, `Decision`, `Forecast`, `Scenario`, `ScenarioSet`, `GraphEvent`

- [ ] **Step 1: Write failing test**

```python
# tests/test_schemas.py
from schemas import Assessment, Decision, DecisionOption, Severity


def test_assessment_confidence_bounds():
    a = Assessment(event_id="e1", title="t", summary="s", severity=Severity.HIGH, confidence=0.8,
                   affected_node_ids=["n1"], affected_edge_ids=[], sources=[], needs_review=False)
    assert a.severity == "HIGH"


def test_decision_recommended_must_exist():
    import pytest
    with pytest.raises(ValueError):
        Decision(supply_chain_id="s", title="t", summary="s", options=[DecisionOption(id="a", label="A", kind="reroute")],
                 recommended_option_id="zzz", rationale="r")
```

- [ ] **Step 2: Run — FAIL** (`ModuleNotFoundError: schemas`)

- [ ] **Step 3: Write schemas.py**

```python
from __future__ import annotations
from enum import Enum
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field, model_validator


class Severity(str, Enum):
    LOW = "LOW"; MEDIUM = "MEDIUM"; HIGH = "HIGH"; CRITICAL = "CRITICAL"


class TwinNode(BaseModel):
    id: str
    label: str
    type: str = "warehouse"
    lat: Optional[float] = None
    lng: Optional[float] = None
    country: Optional[str] = None
    capacity: float = 0
    risk_level: float = 0
    data: dict[str, Any] = Field(default_factory=dict)


class TwinEdge(BaseModel):
    id: str
    source: str
    target: str
    mode: str = "road"
    cost: float = 0
    transit_days: float = 0
    risk_multiplier: float = 1.0
    capacity: Optional[float] = None


class Twin(BaseModel):
    supply_chain_id: str
    name: str = ""
    nodes: list[TwinNode]
    edges: list[TwinEdge]


class Source(BaseModel):
    title: str
    url: str
    published_at: Optional[str] = None
    credibility: float = 0.5


class Event(BaseModel):
    """A candidate disruption found by Sentinel or injected manually."""
    id: str
    kind: Literal["news", "weather", "manual", "simulation"]
    title: str
    description: str
    location: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    occurred_at: Optional[str] = None
    sources: list[Source] = Field(default_factory=list)
    failed_node_ids: list[str] = Field(default_factory=list)
    failed_edge_ids: list[str] = Field(default_factory=list)


class Assessment(BaseModel):
    event_id: str
    title: str
    summary: str
    severity: Severity
    confidence: float = Field(ge=0, le=1)
    affected_node_ids: list[str]
    affected_edge_ids: list[str]
    sources: list[Source]
    needs_review: bool
    category: Literal["GEOPOLITICAL", "WEATHER", "LOGISTICS", "SUPPLIER", "MARKET", "OTHER"] = "OTHER"


class RouteCandidate(BaseModel):
    id: str
    origin: str
    destination: str
    path: list[str]
    labels: list[str]
    modes: list[str]
    cost: float
    transit_days: float
    max_risk: float
    baseline_cost: float
    baseline_days: float
    added_cost: float
    added_days: float
    feasible: bool = True


class RouteRanking(BaseModel):
    ranked_candidate_ids: list[str]
    recommended_candidate_id: Optional[str]
    rationale: str
    tradeoffs: list[str]
    wait_is_viable: bool
    wait_rationale: str


class ImpactEstimate(BaseModel):
    revenue_at_risk_usd: float
    delay_days: float
    nodes_affected: int
    orders_affected_pct: float = Field(ge=0, le=100)
    summary: str
    assumptions: list[str]


class MitigationStep(BaseModel):
    title: str
    owner: str
    due_in_days: int
    detail: str


class MitigationPlan(BaseModel):
    title: str
    summary: str
    steps: list[MitigationStep]
    estimated_cost_usd: float
    risk_after: Severity


class DecisionOption(BaseModel):
    id: str
    label: str
    kind: Literal["reroute", "wait", "mitigate", "escalate"]
    added_cost: float = 0
    added_days: float = 0
    risk: Severity = Severity.LOW
    route_candidate_id: Optional[str] = None
    detail: str = ""


class Decision(BaseModel):
    supply_chain_id: str
    event_id: Optional[str] = None
    title: str
    summary: str
    options: list[DecisionOption]
    recommended_option_id: str
    rationale: str
    confidence: float = 0.7
    sources: list[Source] = Field(default_factory=list)
    trace_id: Optional[str] = None

    @model_validator(mode="after")
    def _rec_exists(self):
        if self.recommended_option_id not in {o.id for o in self.options}:
            raise ValueError("recommended_option_id must reference an option")
        return self


class Forecast(BaseModel):
    horizon: Literal["7d", "30d", "90d"]
    risk_score: float = Field(ge=0, le=100)
    trend: Literal["improving", "stable", "worsening"]
    drivers: list[str]
    summary: str


class Scenario(BaseModel):
    id: str
    title: str
    description: str
    disruption_type: Literal["weather", "geopolitical", "economic", "operational"]
    failed_node_ids: list[str]
    probability: float = Field(ge=0, le=1)
    duration_days: int


class ScenarioSet(BaseModel):
    scenarios: list[Scenario]


class GraphEvent(BaseModel):
    """Streamed to the UI while a graph executes."""
    type: Literal["node_start", "node_end", "tool", "result", "error"]
    node: Optional[str] = None
    elapsed_ms: Optional[int] = None
    payload: Optional[dict[str, Any]] = None
```

- [ ] **Step 4: Run — PASS**, commit `feat(agent-service): shared schemas`

### Task A3: Deterministic routing engine

**Files:**
- Create: `agent-service/routing.py`, `agent-service/tests/test_routing.py`

**Interfaces:**
- Produces: `build_graph(twin: Twin) -> Graph`; `blast_radius(twin, failed_node_ids, failed_edge_ids) -> BlastRadius(downstream_node_ids, broken_edge_ids, severed_pairs)`; `shortest_path(graph, src, dst, avoid_nodes, avoid_edges, weight="cost") -> Path | None`; `k_best_routes(twin, origin, destination, failed_node_ids, failed_edge_ids, k=3) -> list[RouteCandidate]`; `reroute_plan(twin, failed_node_ids, failed_edge_ids, k=3) -> ReroutePlan(candidates, severed_pairs, feasible_count, infeasible_count, severity)`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_routing.py
from schemas import Twin, TwinNode, TwinEdge
from routing import blast_radius, k_best_routes, reroute_plan, shortest_path, build_graph


def twin():
    n = lambda i, t="port": TwinNode(id=i, label=i.upper(), type=t)
    e = lambda i, s, t, c, d, m="sea": TwinEdge(id=i, source=s, target=t, cost=c, transit_days=d, mode=m)
    return Twin(supply_chain_id="t", nodes=[n("shenzhen","factory"), n("singapore"), n("colombo"), n("rotterdam"), n("berlin","warehouse")],
                edges=[e("e1","shenzhen","singapore",1000,5), e("e2","singapore","rotterdam",4000,20),
                       e("e3","shenzhen","colombo",1500,7), e("e4","colombo","rotterdam",4500,22),
                       e("e5","rotterdam","berlin",300,1,"road")])


def test_shortest_path_baseline():
    p = shortest_path(build_graph(twin()), "shenzhen", "berlin")
    assert p.path == ["shenzhen","singapore","rotterdam","berlin"] and p.cost == 5300


def test_blast_radius_singapore():
    br = blast_radius(twin(), ["singapore"], [])
    assert set(br.downstream_node_ids) == {"rotterdam","berlin"}
    assert set(br.broken_edge_ids) == {"e1","e2"}
    assert ("shenzhen","rotterdam") in br.severed_pairs


def test_k_best_avoids_failed():
    c = k_best_routes(twin(), "shenzhen", "berlin", ["singapore"], [], k=3)
    assert c[0].path == ["shenzhen","colombo","rotterdam","berlin"]
    assert c[0].added_cost == 1000 and c[0].added_days == 4 and c[0].feasible


def test_reroute_plan_infeasible():
    t = twin(); t.edges = [e for e in t.edges if e.id not in ("e3","e4")]
    plan = reroute_plan(t, ["singapore"], [])
    assert plan.infeasible_count >= 1 and plan.severity == "CRITICAL"
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Write routing.py**

```python
"""Pure graph math for the twin. No LLM here. Dijkstra + Yen k-shortest + downstream reachability."""
from __future__ import annotations
import heapq
from dataclasses import dataclass, field
from typing import Optional
from schemas import RouteCandidate, Twin, TwinEdge


@dataclass
class Graph:
    labels: dict[str, str]
    adj: dict[str, list[TwinEdge]]
    edges: dict[str, TwinEdge]


@dataclass
class Path:
    path: list[str]
    edge_ids: list[str]
    cost: float
    days: float
    max_risk: float


@dataclass
class BlastRadius:
    downstream_node_ids: list[str]
    broken_edge_ids: list[str]
    severed_pairs: list[tuple[str, str]]


@dataclass
class ReroutePlan:
    candidates: list[RouteCandidate]
    severed_pairs: list[tuple[str, str]]
    feasible_count: int
    infeasible_count: int
    severity: str
    baseline: dict[str, float] = field(default_factory=dict)


def build_graph(twin: Twin) -> Graph:
    labels = {n.id: n.label for n in twin.nodes}
    adj: dict[str, list[TwinEdge]] = {n.id: [] for n in twin.nodes}
    for e in twin.edges:
        adj.setdefault(e.source, []).append(e)
        adj.setdefault(e.target, [])
        labels.setdefault(e.source, e.source); labels.setdefault(e.target, e.target)
    return Graph(labels=labels, adj=adj, edges={e.id: e for e in twin.edges})


def _w(e: TwinEdge, weight: str) -> float:
    return e.cost if weight == "cost" else e.transit_days


def shortest_path(g: Graph, src: str, dst: str, avoid_nodes: set[str] | None = None,
                  avoid_edges: set[str] | None = None, weight: str = "cost") -> Optional[Path]:
    avoid_nodes = avoid_nodes or set(); avoid_edges = avoid_edges or set()
    if src in avoid_nodes or dst in avoid_nodes:
        return None
    dist = {src: 0.0}; prev: dict[str, tuple[str, TwinEdge]] = {}
    pq = [(0.0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if u == dst: break
        if d > dist.get(u, float("inf")): continue
        for e in g.adj.get(u, []):
            if e.target in avoid_nodes or e.id in avoid_edges: continue
            nd = d + _w(e, weight)
            if nd < dist.get(e.target, float("inf")):
                dist[e.target] = nd; prev[e.target] = (u, e); heapq.heappush(pq, (nd, e.target))
    if dst not in dist: return None
    path, edge_ids, cur = [dst], [], dst
    while cur != src:
        p, e = prev[cur]; path.append(p); edge_ids.append(e.id); cur = p
    path.reverse(); edge_ids.reverse()
    es = [g.edges[i] for i in edge_ids]
    return Path(path=path, edge_ids=edge_ids, cost=sum(e.cost for e in es), days=sum(e.transit_days for e in es),
                max_risk=max((e.risk_multiplier for e in es), default=1.0))


def blast_radius(twin: Twin, failed_node_ids: list[str], failed_edge_ids: list[str]) -> BlastRadius:
    g = build_graph(twin)
    failed = set(failed_node_ids); broken = {e.id for e in twin.edges if e.source in failed or e.target in failed} | set(failed_edge_ids)
    # downstream = nodes reachable from failed nodes / broken edge targets following edge direction
    seeds = set(failed) | {g.edges[i].target for i in broken if i in g.edges}
    seen, stack = set(), list(seeds)
    while stack:
        u = stack.pop()
        for e in g.adj.get(u, []):
            if e.target not in seen and e.target not in failed:
                seen.add(e.target); stack.append(e.target)
    downstream = sorted(seen - failed)
    preds = {g.edges[i].source for i in broken if i in g.edges and g.edges[i].source not in failed}
    succs = {g.edges[i].target for i in broken if i in g.edges and g.edges[i].target not in failed}
    severed = sorted({(p, s) for p in preds for s in succs if p != s})
    return BlastRadius(downstream_node_ids=downstream, broken_edge_ids=sorted(broken), severed_pairs=severed)


def _to_candidate(g: Graph, p: Path, idx: int, origin: str, destination: str, base: Optional[Path]) -> RouteCandidate:
    bc = base.cost if base else p.cost; bd = base.days if base else p.days
    return RouteCandidate(id=f"r{idx}", origin=origin, destination=destination, path=p.path,
                          labels=[g.labels.get(n, n) for n in p.path], modes=[g.edges[i].mode for i in p.edge_ids],
                          cost=p.cost, transit_days=p.days, max_risk=p.max_risk, baseline_cost=bc, baseline_days=bd,
                          added_cost=p.cost - bc, added_days=p.days - bd, feasible=True)


def k_best_routes(twin: Twin, origin: str, destination: str, failed_node_ids: list[str],
                  failed_edge_ids: list[str], k: int = 3) -> list[RouteCandidate]:
    """Yen's k-shortest loopless paths on cost, avoiding failed nodes/edges. Baseline = healthy shortest."""
    g = build_graph(twin)
    base = shortest_path(g, origin, destination)
    avoid_n, avoid_e = set(failed_node_ids), set(failed_edge_ids)
    first = shortest_path(g, origin, destination, avoid_n, avoid_e)
    if not first: return []
    A: list[Path] = [first]; B: list[tuple[float, Path]] = []
    for _ in range(1, k):
        prev_path = A[-1]
        for i in range(len(prev_path.path) - 1):
            spur, root_nodes, root_edges = prev_path.path[i], prev_path.path[: i + 1], prev_path.edge_ids[:i]
            removed = set(avoid_e)
            for p in A:
                if p.path[: i + 1] == root_nodes and len(p.edge_ids) > i:
                    removed.add(p.edge_ids[i])
            sp = shortest_path(g, spur, destination, avoid_n | set(root_nodes[:-1]), removed)
            if not sp: continue
            eids = root_edges + sp.edge_ids; es = [g.edges[x] for x in eids]
            total = Path(path=root_nodes[:-1] + sp.path, edge_ids=eids, cost=sum(e.cost for e in es),
                         days=sum(e.transit_days for e in es), max_risk=max((e.risk_multiplier for e in es), default=1.0))
            if all(total.path != p.path for p in A) and all(total.path != b[1].path for b in B):
                heapq.heappush(B, (total.cost, total))
        if not B: break
        A.append(heapq.heappop(B)[1])
    return [_to_candidate(g, p, i + 1, origin, destination, base) for i, p in enumerate(A)]


def reroute_plan(twin: Twin, failed_node_ids: list[str], failed_edge_ids: list[str], k: int = 3) -> ReroutePlan:
    br = blast_radius(twin, failed_node_ids, failed_edge_ids)
    g = build_graph(twin)
    candidates: list[RouteCandidate] = []; feasible = infeasible = 0; idx = 0
    for (p, s) in br.severed_pairs:
        routes = k_best_routes(twin, p, s, failed_node_ids, failed_edge_ids, k)
        if routes:
            feasible += 1
            for r in routes:
                idx += 1; r.id = f"r{idx}"; candidates.append(r)
        else:
            infeasible += 1
            candidates.append(RouteCandidate(id=f"r{idx+1}", origin=p, destination=s, path=[], labels=[g.labels.get(p,p), g.labels.get(s,s)],
                                             modes=[], cost=0, transit_days=0, max_risk=0, baseline_cost=0, baseline_days=0,
                                             added_cost=0, added_days=0, feasible=False)); idx += 1
    candidates.sort(key=lambda c: (not c.feasible, c.added_cost, c.added_days))
    if infeasible: sev = "CRITICAL"
    elif any(c.added_cost > 0 or c.added_days > 0 for c in candidates): sev = "HIGH" if any(c.added_days >= 5 for c in candidates) else "MEDIUM"
    else: sev = "LOW"
    return ReroutePlan(candidates=candidates, severed_pairs=br.severed_pairs, feasible_count=feasible,
                       infeasible_count=infeasible, severity=sev)
```

- [ ] **Step 4: Run — PASS**, commit `feat(agent-service): deterministic routing engine (Dijkstra, Yen k-best, blast radius)`

### Task A4: Supabase helpers and tracing hooks

**Files:**
- Create: `agent-service/db.py`, `agent-service/tracing.py`, `agent-service/tests/test_db.py`

**Interfaces:**
- Produces: `db.client()`; `db.load_twin(supply_chain_id) -> Twin`; `db.insert_notification(user_id, supply_chain_id, assessment: Assessment, kind: str) -> str`; `db.insert_decision(user_id, decision: Decision, route_candidates: list[RouteCandidate]) -> str`; `db.recent_event_fingerprints(supply_chain_id, hours=48) -> set[str]`; `db.insert_trace(...)`; `db.insert_audit(...)`; `tracing.TraceHooks(session_id, user_id, supply_chain_id)` — a Strands `HookProvider`; `tracing.new_session_id(prefix) -> str`

- [ ] **Step 1: Write failing test for twin mapping (pure function)**

```python
# tests/test_db.py
from db import rows_to_twin


def test_rows_to_twin_maps_edge_data():
    nodes = [{"node_id":"n1","name":"Shenzhen","type":"factory","location_lat":22.5,"location_lng":114.0,"capacity":10,"risk_level":2,"data":{"label":"Shenzhen Plant","country":"CN"}},
             {"node_id":"n2","name":"Singapore","type":"port","data":{}}]
    edges = [{"edge_id":"e1","from_node_id":"n1","to_node_id":"n2","data":{"mode":"sea","cost":"1200","transitTime":5}}]
    t = rows_to_twin("sc1", "Demo", nodes, edges)
    assert t.nodes[0].label == "Shenzhen Plant" and t.nodes[0].country == "CN"
    assert t.edges[0].cost == 1200 and t.edges[0].transit_days == 5 and t.edges[0].mode == "sea"
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Write db.py**

```python
"""Supabase access (service role). Pure mapping functions are separated so they can be unit-tested."""
from __future__ import annotations
import hashlib, json
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any
from config import settings
from schemas import Assessment, Decision, RouteCandidate, Twin, TwinEdge, TwinNode


@lru_cache(maxsize=1)
def client():
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def _num(x: Any, default: float = 0.0) -> float:
    try: return float(x)
    except (TypeError, ValueError): return default


def rows_to_twin(supply_chain_id: str, name: str, nodes: list[dict], edges: list[dict]) -> Twin:
    tn = []
    for n in nodes:
        d = n.get("data") or {}
        tn.append(TwinNode(id=n["node_id"], label=d.get("label") or n.get("name") or n["node_id"], type=n.get("type") or d.get("type") or "warehouse",
                           lat=n.get("location_lat"), lng=n.get("location_lng"), country=d.get("country"),
                           capacity=_num(n.get("capacity")), risk_level=_num(n.get("risk_level")), data=d))
    te = []
    for e in edges:
        d = e.get("data") or {}
        te.append(TwinEdge(id=e["edge_id"], source=e.get("from_node_id") or d.get("source"), target=e.get("to_node_id") or d.get("target"),
                           mode=d.get("mode") or "road", cost=_num(d.get("cost")), transit_days=_num(d.get("transitTime") or d.get("transit_days")),
                           risk_multiplier=_num(d.get("riskMultiplier"), 1.0) or 1.0, capacity=d.get("capacity")))
    return Twin(supply_chain_id=supply_chain_id, name=name, nodes=tn, edges=[e for e in te if e.source and e.target])


def load_twin(supply_chain_id: str) -> Twin:
    sb = client()
    sc = sb.table("supply_chains").select("name").eq("supply_chain_id", supply_chain_id).single().execute().data or {}
    nodes = sb.table("nodes").select("*").eq("supply_chain_id", supply_chain_id).execute().data or []
    edges = sb.table("edges").select("*").eq("supply_chain_id", supply_chain_id).execute().data or []
    return rows_to_twin(supply_chain_id, sc.get("name", ""), nodes, edges)


def list_supply_chains() -> list[dict]:
    return client().table("supply_chains").select("supply_chain_id,user_id,name").execute().data or []


def fingerprint(title: str, node_ids: list[str]) -> str:
    return hashlib.sha1((title.strip().lower() + "|" + ",".join(sorted(node_ids))).encode()).hexdigest()[:16]


def recent_event_fingerprints(supply_chain_id: str, hours: int = 48) -> set[str]:
    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    rows = client().table("notifications").select("citations").gte("created_at", since).execute().data or []
    return {r["citations"].get("fingerprint") for r in rows if isinstance(r.get("citations"), dict) and r["citations"].get("supplyChainId") == supply_chain_id and r["citations"].get("fingerprint")}


def insert_notification(user_id: str, supply_chain_id: str, a: Assessment, kind: str = "supply_chain_alert") -> str:
    row = {
        "user_id": user_id, "title": a.title, "message": a.summary, "notification_type": kind, "severity": a.severity.value,
        "read_status": False,
        "citations": {"category": a.category, "confidence": a.confidence, "needsReview": a.needs_review, "affectedNodes": a.affected_node_ids,
                      "affectedEdges": a.affected_edge_ids, "supplyChainId": supply_chain_id, "fingerprint": fingerprint(a.title, a.affected_node_ids),
                      "sources": [s.model_dump() for s in a.sources]},
    }
    return client().table("notifications").insert(row).execute().data[0]["notification_id"]


def insert_decision(user_id: str, d: Decision, candidates: list[RouteCandidate]) -> str:
    sb = client()
    row = {"user_id": user_id, "supply_chain_id": d.supply_chain_id, "event_id": d.event_id, "title": d.title, "summary": d.summary,
           "options": [o.model_dump() for o in d.options], "recommended_option_id": d.recommended_option_id, "rationale": d.rationale,
           "confidence": d.confidence, "sources": [s.model_dump() for s in d.sources], "trace_id": d.trace_id, "status": "pending"}
    did = sb.table("decisions").insert(row).execute().data[0]["id"]
    if candidates:
        sb.table("route_plans").insert([{"decision_id": did, "candidate_id": c.id, "path": c.path, "labels": c.labels, "modes": c.modes,
                                         "cost": c.cost, "transit_days": c.transit_days, "added_cost": c.added_cost, "added_days": c.added_days,
                                         "max_risk": c.max_risk, "feasible": c.feasible} for c in candidates]).execute()
    return did


def insert_trace(session_id: str, agent_name: str, started_at: datetime, ended_at: datetime, success: bool, error: str | None,
                 user_id: str | None, supply_chain_id: str | None, stage: str | None, in_tok: int | None, out_tok: int | None) -> None:
    try:
        client().table("agent_traces").insert({"session_id": session_id, "agent_name": agent_name, "started_at": started_at.isoformat(),
            "ended_at": ended_at.isoformat(), "duration_ms": int((ended_at - started_at).total_seconds() * 1000), "success": success,
            "error": error, "workflow_stage": stage, "user_id": user_id, "supply_chain_id": supply_chain_id,
            "input_tokens": in_tok, "output_tokens": out_tok}).execute()
    except Exception as e:  # tracing must never break a run
        print(f"[trace] insert failed: {e}")


def insert_audit(user_id: str | None, actor: str, action: str, details: dict | None = None) -> None:
    try:
        client().table("audit_logs").insert({"user_id": user_id, "actor": actor, "action": action, "details": details or {}, "status": "success"}).execute()
    except Exception as e:
        print(f"[audit] insert failed: {e}")
```

- [ ] **Step 4: Write tracing.py**

```python
"""Strands hooks: one agent_traces row per agent invocation, plus audit entries."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from strands.hooks import HookProvider, HookRegistry
from strands.hooks.events import AfterInvocationEvent, BeforeInvocationEvent
import db


def new_session_id(prefix: str) -> str:
    return f"{prefix}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"


class TraceHooks(HookProvider):
    def __init__(self, session_id: str, user_id: str | None = None, supply_chain_id: str | None = None, stage: str | None = None):
        self.session_id, self.user_id, self.supply_chain_id, self.stage = session_id, user_id, supply_chain_id, stage
        self._start: dict[int, datetime] = {}

    def register_hooks(self, registry: HookRegistry, **kwargs) -> None:
        registry.add_callback(BeforeInvocationEvent, self._before)
        registry.add_callback(AfterInvocationEvent, self._after)

    def _before(self, event: BeforeInvocationEvent) -> None:
        self._start[id(event.agent)] = datetime.now(timezone.utc)

    def _after(self, event: AfterInvocationEvent) -> None:
        started = self._start.pop(id(event.agent), datetime.now(timezone.utc))
        usage = getattr(getattr(event.agent, "event_loop_metrics", None), "accumulated_usage", {}) or {}
        db.insert_trace(self.session_id, event.agent.name or "agent", started, datetime.now(timezone.utc), True, None,
                        self.user_id, self.supply_chain_id, self.stage, usage.get("inputTokens"), usage.get("outputTokens"))
```

Note for the implementer: verify hook event class names against the installed Strands version with `uv run python -c "import strands.hooks.events as e; print([x for x in dir(e) if x.endswith('Event')])"` and adjust imports if they differ (older versions expose `StartRequestEvent`/`EndRequestEvent`).

- [ ] **Step 5: Run — PASS**, commit `feat(agent-service): supabase helpers and trace hooks`

## Phase B — Tools

### Task B1: Twin tools

**Files:**
- Create: `agent-service/tools/__init__.py`, `agent-service/tools/twin.py`, `agent-service/tests/test_tools_twin.py`

**Interfaces:**
- Produces Strands tools: `load_twin(supply_chain_id: str) -> dict`; `compute_blast_radius(supply_chain_id: str, failed_node_ids: list[str], failed_edge_ids: list[str]) -> dict`; `find_reroutes(supply_chain_id: str, failed_node_ids: list[str], failed_edge_ids: list[str], k: int = 3) -> dict`; `estimate_impact_numbers(supply_chain_id, failed_node_ids, delay_days) -> dict`. Also plain helpers `twin_cache.put(twin)`/`get(id)` so demo twins work without DB.

- [ ] **Step 1: Test**

```python
# tests/test_tools_twin.py
from tools.twin import find_reroutes, twin_cache
from tests.test_routing import twin


def test_find_reroutes_tool_uses_cache():
    twin_cache.put(twin())
    out = find_reroutes(supply_chain_id="t", failed_node_ids=["singapore"], failed_edge_ids=[], k=2)
    assert out["status"] == "success"
    body = out["content"][0]["json"]
    assert body["candidates"][0]["path"] == ["shenzhen","colombo","rotterdam","berlin"]
```

- [ ] **Step 2: Run — FAIL**, **Step 3: Implement**

```python
# tools/twin.py
from __future__ import annotations
from strands import tool
from schemas import Twin
import db
from routing import blast_radius, reroute_plan


class _TwinCache:
    def __init__(self): self._m: dict[str, Twin] = {}
    def put(self, t: Twin): self._m[t.supply_chain_id] = t
    def get(self, sid: str) -> Twin:
        if sid in self._m: return self._m[sid]
        t = db.load_twin(sid); self._m[sid] = t; return t
    def clear(self, sid: str): self._m.pop(sid, None)

twin_cache = _TwinCache()


def _ok(payload: dict) -> dict: return {"status": "success", "content": [{"json": payload}]}
def _err(msg: str) -> dict: return {"status": "error", "content": [{"text": msg}]}


@tool
def load_twin(supply_chain_id: str) -> dict:
    """Load the supply chain digital twin (nodes and edges with cost, transit days, mode) for a supply chain id."""
    try:
        t = twin_cache.get(supply_chain_id)
        return _ok({"name": t.name, "nodes": [n.model_dump(exclude={"data"}) for n in t.nodes], "edges": [e.model_dump() for e in t.edges]})
    except Exception as e:
        return _err(f"load_twin failed: {e}")


@tool
def compute_blast_radius(supply_chain_id: str, failed_node_ids: list[str], failed_edge_ids: list[str] = []) -> dict:
    """Deterministically compute which downstream nodes and edges are cut off when the given nodes/edges fail."""
    try:
        t = twin_cache.get(supply_chain_id); br = blast_radius(t, failed_node_ids, failed_edge_ids)
        labels = {n.id: n.label for n in t.nodes}
        return _ok({"downstream_node_ids": br.downstream_node_ids, "downstream_labels": [labels.get(i, i) for i in br.downstream_node_ids],
                    "broken_edge_ids": br.broken_edge_ids, "severed_pairs": br.severed_pairs})
    except Exception as e:
        return _err(f"compute_blast_radius failed: {e}")


@tool
def find_reroutes(supply_chain_id: str, failed_node_ids: list[str], failed_edge_ids: list[str] = [], k: int = 3) -> dict:
    """Compute the k cheapest feasible alternate routes around failed nodes/edges using weighted Dijkstra. Returns exact cost and day deltas."""
    try:
        plan = reroute_plan(twin_cache.get(supply_chain_id), failed_node_ids, failed_edge_ids, k)
        return _ok({"severity": plan.severity, "feasible_count": plan.feasible_count, "infeasible_count": plan.infeasible_count,
                    "severed_pairs": plan.severed_pairs, "candidates": [c.model_dump() for c in plan.candidates]})
    except Exception as e:
        return _err(f"find_reroutes failed: {e}")


@tool
def estimate_impact_numbers(supply_chain_id: str, failed_node_ids: list[str], delay_days: float) -> dict:
    """Deterministic impact baseline: downstream node count, share of network cut off, and revenue-at-risk using node capacity as a proxy."""
    try:
        t = twin_cache.get(supply_chain_id); br = blast_radius(t, failed_node_ids, [])
        cap = {n.id: n.capacity for n in t.nodes}; total = sum(cap.values()) or 1.0
        hit = sum(cap.get(i, 0) for i in br.downstream_node_ids + failed_node_ids)
        share = min(100.0, 100.0 * hit / total)
        flow_cost = sum(e.cost for e in t.edges) or 1.0
        return _ok({"nodes_affected": len(br.downstream_node_ids) + len(failed_node_ids), "network_share_pct": round(share, 1),
                    "revenue_at_risk_usd": round(flow_cost * (share / 100.0) * max(delay_days, 1) * 10, 0), "delay_days": delay_days})
    except Exception as e:
        return _err(f"estimate_impact_numbers failed: {e}")
```

- [ ] **Step 4: PASS, commit** `feat(agent-service): twin tools (load, blast radius, reroutes, impact baseline)`

### Task B2: Intelligence, memory, and persistence tools

**Files:**
- Create: `agent-service/tools/intel.py`, `agent-service/tools/memory.py`, `agent-service/tools/persistence.py`, `agent-service/tests/test_tools_intel.py`

**Interfaces:**
- `search_news(query: str, max_results: int = 5) -> dict` (Tavily); `get_weather(lat: float, lng: float) -> dict` (OpenWeather current + alerts); `recall_memory(supply_chain_id, query) -> dict`; `store_memory(supply_chain_id, text) -> dict`; `persist_notification(user_id, supply_chain_id, assessment_json: dict) -> dict`; `create_decision(user_id, decision_json: dict, candidates_json: list[dict]) -> dict`

- [ ] **Step 1: Test with respx**

```python
# tests/test_tools_intel.py
import respx, httpx
from tools.intel import search_news


@respx.mock
def test_search_news_maps_sources(monkeypatch):
    monkeypatch.setattr("tools.intel.settings.tavily_api_key", "k")
    respx.post("https://api.tavily.com/search").mock(return_value=httpx.Response(200, json={"results": [
        {"title": "Port of Singapore closed", "url": "https://x/a", "published_date": "2026-09-13", "score": 0.9, "content": "Closure..."}]}))
    out = search_news(query="Singapore port")
    assert out["status"] == "success" and out["content"][0]["json"]["results"][0]["credibility"] == 0.9
```

- [ ] **Step 2: FAIL**, **Step 3: Implement**

```python
# tools/intel.py
from __future__ import annotations
import httpx
from strands import tool
from config import settings

def _ok(p): return {"status": "success", "content": [{"json": p}]}
def _err(m): return {"status": "error", "content": [{"text": m}]}


@tool
def search_news(query: str, max_results: int = 5) -> dict:
    """Search recent global news for supply-chain disruptions (ports, strikes, weather, sanctions, supplier failures). Returns title, url, published date, credibility, snippet."""
    if not settings.tavily_api_key: return _err("TAVILY_API_KEY not configured")
    try:
        r = httpx.post("https://api.tavily.com/search", json={"api_key": settings.tavily_api_key, "query": query, "search_depth": "basic",
                                                              "topic": "news", "days": 7, "max_results": max_results}, timeout=20)
        r.raise_for_status()
        res = [{"title": x.get("title"), "url": x.get("url"), "published_at": x.get("published_date"), "credibility": round(float(x.get("score") or 0.5), 2),
                "snippet": (x.get("content") or "")[:400]} for x in r.json().get("results", [])]
        return _ok({"query": query, "results": res})
    except Exception as e:
        return _err(f"search_news failed: {e}")


@tool
def get_weather(lat: float, lng: float) -> dict:
    """Current weather and any severe-weather alert at a coordinate (OpenWeather). Use for ports, factories and route midpoints."""
    if not settings.openweather_api_key: return _err("OPENWEATHER_API_KEY not configured")
    try:
        r = httpx.get("https://api.openweathermap.org/data/2.5/weather", params={"lat": lat, "lon": lng, "appid": settings.openweather_api_key, "units": "metric"}, timeout=15)
        r.raise_for_status(); j = r.json(); w = (j.get("weather") or [{}])[0]; m = j.get("main", {}); wind = j.get("wind", {})
        severe = w.get("id", 800) < 600 or (wind.get("speed") or 0) > 17
        return _ok({"condition": w.get("main"), "description": w.get("description"), "temp_c": m.get("temp"), "wind_ms": wind.get("speed"),
                    "visibility_m": j.get("visibility"), "severe": severe, "place": j.get("name")})
    except Exception as e:
        return _err(f"get_weather failed: {e}")
```

```python
# tools/memory.py
from __future__ import annotations
from strands import tool
from config import settings

def _ok(p): return {"status": "success", "content": [{"json": p}]}
def _err(m): return {"status": "error", "content": [{"text": m}]}

def _client():
    from mem0 import MemoryClient
    return MemoryClient(api_key=settings.mem0_api_key)


@tool
def recall_memory(supply_chain_id: str, query: str) -> dict:
    """Recall past disruptions, decisions and outcomes for this supply chain that resemble the query."""
    if not settings.mem0_api_key: return _ok({"memories": []})
    try:
        res = _client().search(query, user_id=f"sc_{supply_chain_id}", limit=5)
        return _ok({"memories": [r.get("memory") for r in (res or [])]})
    except Exception as e:
        return _err(f"recall_memory failed: {e}")


@tool
def store_memory(supply_chain_id: str, text: str) -> dict:
    """Store a durable memory (event, decision taken, outcome) for this supply chain."""
    if not settings.mem0_api_key: return _ok({"stored": False})
    try:
        _client().add([{"role": "user", "content": text}], user_id=f"sc_{supply_chain_id}")
        return _ok({"stored": True})
    except Exception as e:
        return _err(f"store_memory failed: {e}")
```

```python
# tools/persistence.py
from __future__ import annotations
from strands import tool
import db
from schemas import Assessment, Decision, RouteCandidate

def _ok(p): return {"status": "success", "content": [{"json": p}]}
def _err(m): return {"status": "error", "content": [{"text": m}]}


@tool
def persist_notification(user_id: str, supply_chain_id: str, assessment_json: dict) -> dict:
    """Save an assessed disruption as a notification the operator will see in the alerts feed."""
    try:
        nid = db.insert_notification(user_id, supply_chain_id, Assessment.model_validate(assessment_json))
        return _ok({"notification_id": nid})
    except Exception as e:
        return _err(f"persist_notification failed: {e}")


@tool
def create_decision(user_id: str, decision_json: dict, candidates_json: list[dict] = []) -> dict:
    """Create a pending decision (ranked options + recommendation) in the operator's Decision Inbox."""
    try:
        did = db.insert_decision(user_id, Decision.model_validate(decision_json), [RouteCandidate.model_validate(c) for c in candidates_json])
        return _ok({"decision_id": did})
    except Exception as e:
        return _err(f"create_decision failed: {e}")
```

- [ ] **Step 4: PASS, commit** `feat(agent-service): intel, memory and persistence tools`

## Phase C — Agents and graphs

### Task C1: Agent factory and the eight agents

**Files:**
- Create: `agent-service/agents/__init__.py`, `agent-service/agents/base.py`, `agent-service/agents/{sentinel,analyst,router,impact,strategist,forecaster,scenario,copilot}.py`, `agent-service/tests/test_agents.py`

**Interfaces:**
- `base.make_agent(role: str, system_prompt: str, tools: list, hooks: list, name: str) -> strands.Agent`
- Each module exports `build(hooks) -> Agent` and a `run_*` helper that returns a Pydantic model:
  - `sentinel.run_sentinel(agent, twin: Twin) -> list[Event]` (structured `EventList`)
  - `analyst.run_analyst(agent, twin, event: Event, memories: list[str]) -> Assessment`
  - `router.run_router(agent, twin, assessment, plan: ReroutePlan) -> RouteRanking`
  - `impact.run_impact(agent, twin, assessment, plan) -> ImpactEstimate`
  - `strategist.run_strategist(agent, twin, assessment, ranking, impact) -> MitigationPlan`
  - `forecaster.run_forecaster(agent, twin, horizon, context: str) -> Forecast`
  - `scenario.run_scenario(agent, twin, disruption_type) -> ScenarioSet`
  - `copilot.build(hooks, supply_chain_id) -> Agent` (tools = twin tools + intel + memory; used for streaming chat)

- [ ] **Step 1: Test with a fake model** — Strands lets you pass any `Model`; write a stub that returns a fixed structured output by monkeypatching `Agent.__call__`:

```python
# tests/test_agents.py
from types import SimpleNamespace
from schemas import Assessment, Severity, Source
from tests.test_routing import twin
from routing import reroute_plan


def test_router_prompt_contains_candidates(monkeypatch):
    import agents.router as router
    captured = {}
    class FakeAgent:
        name = "router"
        def __call__(self, prompt, structured_output_model=None, **kw):
            captured["prompt"] = prompt
            return SimpleNamespace(structured_output=structured_output_model(ranked_candidate_ids=["r1"], recommended_candidate_id="r1",
                                   rationale="cheapest", tradeoffs=["+4d"], wait_is_viable=False, wait_rationale="port closed 2+ weeks"))
    t = twin(); plan = reroute_plan(t, ["singapore"], [])
    a = Assessment(event_id="e", title="Singapore closed", summary="s", severity=Severity.HIGH, confidence=0.9, affected_node_ids=["singapore"],
                   affected_edge_ids=[], sources=[Source(title="x", url="u")], needs_review=False)
    r = router.run_router(FakeAgent(), t, a, plan)
    assert r.recommended_candidate_id == "r1" and "colombo" in captured["prompt"].lower()
```

- [ ] **Step 2: FAIL**, **Step 3: Implement base + agents**

```python
# agents/base.py
from strands import Agent
from models import make_model


def make_agent(role: str, system_prompt: str, tools: list | None = None, hooks: list | None = None, name: str | None = None) -> Agent:
    return Agent(name=name or role, model=make_model(role), system_prompt=system_prompt, tools=tools or [], hooks=hooks or [], callback_handler=None)
```

```python
# agents/sentinel.py
from pydantic import BaseModel
from schemas import Event, Twin
from tools.intel import search_news, get_weather
from .base import make_agent

class EventList(BaseModel):
    events: list[Event]

PROMPT = """You are Sentinel, the always-on watch agent for a company's supply chain.
Given the twin (nodes with locations, edges with modes), decide which places and lanes matter, then use search_news and get_weather
to look for disruptions in the last 7 days: port closures/congestion, strikes, storms, floods, sanctions, supplier bankruptcies, canal blockages, factory fires.
Only report events that plausibly touch a node or lane in THIS twin. Map each event to failed_node_ids / failed_edge_ids using the twin's ids.
Return an empty list if nothing relevant. Never invent sources — every event needs at least one real source URL from your searches."""


def build(hooks):
    return make_agent("sentinel", PROMPT, tools=[search_news, get_weather], hooks=hooks)


def run_sentinel(agent, twin: Twin) -> list[Event]:
    places = "\n".join(f"- {n.id}: {n.label} ({n.type}, {n.country or ''} lat={n.lat} lng={n.lng})" for n in twin.nodes)
    lanes = "\n".join(f"- {e.id}: {e.source} -> {e.target} via {e.mode}" for e in twin.edges)
    res = agent(f"Twin '{twin.name}' (id {twin.supply_chain_id}).\nNodes:\n{places}\nLanes:\n{lanes}\n\nScan for disruptions now.",
                structured_output_model=EventList)
    return res.structured_output.events
```

```python
# agents/analyst.py
from schemas import Assessment, Event, Twin
from tools.twin import compute_blast_radius
from .base import make_agent

PROMPT = """You are the Analyst. You receive one candidate disruption event and the twin. Decide how bad it is for THIS network.
Use compute_blast_radius to see what is cut off. Severity rubric: CRITICAL = a node with no alternate path is down or >50% of downstream nodes cut;
HIGH = key lane down but alternates exist; MEDIUM = delays/cost increases likely; LOW = monitor only.
confidence is 0-1 and reflects source quality AND how directly the event maps to the twin. Set needs_review=true if confidence < 0.6 or fewer than 1 source.
Keep the summary to 2-3 sentences an operations manager can act on. Copy sources from the event."""


def build(hooks):
    return make_agent("analyst", PROMPT, tools=[compute_blast_radius], hooks=hooks)


def run_analyst(agent, twin: Twin, event: Event, memories: list[str]) -> Assessment:
    mem = "\n".join(f"- {m}" for m in memories) or "- none"
    res = agent(f"Supply chain id: {twin.supply_chain_id}\nEvent: {event.model_dump_json()}\nNodes: {[(n.id, n.label, n.type) for n in twin.nodes]}\n"
                f"Past memories:\n{mem}\n\nAssess it.", structured_output_model=Assessment)
    a = res.structured_output; a.event_id = event.id
    if not a.sources: a.sources = event.sources
    if not a.affected_node_ids: a.affected_node_ids = event.failed_node_ids
    a.needs_review = a.needs_review or a.confidence < 0.6 or len(a.sources) == 0
    return a
```

```python
# agents/router.py
from routing import ReroutePlan
from schemas import Assessment, RouteRanking, Twin
from .base import make_agent

PROMPT = """You are the Router. You NEVER compute routes yourself — the candidates below were computed exactly by a Dijkstra engine.
Rank the feasible candidates for an operations manager weighing added cost, added days, and risk (max_risk on the path, and known node risk levels).
Prefer the lowest added cost unless it adds >= 5 days more than the next option or passes through a node with risk_level >= 4.
Decide whether simply waiting is viable (only if the disruption is likely to clear within the baseline transit slack). Explain trade-offs in plain language."""


def build(hooks):
    return make_agent("router", PROMPT, hooks=hooks)


def run_router(agent, twin: Twin, a: Assessment, plan: ReroutePlan) -> RouteRanking:
    risk = {n.id: n.risk_level for n in twin.nodes}
    cands = "\n".join(f"- {c.id}: {' -> '.join(c.labels)} | modes={c.modes} | cost=${c.cost:.0f} (+{c.added_cost:.0f}) | days={c.transit_days:.0f} (+{c.added_days:.0f}) | max_risk={c.max_risk} | node_risks={[risk.get(n,0) for n in c.path]} | feasible={c.feasible}" for c in plan.candidates)
    res = agent(f"Disruption: {a.title} ({a.severity}) — {a.summary}\nSevered pairs: {plan.severed_pairs}\nCandidates:\n{cands}\n\nRank them.",
                structured_output_model=RouteRanking)
    r = res.structured_output
    ids = {c.id for c in plan.candidates if c.feasible}
    r.ranked_candidate_ids = [i for i in r.ranked_candidate_ids if i in ids] or sorted(ids, key=lambda i: next(c.added_cost for c in plan.candidates if c.id == i))
    if r.recommended_candidate_id not in ids: r.recommended_candidate_id = r.ranked_candidate_ids[0] if r.ranked_candidate_ids else None
    return r
```

```python
# agents/impact.py
from routing import ReroutePlan
from schemas import Assessment, ImpactEstimate, Twin
from tools.twin import estimate_impact_numbers
from .base import make_agent

PROMPT = """You are the Impact analyst. Quantify the business impact of a disruption using estimate_impact_numbers for the deterministic baseline,
then adjust with judgement (seasonality, buffer stock hints in node data, mode). State assumptions explicitly. Numbers must be consistent with the tool output."""


def build(hooks):
    return make_agent("impact", PROMPT, tools=[estimate_impact_numbers], hooks=hooks)


def run_impact(agent, twin: Twin, a: Assessment, plan: ReroutePlan) -> ImpactEstimate:
    delay = max([c.added_days for c in plan.candidates if c.feasible] or [7])
    res = agent(f"Supply chain id: {twin.supply_chain_id}\nDisruption: {a.model_dump_json()}\nBest reroute adds {delay} days. Infeasible pairs: {plan.infeasible_count}.\nQuantify impact.",
                structured_output_model=ImpactEstimate)
    return res.structured_output
```

```python
# agents/strategist.py
from schemas import Assessment, ImpactEstimate, MitigationPlan, RouteRanking, Twin
from tools.memory import recall_memory
from .base import make_agent

PROMPT = """You are the Strategist. Produce a concrete mitigation plan an operations manager can execute this week: reroute execution, customer comms,
safety stock, alternate supplier outreach, insurance/claims, monitoring triggers. 3-6 steps, each with an owner role and due_in_days.
Use recall_memory to reuse what worked before. estimated_cost_usd must include the chosen reroute's added cost."""


def build(hooks):
    return make_agent("strategist", PROMPT, tools=[recall_memory], hooks=hooks)


def run_strategist(agent, twin: Twin, a: Assessment, r: RouteRanking, i: ImpactEstimate) -> MitigationPlan:
    res = agent(f"Supply chain id: {twin.supply_chain_id}\nDisruption: {a.model_dump_json()}\nRouting decision: {r.model_dump_json()}\nImpact: {i.model_dump_json()}\nWrite the plan.",
                structured_output_model=MitigationPlan)
    return res.structured_output
```

```python
# agents/forecaster.py
from schemas import Forecast, Twin
from tools.intel import search_news
from tools.memory import recall_memory
from .base import make_agent

PROMPT = """You are the Forecaster. Estimate forward risk for the twin over the horizon using recent news (search_news) and memory. risk_score 0-100.
Drivers must be specific (e.g. 'Typhoon season at Shenzhen through Oct', 'Rotterdam pilot strike ballot 20 Sept')."""


def build(hooks):
    return make_agent("forecaster", PROMPT, tools=[search_news, recall_memory], hooks=hooks)


def run_forecaster(agent, twin: Twin, horizon: str, context: str = "") -> Forecast:
    res = agent(f"Supply chain id: {twin.supply_chain_id} '{twin.name}'. Nodes: {[(n.label, n.country) for n in twin.nodes]}\nHorizon: {horizon}\nContext: {context}\nForecast.",
                structured_output_model=Forecast)
    f = res.structured_output; f.horizon = horizon; return f
```

```python
# agents/scenario.py
from schemas import ScenarioSet, Twin
from .base import make_agent

PROMPT = """You are the Scenario planner. Generate 3 realistic, distinct what-if disruption scenarios for this twin, each naming real node ids to fail,
with a probability (0-1) and duration in days. Ground them in the twin's geography and modes."""


def build(hooks):
    return make_agent("scenario", PROMPT, hooks=hooks)


def run_scenario(agent, twin: Twin, disruption_type: str = "all") -> ScenarioSet:
    res = agent(f"Supply chain id: {twin.supply_chain_id}. Nodes: {[(n.id, n.label, n.type, n.country) for n in twin.nodes]}. Edges: {[(e.source, e.target, e.mode) for e in twin.edges]}\nType: {disruption_type}\nGenerate scenarios.",
                structured_output_model=ScenarioSet)
    return res.structured_output
```

```python
# agents/copilot.py
from tools.twin import load_twin, compute_blast_radius, find_reroutes, estimate_impact_numbers
from tools.intel import search_news, get_weather
from tools.memory import recall_memory
from .base import make_agent

PROMPT = """You are SupplyChain AI, the operator's copilot. You know their digital twin (use load_twin with the supply chain id given in context).
Answer questions about health, risk and routes; when asked 'what if X fails' call compute_blast_radius and find_reroutes and report exact numbers from the tools.
Be concise, concrete, and cite tool results. Never identify as a generic LLM."""


def build(hooks, supply_chain_id: str):
    return make_agent("copilot", PROMPT + f"\nCurrent supply chain id: {supply_chain_id}",
                      tools=[load_twin, compute_blast_radius, find_reroutes, estimate_impact_numbers, search_news, get_weather, recall_memory], hooks=hooks)
```

- [ ] **Step 4: PASS, commit** `feat(agent-service): eight Strands agents with structured outputs`

### Task C2: Incident graph (GraphBuilder) and analysis graph

**Files:**
- Create: `agent-service/graphs/__init__.py`, `agent-service/graphs/incident.py`, `agent-service/graphs/analysis.py`, `agent-service/tests/test_graphs.py`

**Interfaces:**
- `incident.run_incident(supply_chain_id: str, user_id: str, event: Event, emit: Callable[[GraphEvent], None], persist: bool = True) -> IncidentResult` where `IncidentResult(assessment, plan: ReroutePlan | None, ranking, impact, mitigation, decision, decision_id, notification_id, trace_id, status: "decision"|"notified"|"partial")`
- `incident.build_incident_graph(...)` uses `strands.multiagent.GraphBuilder` with nodes `analyst → [severity≥HIGH] → router, impact → strategist`; the deterministic reroute computation happens in a `@tool`-free Python step between analyst and router by injecting the plan into the shared invocation state.
- `analysis.run_analysis(supply_chain_id, user_id, query, emit) -> AnalysisResult(forecast, scenarios, impact_summary, strategy, report_markdown)`

Design note: Strands `Graph` passes text between nodes. To keep structured data exact, each graph node is a thin Strands `Agent` whose system prompt is the role prompt, and the Python runner `run_incident` (a) runs `analyst` as graph node 1, (b) computes `reroute_plan` deterministically, (c) builds the remaining graph (`router ∥ impact → strategist`) with the plan injected into the prompt, and (d) uses `GraphBuilder` conditional edges so `router`/`impact` only execute when `severity >= HIGH`. Both stages are real `Graph` executions with `execution_order` captured for the trace panel.

- [ ] **Step 1: Test** graph wiring with a stub model that returns canned structured outputs:

```python
# tests/test_graphs.py
from graphs.incident import severity_gate
from schemas import Assessment, Severity, Source


def _a(sev):
    return Assessment(event_id="e", title="t", summary="s", severity=sev, confidence=0.9, affected_node_ids=["singapore"], affected_edge_ids=[], sources=[Source(title="x", url="u")], needs_review=False)


def test_severity_gate():
    assert severity_gate(_a(Severity.HIGH)) and severity_gate(_a(Severity.CRITICAL))
    assert not severity_gate(_a(Severity.MEDIUM)) and not severity_gate(_a(Severity.LOW))
```

- [ ] **Step 2: FAIL**, **Step 3: Implement**

```python
# graphs/incident.py
from __future__ import annotations
import time
from dataclasses import dataclass
from typing import Callable, Optional
from strands.multiagent import GraphBuilder
import db
from agents import analyst, impact, router, strategist
from routing import ReroutePlan, reroute_plan
from schemas import (Assessment, Decision, DecisionOption, Event, GraphEvent, ImpactEstimate, MitigationPlan, RouteRanking, Severity, Twin)
from tools.memory import recall_memory
from tools.twin import twin_cache
from tracing import TraceHooks, new_session_id

SEV_ORDER = {Severity.LOW: 0, Severity.MEDIUM: 1, Severity.HIGH: 2, Severity.CRITICAL: 3}


def severity_gate(a: Assessment) -> bool:
    return SEV_ORDER[a.severity] >= SEV_ORDER[Severity.HIGH]


@dataclass
class IncidentResult:
    assessment: Assessment
    plan: Optional[ReroutePlan]
    ranking: Optional[RouteRanking]
    impact: Optional[ImpactEstimate]
    mitigation: Optional[MitigationPlan]
    decision: Optional[Decision]
    decision_id: Optional[str]
    notification_id: Optional[str]
    trace_id: str
    status: str
    execution_order: list[str]


def _risk_of(c) -> Severity:
    if c.max_risk >= 2.0: return Severity.HIGH
    if c.max_risk >= 1.3: return Severity.MEDIUM
    return Severity.LOW


def build_decision(twin: Twin, a: Assessment, plan: ReroutePlan, r: RouteRanking, i: Optional[ImpactEstimate], m: Optional[MitigationPlan], trace_id: str) -> Decision:
    by_id = {c.id: c for c in plan.candidates}
    opts: list[DecisionOption] = []
    for cid in r.ranked_candidate_ids[:3]:
        c = by_id[cid]
        opts.append(DecisionOption(id=cid, label=" → ".join(c.labels), kind="reroute", added_cost=c.added_cost, added_days=c.added_days,
                                   risk=_risk_of(c), route_candidate_id=cid, detail=f"{'/'.join(sorted(set(c.modes)))} · ${c.cost:,.0f} · {c.transit_days:.0f} days"))
    opts.append(DecisionOption(id="wait", label="Wait and monitor", kind="wait", added_days=i.delay_days if i else 0,
                               risk=Severity.HIGH if not r.wait_is_viable else Severity.MEDIUM, detail=r.wait_rationale))
    if m: opts.append(DecisionOption(id="mitigate", label=m.title, kind="mitigate", added_cost=m.estimated_cost_usd, risk=m.risk_after, detail=m.summary))
    rec = r.recommended_candidate_id if r.recommended_candidate_id in by_id else ("wait" if r.wait_is_viable else opts[0].id)
    title = f"{a.title}: choose a route" if plan.feasible_count else f"{a.title}: no full bypass available"
    return Decision(supply_chain_id=twin.supply_chain_id, event_id=a.event_id, title=title, summary=a.summary, options=opts,
                    recommended_option_id=rec, rationale=r.rationale, confidence=a.confidence, sources=a.sources, trace_id=trace_id)


def run_incident(supply_chain_id: str, user_id: str, event: Event, emit: Callable[[GraphEvent], None] = lambda e: None, persist: bool = True) -> IncidentResult:
    trace_id = new_session_id("incident")
    hooks = [TraceHooks(trace_id, user_id, supply_chain_id, "incident")]
    twin = twin_cache.get(supply_chain_id)
    order: list[str] = []
    t0 = time.time()

    def stage(name):
        emit(GraphEvent(type="node_start", node=name)); order.append(name); return time.time()
    def done(name, t, payload=None):
        emit(GraphEvent(type="node_end", node=name, elapsed_ms=int((time.time() - t) * 1000), payload=payload))

    # Stage 1 — analyst (single-node graph so execution is traced like the rest)
    t = stage("analyst")
    mem = recall_memory(supply_chain_id=supply_chain_id, query=event.title)
    memories = (mem.get("content", [{}])[0].get("json", {}) or {}).get("memories", []) if mem.get("status") == "success" else []
    a = analyst.run_analyst(analyst.build(hooks), twin, event, memories)
    done("analyst", t, {"severity": a.severity, "confidence": a.confidence, "affected": a.affected_node_ids})

    notification_id = db.insert_notification(user_id, supply_chain_id, a) if persist else None
    if not severity_gate(a):
        emit(GraphEvent(type="result", payload={"status": "notified"}))
        return IncidentResult(a, None, None, None, None, None, None, notification_id, trace_id, "notified", order)

    # Deterministic step — never the LLM
    t = stage("routing_engine")
    plan = reroute_plan(twin, a.affected_node_ids or event.failed_node_ids, a.affected_edge_ids or event.failed_edge_ids, k=3)
    done("routing_engine", t, {"feasible": plan.feasible_count, "infeasible": plan.infeasible_count, "candidates": len(plan.candidates)})

    # Stage 2 — Strands Graph: router ∥ impact → strategist
    ranking = imp = mit = None
    try:
        router_agent, impact_agent, strat_agent = router.build(hooks), impact.build(hooks), strategist.build(hooks)
        gb = GraphBuilder()
        gb.add_node(router_agent, "router"); gb.add_node(impact_agent, "impact"); gb.add_node(strat_agent, "strategist")
        gb.add_edge("router", "strategist"); gb.add_edge("impact", "strategist")
        gb.set_entry_point("router"); gb.set_entry_point("impact"); gb.set_execution_timeout(120)
        graph = gb.build()
        t = stage("graph:router+impact→strategist")
        risk = {n.id: n.risk_level for n in twin.nodes}
        cands = "\n".join(f"- {c.id}: {' -> '.join(c.labels)} | cost=${c.cost:.0f} (+{c.added_cost:.0f}) | days={c.transit_days:.0f} (+{c.added_days:.0f}) | max_risk={c.max_risk} | node_risks={[risk.get(n,0) for n in c.path]} | feasible={c.feasible}" for c in plan.candidates)
        gres = graph(f"Supply chain id: {supply_chain_id}\nDisruption: {a.model_dump_json()}\nSevered pairs: {plan.severed_pairs}\nRoute candidates (computed exactly, do not recompute):\n{cands}\n"
                     f"Router: rank candidates and decide if waiting is viable. Impact: quantify. Strategist: write the mitigation plan using both.")
        done("graph:router+impact→strategist", t, {"status": str(gres.status), "order": [n.node_id for n in gres.execution_order]})
        order.extend(n.node_id for n in gres.execution_order)
    except Exception as e:
        emit(GraphEvent(type="error", node="graph", payload={"error": str(e)}))

    # Structured passes (exact JSON for the UI) — cheap, single-turn each
    t = stage("router"); ranking = router.run_router(router.build(hooks), twin, a, plan); done("router", t, {"recommended": ranking.recommended_candidate_id})
    t = stage("impact"); imp = impact.run_impact(impact.build(hooks), twin, a, plan); done("impact", t, {"revenue_at_risk_usd": imp.revenue_at_risk_usd})
    t = stage("strategist"); mit = strategist.run_strategist(strategist.build(hooks), twin, a, ranking, imp); done("strategist", t, {"steps": len(mit.steps)})

    decision = build_decision(twin, a, plan, ranking, imp, mit, trace_id)
    decision_id = db.insert_decision(user_id, decision, plan.candidates) if persist else None
    if persist: db.insert_audit(user_id, "IncidentGraph", f"Decision created: {decision.title}", {"decision_id": decision_id, "trace_id": trace_id, "elapsed_ms": int((time.time()-t0)*1000)})
    emit(GraphEvent(type="result", payload={"status": "decision", "decision_id": decision_id}))
    return IncidentResult(a, plan, ranking, imp, mit, decision, decision_id, notification_id, trace_id, "decision", order)
```

Implementer note: if the installed Strands `GraphBuilder` does not accept two `set_entry_point` calls, add a tiny pass-through `Agent` named `intake` as the single entry with edges `intake→router`, `intake→impact`.

```python
# graphs/analysis.py
from __future__ import annotations
import time
from dataclasses import dataclass
from typing import Callable
from strands.multiagent import GraphBuilder
from agents import forecaster, impact, scenario, strategist
from agents.base import make_agent
from schemas import Forecast, GraphEvent, ScenarioSet
from tools.intel import search_news
from tools.twin import twin_cache, load_twin, find_reroutes, compute_blast_radius
from tools.memory import recall_memory
from tracing import TraceHooks, new_session_id


@dataclass
class AnalysisResult:
    forecast: Forecast
    scenarios: ScenarioSet
    report_markdown: str
    trace_id: str
    execution_order: list[str]


INTEL_PROMPT = "You are the Intelligence agent. Use search_news and load_twin to summarise the current external situation for this twin in 5 bullets with sources."
REPORT_PROMPT = "You are the Report writer. Combine the intelligence, forecast, scenarios and mitigation inputs into a crisp markdown briefing: ## Situation, ## Forecast, ## Scenarios, ## Recommended actions, ## Sources."


def run_analysis(supply_chain_id: str, user_id: str, query: str, emit: Callable[[GraphEvent], None] = lambda e: None) -> AnalysisResult:
    trace_id = new_session_id("analysis"); hooks = [TraceHooks(trace_id, user_id, supply_chain_id, "analysis")]
    twin = twin_cache.get(supply_chain_id)
    intel = make_agent("orchestrator", INTEL_PROMPT, tools=[search_news, load_twin], hooks=hooks, name="intel")
    fc = forecaster.build(hooks); sc = scenario.build(hooks)
    st = make_agent("strategist", strategist.PROMPT, tools=[recall_memory, find_reroutes, compute_blast_radius], hooks=hooks, name="strategist")
    rp = make_agent("orchestrator", REPORT_PROMPT, hooks=hooks, name="report")
    gb = GraphBuilder()
    for n, a in [("intel", intel), ("forecast", fc), ("scenario", sc), ("strategy", st), ("report", rp)]: gb.add_node(a, n)
    gb.add_edge("intel", "forecast"); gb.add_edge("intel", "scenario"); gb.add_edge("forecast", "strategy"); gb.add_edge("scenario", "strategy"); gb.add_edge("strategy", "report")
    gb.set_entry_point("intel"); gb.set_execution_timeout(180)
    graph = gb.build()
    t = time.time(); emit(GraphEvent(type="node_start", node="analysis_graph"))
    res = graph(f"Supply chain id: {supply_chain_id} '{twin.name}'. Nodes: {[(n.id, n.label, n.country) for n in twin.nodes]}\nOperator question: {query}")
    order = [n.node_id for n in res.execution_order]
    emit(GraphEvent(type="node_end", node="analysis_graph", elapsed_ms=int((time.time()-t)*1000), payload={"order": order}))
    report = str(res.results["report"].result) if "report" in res.results else ""
    f = forecaster.run_forecaster(fc, twin, "30d", context=report[:2000])
    s = scenario.run_scenario(sc, twin)
    emit(GraphEvent(type="result", payload={"trace_id": trace_id}))
    return AnalysisResult(f, s, report, trace_id, order)
```

- [ ] **Step 4: PASS, commit** `feat(agent-service): incident and analysis graphs with GraphBuilder`

## Phase D — HTTP API, AgentCore entry, container

### Task D1: FastAPI app with SSE and AgentCore contract

**Files:**
- Create: `agent-service/app.py`, `agent-service/agentcore_entry.py`, `agent-service/tests/test_app.py`

**Interfaces:**
- Routes exactly as the spec table. Auth: header `x-agent-secret` must equal `settings.agent_service_secret` when set. SSE frames: `data: <GraphEvent json>\n\n`, final frame `event: result`.
- `POST /invocations` body `{action, ...}` dispatches to the same handlers; `GET /ping` → `{"status":"healthy"}`.

- [ ] **Step 1: Test**

```python
# tests/test_app.py
from fastapi.testclient import TestClient
from app import app
from tools.twin import twin_cache
from tests.test_routing import twin


def test_ping():
    assert TestClient(app).get("/ping").json()["status"] == "healthy"


def test_reroute_endpoint_is_deterministic():
    twin_cache.put(twin())
    r = TestClient(app).post("/reroute", json={"supply_chain_id": "t", "failed_node_ids": ["singapore"]})
    assert r.status_code == 200 and r.json()["candidates"][0]["path"][1] == "colombo"
```

- [ ] **Step 2: FAIL**, **Step 3: Implement**

```python
# app.py
from __future__ import annotations
import asyncio, json, queue, threading
from typing import Any, Optional
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from config import settings
import db
from agents import copilot, forecaster, impact, scenario, sentinel, strategist
from graphs.analysis import run_analysis
from graphs.incident import run_incident
from routing import reroute_plan
from schemas import Assessment, Event, GraphEvent, Twin
from tools.twin import twin_cache
from tracing import TraceHooks, new_session_id

app = FastAPI(title="SupplyChain AI agent-service")


def auth(x_agent_secret: Optional[str] = Header(default=None)):
    if settings.agent_service_secret and x_agent_secret != settings.agent_service_secret:
        raise HTTPException(401, "bad secret")


class RerouteIn(BaseModel):
    supply_chain_id: str; failed_node_ids: list[str] = []; failed_edge_ids: list[str] = []; k: int = 3; twin: Optional[Twin] = None

class IncidentIn(BaseModel):
    supply_chain_id: str; user_id: str; event: Event; persist: bool = True; twin: Optional[Twin] = None

class ScanIn(BaseModel):
    supply_chain_id: str; user_id: str

class AnalysisIn(BaseModel):
    supply_chain_id: str; user_id: str; query: str

class ChatIn(BaseModel):
    supply_chain_id: str; user_id: str; message: str; twin: Optional[Twin] = None

class SimpleIn(BaseModel):
    supply_chain_id: str; user_id: str = "system"; horizon: str = "30d"; disruption_type: str = "all"; context: str = ""; assessment: Optional[Assessment] = None; failed_node_ids: list[str] = []


def _stream(worker):
    """Run a blocking worker in a thread; yield GraphEvents as SSE frames; final frame carries the result."""
    q: "queue.Queue[Any]" = queue.Queue()
    def emit(e: GraphEvent): q.put(e)
    def run():
        try: q.put(("__result__", worker(emit)))
        except Exception as ex: q.put(GraphEvent(type="error", payload={"error": str(ex)})); q.put(("__result__", None))
    threading.Thread(target=run, daemon=True).start()
    async def gen():
        while True:
            item = await asyncio.get_event_loop().run_in_executor(None, q.get)
            if isinstance(item, tuple):
                yield {"event": "result", "data": json.dumps(item[1], default=_dump)}; return
            yield {"event": item.type, "data": item.model_dump_json()}
    return EventSourceResponse(gen())


def _dump(o):
    if hasattr(o, "model_dump"): return o.model_dump()
    if hasattr(o, "__dict__"): return {k: v for k, v in o.__dict__.items()}
    return str(o)


@app.get("/ping")
def ping(): return {"status": "healthy", "provider": settings.agent_model_provider}


@app.post("/reroute", dependencies=[Depends(auth)])
def reroute(inp: RerouteIn):
    if inp.twin: twin_cache.put(inp.twin)
    p = reroute_plan(twin_cache.get(inp.supply_chain_id), inp.failed_node_ids, inp.failed_edge_ids, inp.k)
    return {"severity": p.severity, "feasible_count": p.feasible_count, "infeasible_count": p.infeasible_count, "severed_pairs": p.severed_pairs,
            "candidates": [c.model_dump() for c in p.candidates]}


@app.post("/incident", dependencies=[Depends(auth)])
def incident(inp: IncidentIn):
    if inp.twin: twin_cache.put(inp.twin)
    return _stream(lambda emit: run_incident(inp.supply_chain_id, inp.user_id, inp.event, emit, inp.persist))


@app.post("/scan", dependencies=[Depends(auth)])
def scan(inp: ScanIn):
    twin = twin_cache.get(inp.supply_chain_id); twin_cache.clear(inp.supply_chain_id)
    sid = new_session_id("scan"); hooks = [TraceHooks(sid, inp.user_id, inp.supply_chain_id, "scan")]
    events = sentinel.run_sentinel(sentinel.build(hooks), twin)
    seen = db.recent_event_fingerprints(inp.supply_chain_id)
    out = []
    for ev in events:
        if db.fingerprint(ev.title, ev.failed_node_ids) in seen: continue
        r = run_incident(inp.supply_chain_id, inp.user_id, ev, persist=True)
        out.append({"event": ev.title, "status": r.status, "severity": r.assessment.severity, "decision_id": r.decision_id})
    db.insert_audit(inp.user_id, "Sentinel", f"Scan complete: {len(events)} events, {len(out)} new", {"session": sid})
    return {"scanned": len(events), "processed": out, "trace_id": sid}


@app.post("/analysis", dependencies=[Depends(auth)])
def analysis(inp: AnalysisIn):
    return _stream(lambda emit: run_analysis(inp.supply_chain_id, inp.user_id, inp.query, emit))


@app.post("/chat", dependencies=[Depends(auth)])
async def chat(inp: ChatIn):
    if inp.twin: twin_cache.put(inp.twin)
    agent = copilot.build([TraceHooks(new_session_id("chat"), inp.user_id, inp.supply_chain_id, "chat")], inp.supply_chain_id)
    async def gen():
        async for ev in agent.stream_async(inp.message):
            if "data" in ev: yield {"event": "token", "data": json.dumps({"text": ev["data"]})}
            elif "current_tool_use" in ev: yield {"event": "tool", "data": json.dumps({"name": ev["current_tool_use"].get("name")})}
        yield {"event": "result", "data": "{}"}
    return EventSourceResponse(gen())


@app.post("/forecast", dependencies=[Depends(auth)])
def forecast(inp: SimpleIn):
    twin = twin_cache.get(inp.supply_chain_id); hooks = [TraceHooks(new_session_id("forecast"), inp.user_id, inp.supply_chain_id, "forecast")]
    return forecaster.run_forecaster(forecaster.build(hooks), twin, inp.horizon, inp.context).model_dump()


@app.post("/scenario", dependencies=[Depends(auth)])
def scenario_ep(inp: SimpleIn):
    twin = twin_cache.get(inp.supply_chain_id); hooks = [TraceHooks(new_session_id("scenario"), inp.user_id, inp.supply_chain_id, "scenario")]
    return scenario.run_scenario(scenario.build(hooks), twin, inp.disruption_type).model_dump()


@app.post("/impact", dependencies=[Depends(auth)])
def impact_ep(inp: SimpleIn):
    twin = twin_cache.get(inp.supply_chain_id); hooks = [TraceHooks(new_session_id("impact"), inp.user_id, inp.supply_chain_id, "impact")]
    a = inp.assessment or Assessment(event_id="manual", title="Manual impact request", summary=inp.context or "Operator-requested impact assessment",
                                     severity="HIGH", confidence=0.7, affected_node_ids=inp.failed_node_ids, affected_edge_ids=[], sources=[], needs_review=True)
    plan = reroute_plan(twin, a.affected_node_ids, [], 3)
    return impact.run_impact(impact.build(hooks), twin, a, plan).model_dump()


@app.post("/strategy", dependencies=[Depends(auth)])
def strategy_ep(inp: SimpleIn):
    twin = twin_cache.get(inp.supply_chain_id); hooks = [TraceHooks(new_session_id("strategy"), inp.user_id, inp.supply_chain_id, "strategy")]
    a = inp.assessment or Assessment(event_id="manual", title="Strategy request", summary=inp.context, severity="HIGH", confidence=0.7,
                                     affected_node_ids=inp.failed_node_ids, affected_edge_ids=[], sources=[], needs_review=True)
    plan = reroute_plan(twin, a.affected_node_ids, [], 3)
    from agents import router as _router
    r = _router.run_router(_router.build(hooks), twin, a, plan); i = impact.run_impact(impact.build(hooks), twin, a, plan)
    return {"ranking": r.model_dump(), "impact": i.model_dump(), "plan": strategist.run_strategist(strategist.build(hooks), twin, a, r, i).model_dump()}


@app.post("/weather", dependencies=[Depends(auth)])
def weather_ep(inp: SimpleIn):
    from tools.intel import get_weather
    twin = twin_cache.get(inp.supply_chain_id); out = []
    for n in twin.nodes:
        if n.lat is None or n.lng is None: continue
        w = get_weather(lat=n.lat, lng=n.lng)
        if w.get("status") == "success": out.append({"node_id": n.id, "label": n.label, **w["content"][0]["json"]})
    return {"nodes": out, "severe": [o for o in out if o.get("severe")]}


# ---- AgentCore contract --------------------------------------------------------
@app.post("/invocations")
def invocations(payload: dict):
    action = payload.get("action", "chat")
    if action == "reroute": return reroute(RerouteIn(**payload))
    if action == "scan": return scan(ScanIn(**payload))
    if action == "forecast": return forecast(SimpleIn(**payload))
    if action == "scenario": return scenario_ep(SimpleIn(**payload))
    if action == "impact": return impact_ep(SimpleIn(**payload))
    if action == "strategy": return strategy_ep(SimpleIn(**payload))
    if action == "incident":
        inp = IncidentIn(**payload); r = run_incident(inp.supply_chain_id, inp.user_id, inp.event, persist=inp.persist)
        return json.loads(json.dumps(r, default=_dump))
    inp = ChatIn(**payload)
    agent = copilot.build([], inp.supply_chain_id)
    return {"text": str(agent(inp.message))}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=settings.port)
```

```python
# agentcore_entry.py — same handlers, AgentCore runtime wrapper (used when deploying with `agentcore deploy`)
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from app import invocations

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload):
    return invocations(payload)

if __name__ == "__main__":
    app.run()
```

- [ ] **Step 4: PASS, commit** `feat(agent-service): FastAPI service with SSE streaming and AgentCore contract`

### Task D2: Dockerfile and local run script

**Files:**
- Create: `agent-service/Dockerfile`, `agent-service/.dockerignore`, `agent-service/README.md`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml ./
RUN uv pip install --system -e . 2>/dev/null || (uv pip compile pyproject.toml -o req.txt && uv pip install --system -r req.txt)
COPY . .
ENV PORT=8080
EXPOSE 8080
CMD ["python", "app.py"]
```

Implementer: if `-e .` fails because there is no build backend, add `[build-system] requires=["setuptools>=68"] build-backend="setuptools.build_meta"` and `[tool.setuptools] py-modules=[...]` — or simply generate `requirements.txt` with `uv pip compile pyproject.toml -o requirements.txt` and `pip install -r requirements.txt` in the image.

- [ ] Build locally: `docker build -t sc-agent agent-service && docker run --rm -p 8080:8080 --env-file agent-service/.env sc-agent` then `curl localhost:8080/ping`.
- [ ] Commit `build(agent-service): dockerfile`

## Phase E — Next.js integration

### Task E1: Remove Google ADK; add agent client and types

**Files:**
- Delete: `lib/adk/`, `lib/zod-patch.ts`, `lib/zod-shim.ts`, `app/api/agent/info/`, `app/api/copilotkitlitemodel/`, `list-supabase-tables.ts`
- Modify: `package.json` (remove `@google/adk`, `@iqai/adk`, `@google/generative-ai`, `@modelcontextprotocol/sdk`), `instrumentation.ts` (drop zod-patch import)
- Create: `lib/agent-client.ts`, `types/agent.ts`, `__tests__/agent-client.test.ts`

**Interfaces:**
- `agentClient.post<T>(path, body, opts?) -> Promise<T>`; `agentClient.stream(path, body, onEvent: (name, data) => void) -> Promise<any /* result frame */>`; `parseSse(chunk: string, buffer: {rest: string}) -> Array<{event:string,data:string}>`
- `types/agent.ts` mirrors `schemas.py` (`Assessment`, `RouteCandidate`, `DecisionOption`, `Decision`, `GraphEvent`, `ImpactEstimate`, `MitigationPlan`, `Forecast`, `Scenario`).

- [ ] **Step 1: Test for the SSE parser**

```ts
// __tests__/agent-client.test.ts
import { describe, it, expect } from "vitest"
import { parseSse } from "@/lib/agent-client"

describe("parseSse", () => {
  it("splits frames across chunks", () => {
    const buf = { rest: "" }
    const a = parseSse("event: node_start\ndata: {\"type\":\"node_start\",\"node\":\"analyst\"}\n\nevent: res", buf)
    expect(a).toEqual([{ event: "node_start", data: "{\"type\":\"node_start\",\"node\":\"analyst\"}" }])
    const b = parseSse("ult\ndata: {}\n\n", buf)
    expect(b).toEqual([{ event: "result", data: "{}" }])
  })
})
```

- [ ] **Step 2:** add vitest: `pnpm add -D vitest @vitejs/plugin-react jsdom` and `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config"
import path from "path"
export default defineConfig({ test: { environment: "node", include: ["__tests__/**/*.test.ts"] }, resolve: { alias: { "@": path.resolve(__dirname) } } })
```
Add `"test": "vitest run"` to package.json scripts. Run — FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/agent-client.ts
const BASE = process.env.AGENT_SERVICE_URL ?? "http://localhost:8080"
const SECRET = process.env.AGENT_SERVICE_SECRET ?? ""

export class AgentServiceError extends Error { constructor(public status: number, msg: string) { super(msg) } }

export function parseSse(chunk: string, buffer: { rest: string }): Array<{ event: string; data: string }> {
  buffer.rest += chunk
  const frames: Array<{ event: string; data: string }> = []
  let idx: number
  while ((idx = buffer.rest.indexOf("\n\n")) >= 0) {
    const raw = buffer.rest.slice(0, idx); buffer.rest = buffer.rest.slice(idx + 2)
    let event = "message"; const data: string[] = []
    for (const line of raw.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim()
      else if (line.startsWith("data:")) data.push(line.slice(5).trim())
    }
    frames.push({ event, data: data.join("\n") })
  }
  return frames
}

async function doFetch(path: string, body: unknown, accept = "application/json") {
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/json", accept, "x-agent-secret": SECRET }, body: JSON.stringify(body) })
  if (!res.ok) throw new AgentServiceError(res.status, `agent-service ${path} → ${res.status}: ${await res.text().catch(() => "")}`)
  return res
}

export const agentClient = {
  async post<T = any>(path: string, body: unknown): Promise<T> { return (await doFetch(path, body)).json() },
  /** Consume an SSE stream; resolves with the parsed `result` frame. */
  async stream(path: string, body: unknown, onEvent: (event: string, data: any) => void): Promise<any> {
    const res = await doFetch(path, body, "text/event-stream")
    const reader = res.body!.getReader(); const dec = new TextDecoder(); const buf = { rest: "" }
    let result: any = null
    for (;;) {
      const { value, done } = await reader.read(); if (done) break
      for (const f of parseSse(dec.decode(value, { stream: true }), buf)) {
        const data = f.data ? JSON.parse(f.data) : null
        if (f.event === "result") result = data; else onEvent(f.event, data)
      }
    }
    return result
  },
  /** Pass a Response straight through to the browser (proxy mode). */
  async proxyStream(path: string, body: unknown): Promise<Response> {
    const res = await doFetch(path, body, "text/event-stream")
    return new Response(res.body, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" } })
  },
}
```

```ts
// types/agent.ts
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
export interface Source { title: string; url: string; published_at?: string | null; credibility: number }
export interface Assessment { event_id: string; title: string; summary: string; severity: Severity; confidence: number; affected_node_ids: string[]; affected_edge_ids: string[]; sources: Source[]; needs_review: boolean; category: string }
export interface RouteCandidate { id: string; origin: string; destination: string; path: string[]; labels: string[]; modes: string[]; cost: number; transit_days: number; max_risk: number; baseline_cost: number; baseline_days: number; added_cost: number; added_days: number; feasible: boolean }
export interface DecisionOption { id: string; label: string; kind: "reroute" | "wait" | "mitigate" | "escalate"; added_cost: number; added_days: number; risk: Severity; route_candidate_id?: string | null; detail: string }
export type DecisionStatus = "pending" | "approved" | "rejected" | "snoozed" | "expired"
export interface DecisionRow { id: string; user_id: string; supply_chain_id: string; event_id: string | null; title: string; summary: string; options: DecisionOption[]; recommended_option_id: string; chosen_option_id: string | null; rationale: string; confidence: number; sources: Source[]; trace_id: string | null; status: DecisionStatus; created_at: string; decided_at: string | null; route_plans?: RoutePlanRow[] }
export interface RoutePlanRow { id: string; decision_id: string; candidate_id: string; path: string[]; labels: string[]; modes: string[]; cost: number; transit_days: number; added_cost: number; added_days: number; max_risk: number; feasible: boolean }
export interface GraphEvent { type: "node_start" | "node_end" | "tool" | "result" | "error"; node?: string | null; elapsed_ms?: number | null; payload?: Record<string, any> | null }
export interface ImpactEstimate { revenue_at_risk_usd: number; delay_days: number; nodes_affected: number; orders_affected_pct: number; summary: string; assumptions: string[] }
export interface MitigationStep { title: string; owner: string; due_in_days: number; detail: string }
export interface MitigationPlan { title: string; summary: string; steps: MitigationStep[]; estimated_cost_usd: number; risk_after: Severity }
export interface Forecast { horizon: "7d" | "30d" | "90d"; risk_score: number; trend: "improving" | "stable" | "worsening"; drivers: string[]; summary: string }
export interface Scenario { id: string; title: string; description: string; disruption_type: string; failed_node_ids: string[]; probability: number; duration_days: number }
export interface IncidentEvent { id: string; kind: "news" | "weather" | "manual" | "simulation"; title: string; description: string; location?: string; failed_node_ids: string[]; failed_edge_ids: string[]; sources?: Source[] }
```

- [ ] **Step 4:** `pnpm remove @google/adk @iqai/adk @google/generative-ai @modelcontextprotocol/sdk`; delete files; fix `instrumentation.ts`; run `pnpm test` PASS and `npx tsc --noEmit` — expect errors only in the `app/api/agent/*` files that will be rewritten in E2 (list them; do not fix here).
- [ ] Commit `refactor: remove Google ADK, add agent-service client and types`

### Task E2: Rewrite `app/api/agent/*` as proxies (backward compatible)

**Files:**
- Modify (full rewrite): `app/api/agent/{orchestrator,route-optimization,scenario,forecast,live-intelligence,weather-intelligence,strategy,impact,automated-alerts,news-polling,news-simulation,strategy-execution}/route.ts`, `app/api/agent/strategy/finalize/route.ts`
- Create: `app/api/agent/incident/route.ts`, `app/api/agent/chat/route.ts`, `app/api/agent/reroute/route.ts`, `lib/server/twin.ts`

**Interfaces:**
- `lib/server/twin.ts`: `loadTwinForAgent(supplyChainId) -> Twin` (server Supabase → agent `Twin` shape, same mapping as `db.rows_to_twin`) and `rfToTwin(nodes, edges, supplyChainId) -> Twin` for unsaved canvas state.
- Backward-compat contracts kept:
  - `POST /api/agent/route-optimization {nodeId, description, nodes, edges}` → `{severity:'Low'|'Medium'|'High', impactDescription, alternateRoutes: string[], candidates: RouteCandidate[]}`
  - `POST /api/agent/impact` and `GET ?simulationId=` → unchanged response keys used by `lib/api/simulation.ts` (read that file and preserve `success`, `data` shape)
  - `POST /api/agent/forecast` → `{success, data: Forecast}`; `GET` returns cached forecast from `forecasts` table
  - `POST /api/agent/scenario` → `{success, scenarios: Scenario[]}`
  - `GET /api/agent/automated-alerts?supplyChainId&userId` → `{success, alertsGenerated, data}` via agent `/scan`
  - `POST /api/agent/orchestrator {query, supplyChainId, userId}` → `{success, analysis: report_markdown, coordinationLogs: [{stepNumber, agent, action, processingTime}], forecast, scenarios}`
  - `POST /api/agent/strategy {simulationId|supplyChainId, ...}` → `{success, data: {ranking, impact, plan}}`; `strategy/finalize` writes `pending_approvals` row status approved (unchanged table)
  - `POST /api/agent/weather-intelligence {supplyChainId,userId}` → `{success, data}`; `news-polling` and `news-simulation` and `live-intelligence` become thin calls to `/scan` / `/analysis` respectively with their old response keys.

- [ ] For each route: read the old file's response keys first; write the proxy; example for `route-optimization`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { agentClient, AgentServiceError } from "@/lib/agent-client"
import { rfToTwin } from "@/lib/server/twin"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { nodeId, description, nodes, edges, supplyChainId } = await req.json()
  if (!nodeId) return NextResponse.json({ error: "nodeId is required" }, { status: 400 })
  const twin = rfToTwin(nodes ?? [], edges ?? [], supplyChainId ?? "canvas")
  try {
    const plan = await agentClient.post("/reroute", { supply_chain_id: twin.supply_chain_id, failed_node_ids: [nodeId], twin })
    const sev = plan.severity === "CRITICAL" || plan.severity === "HIGH" ? "High" : plan.severity === "MEDIUM" ? "Medium" : "Low"
    const alternateRoutes = plan.candidates.filter((c: any) => c.feasible).slice(0, 3).map((c: any) => `${c.labels.join(" → ")} (+$${Math.round(c.added_cost)}, +${Math.round(c.added_days)}d)`)
    if (plan.infeasible_count > 0) alternateRoutes.push("Some lanes have no full bypass — see Decision Inbox (partial — full bypass unavailable)")
    return NextResponse.json({ severity: sev, impactDescription: `${plan.feasible_count} lane(s) can be rerouted, ${plan.infeasible_count} cannot. ${description ?? ""}`.trim(), alternateRoutes, candidates: plan.candidates, severed_pairs: plan.severed_pairs })
  } catch (e) {
    const status = e instanceof AgentServiceError ? 503 : 500
    return NextResponse.json({ error: "Agent service unavailable", detail: String((e as Error).message) }, { status })
  }
}
```

New routes:

```ts
// app/api/agent/incident/route.ts — SSE passthrough
import { NextRequest } from "next/server"
import { agentClient } from "@/lib/agent-client"
import { loadTwinForAgent } from "@/lib/server/twin"
export const maxDuration = 120
export async function POST(req: NextRequest) {
  const body = await req.json()  // { supplyChainId, userId, event, twin?, persist? }
  const twin = body.twin ?? (await loadTwinForAgent(body.supplyChainId))
  return agentClient.proxyStream("/incident", { supply_chain_id: body.supplyChainId, user_id: body.userId, event: body.event, twin, persist: body.persist ?? true })
}
```

```ts
// app/api/agent/chat/route.ts
import { NextRequest } from "next/server"
import { agentClient } from "@/lib/agent-client"
export const maxDuration = 60
export async function POST(req: NextRequest) {
  const { supplyChainId, userId, message, twin } = await req.json()
  return agentClient.proxyStream("/chat", { supply_chain_id: supplyChainId, user_id: userId, message, twin })
}
```

```ts
// lib/server/twin.ts
import { supabaseServer } from "@/lib/supabase/server"
export interface Twin { supply_chain_id: string; name: string; nodes: any[]; edges: any[] }
const num = (x: any, d = 0) => { const n = Number(x); return Number.isFinite(n) ? n : d }
export function rowsToTwin(id: string, name: string, nodes: any[], edges: any[]): Twin {
  return { supply_chain_id: id, name, nodes: nodes.map(n => ({ id: n.node_id, label: n.data?.label ?? n.name ?? n.node_id, type: n.type ?? n.data?.type ?? "warehouse", lat: n.location_lat, lng: n.location_lng, country: n.data?.country, capacity: num(n.capacity), risk_level: num(n.risk_level), data: n.data ?? {} })),
    edges: edges.filter(e => (e.from_node_id ?? e.data?.source) && (e.to_node_id ?? e.data?.target)).map(e => ({ id: e.edge_id, source: e.from_node_id ?? e.data?.source, target: e.to_node_id ?? e.data?.target, mode: e.data?.mode ?? "road", cost: num(e.data?.cost), transit_days: num(e.data?.transitTime ?? e.data?.transit_days), risk_multiplier: num(e.data?.riskMultiplier, 1) || 1 })) }
}
export function rfToTwin(nodes: any[], edges: any[], id: string): Twin {
  return { supply_chain_id: id, name: "canvas", nodes: nodes.map(n => ({ id: n.id, label: n.data?.label ?? n.id, type: n.type ?? "warehouse", lat: n.data?.lat ?? n.data?.location_lat, lng: n.data?.lng ?? n.data?.location_lng, country: n.data?.country, capacity: num(n.data?.capacity), risk_level: num(n.data?.riskLevel ?? n.data?.risk_level), data: n.data ?? {} })),
    edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, mode: e.data?.mode ?? "road", cost: num(e.data?.cost), transit_days: num(e.data?.transitTime), risk_multiplier: num(e.data?.riskMultiplier, 1) || 1 })) }
}
export async function loadTwinForAgent(id: string): Promise<Twin> {
  const [sc, n, e] = await Promise.all([
    supabaseServer.from("supply_chains").select("name").eq("supply_chain_id", id).single(),
    supabaseServer.from("nodes").select("*").eq("supply_chain_id", id),
    supabaseServer.from("edges").select("*").eq("supply_chain_id", id)])
  return rowsToTwin(id, sc.data?.name ?? "", n.data ?? [], e.data ?? [])
}
```

- [ ] After all rewrites: `npx tsc --noEmit` must be clean for `app/api/**` (pre-existing unrelated errors elsewhere may remain; list them). `pnpm build` must succeed.
- [ ] Commit `refactor(api): agent routes proxy to Strands agent-service`

### Task E3: Decisions table, API, and cron scan

**Files:**
- Create: `supabase/migrations/20260913_decisions.sql`, `app/api/decisions/route.ts`, `app/api/decisions/[id]/route.ts`, `app/api/cron/scan/route.ts`, `lib/decisions.ts`, `__tests__/decisions.test.ts`

- [ ] **SQL**

```sql
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, supply_chain_id text not null, event_id text,
  title text not null, summary text, options jsonb not null default '[]'::jsonb,
  recommended_option_id text, chosen_option_id text, rationale text, confidence numeric,
  sources jsonb default '[]'::jsonb, trace_id text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','snoozed','expired')),
  created_at timestamptz not null default now(), decided_at timestamptz, snoozed_until timestamptz
);
create index if not exists decisions_user_status_idx on public.decisions (user_id, status, created_at desc);
create table if not exists public.route_plans (
  id uuid primary key default gen_random_uuid(), decision_id uuid references public.decisions(id) on delete cascade,
  candidate_id text not null, path jsonb, labels jsonb, modes jsonb, cost numeric, transit_days numeric, added_cost numeric, added_days numeric, max_risk numeric, feasible boolean default true
);
create table if not exists public.alert_actions (
  id uuid primary key default gen_random_uuid(), notification_id uuid not null, user_id uuid,
  status text not null check (status in ('acknowledged','in_progress','resolved','reopened')), assignee text, note text, created_at timestamptz not null default now()
);
create index if not exists alert_actions_notification_idx on public.alert_actions (notification_id, created_at desc);
alter table public.decisions enable row level security; alter table public.route_plans enable row level security; alter table public.alert_actions enable row level security;
drop policy if exists decisions_owner on public.decisions; create policy decisions_owner on public.decisions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists route_plans_owner on public.route_plans; create policy route_plans_owner on public.route_plans for all using (exists (select 1 from public.decisions d where d.id = decision_id and d.user_id = auth.uid()));
drop policy if exists alert_actions_owner on public.alert_actions; create policy alert_actions_owner on public.alert_actions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
Apply it with the Supabase SQL editor (document in DEPLOYMENT.md) — the service role in agent-service bypasses RLS for inserts.

- [ ] **lib/decisions.ts** (client-side, uses `supabaseClient` under RLS): `listDecisions(userId, status?) -> DecisionRow[]` (select `*, route_plans(*)`), `decide(id, status, chosenOptionId?)`, `snooze(id, hours)`, and pure `summarizeOption(o: DecisionOption) -> string` (e.g. `"+$1,000 · +4d · low risk"`). Test `summarizeOption`.
- [ ] **API**: `GET /api/decisions?userId&status` (server, service role — used by demo/no-auth), `POST /api/decisions/[id] {status, chosenOptionId}` → updates row, sets `decided_at`, writes `audit_logs` entry `"Decision approved: <title> → <option label>"`, and when approved with a reroute option, calls agent-service `POST /invocations {action:"chat"...}`? No — call `POST /api/agent/memory` is out of scope; instead write a `notifications` row `notification_type:'decision'` "Reroute approved: …" so the feed shows it.
- [ ] **Cron**: `GET /api/cron/scan` with `Authorization: Bearer ${CRON_SECRET}`; iterates `supply_chains` (service role), skips chains scanned in the last 15 min (Redis key `scan:<id>` with TTL if Upstash is configured, else `agent_traces` lookup), calls agent-service `/scan` per chain with concurrency 2, returns `{scanned, results}`. Add `vercel.json`-style doc line for Cloud Scheduler in DEPLOYMENT.md.
- [ ] Commit `feat: decisions storage/API and server-driven scan cron`

## Phase F — UI

### Task F1: Decision Inbox page + header badge

**Files:**
- Create: `app/(main)/decisions/page.tsx`, `components/decisions/decision-inbox.tsx`, `components/decisions/decision-card.tsx`, `components/decisions/option-row.tsx`, `components/decisions/trace-drawer.tsx`, `components/ui/grounding-badge.tsx` (port from REROUTE), `lib/grounding.ts` (port from REROUTE)
- Modify: `components/app-sidebar.tsx` (add `{ href: "/decisions", icon: Inbox, label: "Decisions" }` after Dashboard), `components/layout/header-actions.tsx` (pending-count badge via `listDecisions(user.id,"pending").length`, poll every 30s)

**Behaviour:**
- Tabs: Pending / Decided. Empty state: "Nothing needs you right now — the agent is watching N supply chains." with last scan time from `agent_traces`.
- `DecisionCard`: severity stripe colour, title, summary, `GroundingBadge` (confidence, sources count, needs-review), affected nodes chips, `OptionRow` per option (radio, label, `summarizeOption`, "Recommended" pill on `recommended_option_id`), rationale block, buttons Approve (uses selected option, default recommended) / Reject / Snooze 24h, and "View on twin" link `/digital-twin/view/<supply_chain_id>?decision=<id>`.
- `TraceDrawer` (Sheet): fetches `agent_traces` where `session_id = trace_id`, lists agent_name, duration_ms, success in order; shows "Strands graph: analyst → routing_engine → router ∥ impact → strategist".
- Optimistic update on approve/reject; toast on success.
- Styling: use existing theme tokens (`bg-theme-bg-surface`, `text-theme-text-primary`, `border-theme-border-subtle`) found in `app/globals.css`; responsive (single column < 768px).

- [ ] Implement, `pnpm build`, manual check at `/decisions`, commit `feat(ui): decision inbox with grounding and trace drawer`

### Task F2: Incident view on the digital twin + agent activity panel

**Files:**
- Create: `components/digital-twin/incident/IncidentOverlay.tsx`, `components/digital-twin/incident/useIncident.ts`, `components/digital-twin/incident/RouteLegend.tsx`, `components/agent-activity/AgentActivityPanel.tsx`, `components/agent-activity/useGraphStream.ts`
- Modify: `components/digital-twin/canvas/ManualDisruptionDialog.tsx` (on confirm → `useIncident.start(event)`), `components/digital-twin/canvas/CustomNodes.tsx` (read `data.incidentState: 'failed'|'downstream'|'onRoute'|undefined` → pulse red / amber tint / green ring), `components/digital-twin/canvas/CustomEdges.tsx` (read `data.routeColor` and `data.routeLabel` → coloured animated edge with label), `components/digital-twin/layout/ControlTowerPanel.tsx` (mount `AgentActivityPanel` + `IncidentOverlay`), `app/(main)/digital-twin/view/[id]/page.tsx` (read `?decision=` and open overlay with that decision's route_plans)

**Interfaces:**
- `useGraphStream()` → `{ events: GraphEvent[], status: 'idle'|'running'|'done'|'error', start(path, body): Promise<result> }` using `fetch` + `parseSse` in the browser against `/api/agent/incident`.
- `useIncident({nodes, edges, setNodes, setEdges})` → `{ start(event: IncidentEvent), result, decision, selectRoute(candidateId), approve(), clear() }`. `start` calls `useGraphStream.start("/api/agent/incident", {...})`; on result it (a) marks failed/downstream nodes, (b) draws top-3 candidates by adding overlay edges `id: "route-<cid>-<i>"` with `data.routeColor` from `ROUTE_COLORS = ["#22c55e","#3b82f6","#a855f7"]`, (c) opens `IncidentOverlay` bottom sheet listing options; `approve()` → `POST /api/decisions/[id]`.
- `AgentActivityPanel` renders the event list as a vertical timeline with node names, spinners while running, elapsed ms, and a compact JSON payload toggle.

- [ ] Implement, verify manually: open a twin → right-click node → "Simulate disruption" → watch analyst → routing_engine → router/impact → strategist stream → routes drawn → approve → decision status approved. Commit `feat(ui): incident view with live route overlay and agent activity stream`

### Task F3: Alert actions, twin import, and copilot on the new chat endpoint

**Files:**
- Create: `lib/alert-actions.ts` (port), `components/dashboard/notification-feed/components/AlertActions.tsx` (port), `lib/import/twin-import.ts` (port), `components/digital-twin/forms/ImportTwinDialog.tsx` (port), `__tests__/twin-import.test.ts` (port REROUTE's `tests/twin-import.test.ts`)
- Modify: `components/dashboard/notification-feed/notification-feed.tsx` (render `AlertActions` + `GroundingBadge` per alert; remove client-side polling of `/api/agent/news-polling` and `/automated-alerts` intervals — replace with a single "Scan now" button calling `/api/agent/automated-alerts` and a "last scan" label), `components/digital-twin/layout/DigitalTwinToolbar.tsx` (Import button), `components/digital-twin/layout/left-panel/assistant/AIChatPanel.tsx` and `components/copilot/ISCA/ISCAChat.tsx` (send to `/api/agent/chat`, render streamed tokens and tool chips; drop `@ai-sdk/google` usage)
- Delete: `app/api/copilotkit-digital-twin` if unused after the change; keep `app/api/copilotkit` only if `components/copilot/copilot-provider.tsx` still needs it, otherwise delete both and the CopilotKit deps.

- [ ] Port with `sed 's/REROUTE/SupplyChain AI/g'` where branding appears; run `pnpm test`; `pnpm build`; commit `feat(ui): alert actions, CSV/Excel twin import, streaming copilot`

### Task F4: Public `/demo` and landing page refresh

**Files:**
- Create: `app/demo/page.tsx`, `components/demo/DemoTwin.tsx`, `lib/demo-twin.ts`, `app/api/demo/incident/route.ts`
- Modify: `app/page.tsx` + `components/home-page/*` (hero copy, three feature cards: "Watches 24/7", "Computes the reroute", "Asks only when it matters"; CTA "Try the live demo" → `/demo`; badge "Built with Strands Agents"), `components/landing-header.tsx`

**`lib/demo-twin.ts`** — a `Twin` with nodes: `shenzhen` (factory, CN, 22.54/114.06, capacity 100, risk 2), `singapore` (port, SG, 1.29/103.85, cap 80), `colombo` (port, LK, 6.93/79.85, cap 60, risk 3), `suez` (port, EG, 30.0/32.5, cap 70, risk 4), `capetown` (port, ZA, -33.9/18.4, cap 50), `rotterdam` (port, NL, 51.9/4.5, cap 90), `hamburg` (port, DE, 53.5/10.0, cap 80), `berlin` (warehouse, DE, 52.5/13.4, cap 100); edges: shenzhen→singapore sea 1000/5, singapore→suez sea 2500/12, suez→rotterdam sea 1500/8, shenzhen→colombo sea 1500/7, colombo→suez sea 2200/11, suez→hamburg sea 1600/9, colombo→capetown sea 3000/16, capetown→rotterdam sea 3500/18, rotterdam→berlin road 300/1, hamburg→berlin road 200/1, plus React Flow positions for the canvas. Export both `demoTwin` (agent shape) and `demoArch` (React Flow shape).

**`app/api/demo/incident/route.ts`** — no auth; `persist:false`; user_id `"demo"`; passes `demoTwin` inline so no DB is needed; rate-limit 5/min per IP in memory.

**`DemoTwin.tsx`** — read-only canvas with `demoArch`, three preset buttons ("Port of Singapore closed", "Suez Canal blocked", "Typhoon at Shenzhen") that each build an `IncidentEvent` and call `useIncident` against `/api/demo/incident`; right side shows `AgentActivityPanel`; result shows the decision card inline (from the SSE result, not DB) with approve → local state "Approved ✓ — in production this writes to your Decision Inbox". Header links to `/signin`.

- [ ] Implement, `pnpm build`, verify `/demo` works logged out, commit `feat: public no-login demo and landing refresh`

## Phase G — Submission artifacts

### Task G1: License, env example, README, architecture docs

**Files:**
- Create: `LICENSE` (MIT, "Copyright (c) 2026 Prashant Thakur"), `.env.example` (all keys from README + `AGENT_SERVICE_URL`, `AGENT_SERVICE_SECRET`, `CRON_SECRET`), `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/architecture.mmd`
- Rewrite: `README.md`

README sections in order: hero (name, one-liner, badges: Strands Agents · MIT · Live demo · Video), **Try it in 30 seconds** (demo URL + video URL placeholders filled at G3), **The problem / Who it's for / Why it matters**, **What the agent does** (background loop → decision inbox, with a screenshot placeholder path `docs/img/decision-inbox.png`), **Architecture** (Mermaid diagram from `docs/architecture.mmd` inline + link to PNG), **How Strands is used** (table: agent → tools → structured output → where it runs; GraphBuilder graphs; hooks; provider switch; AgentCore contract), **Deterministic core** (why the LLM never computes routes), **Run locally** (web + agent-service), **Environment variables**, **Deploy** (Cloud Run; AgentCore section), **Tests**, **Disclosure** ("The digital-twin canvas and Supabase schema come from the author's earlier open-source work; the Strands agent service, routing engine, decision inbox, incident view, demo and docs were built during the hackathon."), **License**.

Mermaid (`docs/architecture.mmd`):
```mermaid
flowchart LR
  subgraph Browser
    UI[Digital twin · Decision Inbox · Demo]
  end
  subgraph Web["Next.js 16 (Cloud Run)"]
    API[/api/agent/* proxies/]
    CRON[/api/cron/scan/]
    DEC[/api/decisions/]
  end
  subgraph Agents["agent-service — Strands Agents (Python)"]
    S[Sentinel] --> A[Analyst]
    A -->|severity ≥ HIGH| RE[Routing engine\nDijkstra · Yen k-best]
    RE --> R[Router] & I[Impact]
    R --> ST[Strategist]; I --> ST
    ST --> D[Decision]
    C[Copilot]; F[Forecaster]; SC[Scenario]
  end
  subgraph Data[Supabase Postgres + RLS]
    T[(twins · notifications · decisions · route_plans · agent_traces · audit_logs)]
  end
  Ext[Tavily · OpenWeather · Mem0]
  Model{{Gemini 2.5 Flash | Bedrock Claude — env switch}}
  UI --> API & DEC; CRON --> Agents; API --> Agents; Agents --> T; Web --> T; Agents --> Ext; Agents --> Model
```
Render PNG: `npx -y @mermaid-js/mermaid-cli -i docs/architecture.mmd -o docs/architecture.png` (if puppeteer fails, keep the Mermaid block; GitHub renders it).

- [ ] Commit `docs: license, README rewrite, architecture and deployment docs`

### Task G2: Devpost text, video script, deck, builder post

**Files:**
- Create: `docs/submission/DEVPOST.md` (both hackathons: project name, tagline, inspiration, what it does, how we built it, challenges, accomplishments, what we learned, what's next, built-with list, track = Professional Agents), `docs/submission/VIDEO_SCRIPT.md` (5-minute script with timestamps: 0:00 problem, 0:40 who/why, 1:10 demo: /demo → Singapore closed → agent stream → routes drawn → decision approved, 3:10 Strands architecture walk-through with diagram, 4:10 background loop + inbox, 4:40 close), `docs/submission/DECK.md` (10 slides per AI Builders list) and `docs/submission/deck.html` (self-contained HTML slides, arrow-key navigation, printable), `docs/submission/BUILDER_POST.md` (title "Agents for Humans: Building an autonomous supply-chain resilience agent with Strands"; sections: the problem, why Strands (Graph, tools, structured output, hooks), the deterministic-core decision, provider switch to Bedrock/AgentCore, lessons).
- Commit `docs(submission): devpost text, video script, deck, builder post`

### Task G3: Deploy and verify

- [ ] Add `agent-service` deploy to `package.json` scripts: `"deploy:agents": "gcloud run deploy supplychain-agents --source agent-service --region us-central1 --allow-unauthenticated --port 8080 --env-vars-file=agent-service/.env.yaml"`; update `deploy:gcp` image names to `supplychain-ai`.
- [ ] Create `agent-service/.env.yaml` from `.env` (gitignored; add `*.env.yaml` to `.gitignore`).
- [ ] Deploy agent-service, set `AGENT_SERVICE_URL` in web `.env.yaml`, deploy web. Create Cloud Scheduler job hitting `/api/cron/scan` every 15 min with the bearer secret.
- [ ] Verify in production: `/ping`, `/demo` full flow, `/decisions` after a manual disruption, cron endpoint returns 200.
- [ ] Fill live URLs into README + DEVPOST; commit `chore: production deploy config and live URLs`; push `main`.

---

## Self-review

- Spec coverage: §3.1 (A1–D1), §3.2 (A3), §3.3 (E1–E3), §3.4 items 1–5 (F1–F4), §3.5 (E3 cron + D1 `/scan`), §3.6 (D1 error frames, E2 503s, router fallback ordering in C1), §3.7 (tests in A–E), §4 (G1–G3). No DataHub. ✔
- Types: `Twin/TwinNode/TwinEdge` (A2) used by A3/A4/B1/E2 `rowsToTwin` mirror; `RouteCandidate` fields identical in `schemas.py` and `types/agent.ts`; `GraphEvent.type` values identical in both; `Decision.recommended_option_id` validated in A2 and honoured in C2 `build_decision`. ✔
- Placeholders: none — README screenshot path and live URLs are explicitly filled in G3.
