# Architecture

SupplyChain AI is two services and one database.

```
Browser ──▶ Next.js 16 (web) ──HTTP/SSE──▶ agent-service (Python · FastAPI · Strands Agents)
               │                                 │
               └──────────── Supabase Postgres ◀─┘
```

## 1. agent-service (Python)

Everything that talks to a model lives here. It is a library-style Strands application behind FastAPI, and it also
implements the Amazon Bedrock AgentCore Runtime contract so it can be hosted there without changes.

```
agent-service/
  app.py              FastAPI routes + /invocations (AgentCore) + SSE streaming
  agentcore_entry.py  BedrockAgentCoreApp wrapper (agentcore configure -e agentcore_entry.py)
  config.py           settings from env (provider, keys, Supabase, Tavily, OpenWeather, Mem0)
  models.py           make_model(role) → GeminiModel | BedrockModel; invoke_with_retry (key rotation → model fallback)
  schemas.py          Pydantic models: Twin, Event, Assessment, RouteCandidate, RouteRanking, ImpactEstimate,
                      MitigationPlan, Decision, Forecast, Scenario, GraphEvent + UI report shapes
  routing.py          deterministic graph math (see §3)
  db.py               Supabase (service role): twin loading, notifications, decisions, traces, audit
  tracing.py          Strands HookProvider → agent_traces rows
  tools/              @tool functions: twin (load, blast radius, reroutes, impact baseline),
                      intel (Tavily news, OpenWeather), memory (Mem0), persistence
  agents/             one module per agent: sentinel, analyst, router, impact, strategist,
                      forecaster, scenario, copilot, reports (UI report agents), suggestions
  graphs/incident.py  the incident pipeline (§2)
  graphs/analysis.py  on-demand deep dive: intel → forecast ∥ scenario → strategy → report
```

### Endpoints

| Route | Kind | Purpose |
|---|---|---|
| `GET /ping` | JSON | health (AgentCore requirement) |
| `POST /invocations` | JSON | AgentCore entrypoint; `action` selects a handler |
| `POST /scan` | JSON | Sentinel → incident graph for one twin (background loop) |
| `POST /incident` | SSE | incident graph for an explicit event; streams `GraphEvent`s, final frame = `IncidentResult` |
| `POST /incident/sync` | JSON | same, non-streaming |
| `POST /analysis`, `/analysis/sync` | SSE/JSON | analysis graph |
| `POST /chat` | SSE | copilot (`token` / `tool` / `final` frames) |
| `POST /reroute` | JSON | routing engine only (no LLM) |
| `POST /forecast`, `/scenario`, `/impact`, `/strategy`, `/weather`, `/suggestions` | JSON | single agents |
| `POST /reports/{simulation,strategy,forecast,live-intel}` | JSON | report agents feeding existing UI screens |

Auth: header `x-agent-secret` must equal `AGENT_SERVICE_SECRET` when set.

## 2. The incident graph

```
event ──▶ Analyst ──[severity ≥ HIGH]──▶ routing engine ──▶ Strands Graph ──▶ Decision
              │                                              router ∥ impact → strategist
              └──[LOW/MEDIUM]──▶ notification only (nobody interrupted)
```

1. **Analyst** (Strands `Agent`, tool `compute_blast_radius`) returns an `Assessment`: severity, confidence,
   `failed_node_ids` (what is actually down) vs `affected_node_ids` (downstream), sources, `needs_review`.
2. **Gate** — `severity_gate()`; below `HIGH` the event becomes a notification and the run ends.
3. **Routing engine** — `reroute_plan(twin, failed_nodes, failed_edges)` (pure Python).
4. **Strands Graph** (`GraphBuilder`): `router` and `impact` are entry points and run in parallel; both feed
   `strategist`. Every node is built with `structured_output_model`, so `result.results[node].result.structured_output`
   is a typed object. The execution order and token usage are streamed to the UI.
5. **Decision** — `build_decision()` turns the ranking, impact and plan into `DecisionOption`s (top reroutes, wait,
   mitigate) with a recommendation, then `db.insert_decision` persists it (`decisions` + `route_plans`).

Failure handling: any transient provider error is retried with key rotation and model fallback (`models.py`).
If the Graph still fails, each node falls back to a single structured call; if *that* fails the decision is built from
the deterministic candidates with `confidence ≤ 0.5` so the UI shows **Needs review**.

## 3. Deterministic routing (`routing.py`)

- `build_graph(twin)` — directed adjacency from `TwinEdge`s (cost, transit_days, risk_multiplier).
- `shortest_path` — Dijkstra with node/edge avoidance.
- `blast_radius` — downstream reachability from the failure, broken edges, severed predecessor/successor pairs.
- `lanes_through` — the **origin→destination lanes** (source nodes with no inbound edges → sinks with no outbound edges)
  whose healthy shortest path crosses the failure. This is what an operator reroutes ("Shenzhen → Berlin"), not a
  local segment.
- `k_best_routes` — Yen's k-shortest loopless paths avoiding the failure; each candidate carries exact
  `added_cost` / `added_days` vs the healthy baseline and `max_risk` along the path.
- `network_stats` / `monte_carlo_cascade` — single points of failure, density, cascade probabilities (simulation reports).

The LLM receives these candidates as text and only ranks/explains them; ids not in the feasible set are discarded
(`agents/router.py`).

## 4. Web app (Next.js)

- `app/api/agent/*` — proxies. Legacy routes keep their response shapes (`impact`, `strategy`, `forecast`, `scenario`,
  `orchestrator`, `live-intelligence`, `route-optimization`, `automated-alerts`, `weather-intelligence`) so older screens
  keep working; new routes (`incident`, `chat`, `analysis`, `reroute`) stream SSE straight through.
- `app/api/decisions` — list; `app/api/decisions/[id]` — approve/reject/snooze (+ audit log + notification).
- `app/api/cron/scan` — idempotent background loop (skips twins scanned in the last 15 min; concurrency 2).
- `lib/agent-client.ts` — server-side client; `lib/sse.ts` — CRLF-safe SSE parser shared with the browser.
- UI: `components/decisions/*` (inbox, card, trace drawer), `components/digital-twin/incident/*` (overlay, route
  edges, `useIncident`), `components/agent-activity/*` (stream hook + timeline), `components/copilot/StrandsChat.tsx`,
  `app/demo` (public, DB-less; twin passed inline).
- The canvas owns React Flow state; the incident overlay is kept in the zustand store (`overlayEdges`, `nodeStates`)
  and merged at render time.

## 5. Data

Supabase Postgres with RLS. New tables (`supabase/migrations/20260913_decisions.sql`): `decisions`, `route_plans`,
`alert_actions`. Existing: `supply_chains`, `nodes`, `edges`, `notifications`, `forecasts`, `simulations`,
`agent_traces`, `audit_logs`. The agent-service uses the service role (server-to-server); the browser uses the anon key
under RLS.

## 6. Scaling notes

- Both services are stateless; Cloud Run scales horizontally. The routing engine is in-process and sub-millisecond on
  realistic twins.
- The background loop is server-driven and idempotent (dedup by event fingerprint in `notifications.citations`, cooldown
  by `agent_traces`), so it is safe across instances and restarts.
- Model spend is bounded: the LLM only ranks/explains; large reports use JSON mode; per-role temperature and token caps
  live in `models.py`.

## A2A — other agents talk to SupplyChain AI

The agent-service mounts a Strands `A2AServer` at `/a2a` (agent card at `/a2a/.well-known/agent-card.json`). The **Lane Assessor** agent
answers `assess_lane` ("is Shenzhen → Rotterdam safe?"), `what_if` (blast radius + exact reroutes) and `resilience` using the same
deterministic engine the incident graph uses. Calls need an org API key (`x-api-key`, issued on the Team page, stored hashed).

```bash
curl -X POST https://<agent-service>/a2a/ -H "x-api-key: sca_…" -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"message/send","params":{"message":{"role":"user","messageId":"m1","parts":[{"kind":"text","text":"On supply chain <id>, is Port of Singapore -> Port of Rotterdam safe?"}]}}}'
```


## Deterministic modules added in phases B–D

| Module | What it decides | Where it runs |
|---|---|---|
| `inventory.py` | whether "wait and monitor" is survivable: days of cover vs expected outage (+2d safety margin) — overrides the Router's judgement | incident graph stage `inventory` |
| `contracts.py` | SLA penalties on affected sites: `max(0, delay − grace) × $/day`, capped; attached to `ImpactEstimate.contract_penalties_usd` | incident stage `contracts`; Impact tool `contract_exposure`; `/contracts/parse` (Contracts agent) |
| `playbooks.py` | which org playbook applies (trigger keywords → category); rendered into the Strategist prompt | incident graph task; `/playbooks/catalog` |
| `calibration.py` | median actual/estimated ratio from `decision_outcomes` (≥3 samples, clamped 0.5–2.0) applied to *estimated* lanes | `twin_cache.get` |
| `benchmark.py` | resilience percentile vs anonymised peers + reference distribution by size band | `/resilience` |
| `demand.py` | demand shock coupled to flows: lane saturation, cost to serve, stock-out timing | `/demand-shock` |
| `routing.objective` | ranking objective `added_cost + carbon_weight × tCO₂e × carbon_price` (policy) | `reroute_plan` |
| `tools/feeds.py` | GDACS / USGS / NWS hazards filtered to the twin's sites | Sentinel tools |
| `tools/lanes.py` | `assess_lane`, `network_resilience` | Lane Assessor (A2A) + copilot |

Web-side: `lib/connectors/*` (ERP/TMS presets → canonical rows → upsert), `lib/tracking/providers.ts` (shipment tracking interface; mock + carrier webhook), `lib/push/server.ts` (web push), region-aware `lib/agent-client.ts`.
