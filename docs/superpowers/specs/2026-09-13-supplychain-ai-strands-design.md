# SupplyChain AI — Strands Agent Platform Design

Date: 2026-09-13
Status: approved

## 1. Purpose

Turn the existing supply-chain digital-twin app into an autonomous resilience
agent built on the Strands Agents SDK, for submission to:

- **Agents for Humans** (AWS/Devpost, Professional Agents track) — must be built
  with Strands; MIT/Apache license; README; architecture diagram; ≤5 min video;
  AgentCore optional but scored.
- **AI Builders Hackathon** (OSC/Devpost) — working product, public repo, video,
  10-slide deck.

Both rule sets require the project to be created during the submission period.
The agent layer, decision engine, routing engine, and new UI are new; the twin
canvas and Supabase schema predate them. The README discloses this explicitly.

## 2. Product

**User:** operations / logistics managers at small and mid-size manufacturers and
importers.

**Promise:** the agent watches the network 24/7 (news, weather, ports,
suppliers). When something happens it computes the blast radius, finds the
cheapest viable reroute, drafts the mitigation, and only surfaces a **decision**:
ranked options with cost / time / risk deltas and an approve button. Everything
else happens in the background.

**Name:** SupplyChain AI (repo `Prashant-thakur77/SupplyChain-AI`). No PRISM
references anywhere.

## 3. Architecture

```
Browser ──▶ Next.js 16 (Cloud Run) ──HTTP/SSE──▶ agent-service (Python, FastAPI + Strands)
                │                                     │  Cloud Run now; AgentCore-compatible
                └──────── Supabase (Postgres, RLS) ◀──┘  (/invocations + /ping)
                                                      ├─ GeminiModel (default, existing keys)
                                                      └─ BedrockModel (env switch)
```

### 3.1 agent-service (Python 3.10+, `agent-service/`)

Layout:

```
agent-service/
  pyproject.toml            strands-agents[gemini], strands-agents-tools, fastapi, uvicorn,
                            pydantic, httpx, supabase, mem0ai, bedrock-agentcore (optional)
  app.py                    FastAPI app; routes below; also exposes /invocations + /ping
  agentcore_entry.py        BedrockAgentCoreApp wrapper reusing the same handlers
  config.py                 env: AGENT_MODEL_PROVIDER=gemini|bedrock, keys, Supabase, Tavily…
  models.py                 make_model(role) -> GeminiModel | BedrockModel
  tracing.py                Strands hooks -> agent_traces / audit_logs tables
  db.py                     Supabase client (service role) + typed helpers
  routing.py                deterministic graph: blast radius, weighted Dijkstra, k-best routes
  schemas.py                Pydantic structured-output models shared by agents + API
  tools/
    twin.py                 load_twin, compute_blast_radius, find_reroutes, estimate_impact
    intel.py                search_news (Tavily), get_weather (OpenWeather)
    memory.py               recall_memory, store_memory (Mem0)
    persistence.py          persist_notification, create_decision, record_route_plan
  agents/
    sentinel.py             scans news/weather for a twin; emits candidate events
    analyst.py              correlates an event to nodes/edges; severity, confidence, sources
    router.py               ranks candidate reroutes (cost/time/risk); recommends one
    impact.py               quantitative impact (revenue at risk, delay days, nodes affected)
    strategist.py           mitigation plan + steps + owners
    forecaster.py           7/30/90-day risk forecast
    scenario.py             what-if scenario generation
    copilot.py              chat agent with the tools above (agents-as-tools)
  graphs/
    incident.py             GraphBuilder: sentinel → analyst →[severity≥HIGH]→ (router ∥ impact) → strategist → decision
    analysis.py             GraphBuilder: intel → forecast → scenario → impact → strategy (on-demand deep dive)
  tests/                    pytest: routing, schemas, graph wiring (mocked model)
  Dockerfile                linux/amd64 for Cloud Run; arm64 build arg for AgentCore
```

HTTP API (JSON; SSE where noted):

| Route | Purpose |
|---|---|
| `GET /ping` | health (AgentCore requirement) |
| `POST /invocations` | AgentCore entrypoint; dispatches on `payload.action` |
| `POST /scan` | run Sentinel + incident graph for one supply chain (background loop) |
| `POST /incident` | run incident graph for an explicit event (manual disruption / demo) — SSE stream of graph events, final result |
| `POST /analysis` | run analysis graph for a query — SSE |
| `POST /reroute` | deterministic k-best reroutes around failed node(s) |
| `POST /impact` | impact agent |
| `POST /strategy` | strategist |
| `POST /forecast` | forecaster |
| `POST /scenario` | scenario agent |
| `POST /chat` | copilot — SSE |
| `POST /weather` | weather sweep for a twin |

Every agent uses `structured_output_model` (Pydantic). Every run is wrapped by
hooks that write `agent_traces` (session, agent, duration, tokens, success) and
`audit_logs`. Model temperature per role is centralised in `models.py`.

Model provider: `AGENT_MODEL_PROVIDER=gemini` uses `GeminiModel(gemini-2.5-flash)`
with the existing `GOOGLE_API_KEY*` keys. `bedrock` uses
`BedrockModel(us.anthropic.claude-sonnet-4-6 | us.amazon.nova-pro-v1:0)`.
Nothing else changes.

### 3.2 Deterministic routing (`routing.py`)

Ported from REROUTE `lib/routing.ts` and extended:

- Graph built from twin `nodes` + `edges`; edge weight = cost (USD) with a
  configurable time weight; edges carry `mode`, `cost`, `transitDays`,
  `riskMultiplier`, `capacity`.
- `blast_radius(failed_ids)` — downstream reachability from failed nodes/edges.
- `k_best_routes(origin, dest, failed, k=3)` — Yen's algorithm on Dijkstra;
  returns paths with total cost, total days, max risk, delta vs baseline.
- Never done by the LLM: the Router agent receives computed candidates and
  produces the ranking + rationale only.

### 3.3 Next.js changes

- Delete `@google/adk`, `@iqai/adk`, `lib/adk`, `lib/zod-patch.ts`, `lib/zod-shim.ts`,
  and the ADK-based bodies of `app/api/agent/*`.
- `app/api/agent/*` routes keep their paths; bodies become thin proxies to
  agent-service (`lib/agent-client.ts`), forwarding user/session context and
  streaming SSE through where relevant. Existing UI call sites keep working.
- `app/api/cron/scan` — idempotent server-driven scan (Cloud Scheduler target),
  iterates supply chains, calls agent-service `/scan`, respects cooldowns via
  Redis. Secured with `CRON_SECRET`.
- `app/api/decisions` — list / approve / reject / snooze.
- New Supabase migration (`supabase/migrations/…_decisions.sql`):
  `decisions` (id, supply_chain_id, user_id, event_id, title, summary, options
  jsonb, recommended_option_id, chosen_option_id, status
  pending|approved|rejected|snoozed|expired, rationale, trace_id, created_at,
  decided_at), `route_plans` (id, decision_id, path jsonb, cost, days, risk),
  `alert_actions` (from REROUTE: acknowledge / assign / resolve with audit).
  All RLS-scoped to `user_id`.

### 3.4 UI

1. **Decision Inbox** — `/decisions` page + header badge with pending count.
   Card: title, affected nodes, ranked options (cost Δ, days Δ, risk), agent
   rationale, sources/confidence badge, approve / reject / snooze, expandable
   Strands execution trace (graph node order + durations).
2. **Incident view on the digital twin** — failed node pulses red, blast radius
   nodes tinted, candidate routes drawn as distinct coloured edges with labels;
   clicking a route selects it and approves the decision.
3. **Agent activity panel** — live SSE stream of graph node execution
   (sentinel → analyst → router …) with status and elapsed time.
4. **Ported from REROUTE**: grounding badge, alert actions, CSV/Excel twin
   import dialog, page-header, landing/motion polish.
5. **`/demo`** — public, no login. Seeded electronics-importer twin (Shenzhen →
   Singapore → Rotterdam → Berlin, with Colombo / Suez alternates). A
   "Simulate: Port of Singapore closure" button runs the incident graph live
   and lands in the Decision Inbox. This is the video path.

### 3.5 Background loop

Cloud Scheduler → `GET /api/cron/scan` (every 15 min) → agent-service `/scan`
per twin → Sentinel finds candidate events (Tavily + OpenWeather) → Analyst
grades → if severity ≥ HIGH the incident graph continues to a decision;
otherwise a notification is stored. Dedup by event fingerprint in Redis + DB.

### 3.6 Error handling

- Provider errors / 429 → retry once with backoff, then fall back to the
  deterministic result (reroute candidates without LLM ranking, flagged
  `needs_review=true`). The UI shows the grounding badge in "needs review".
- Tool errors return `{status:"error"}` and the agent continues; graph nodes
  never raise into the HTTP layer — the API returns `status: partial` with
  what completed.
- Agent-service unreachable → Next.js proxies return 503 with a clear message;
  UI shows a banner.

### 3.7 Testing

- pytest: `routing.py` (blast radius, Dijkstra, k-best, deltas), schemas,
  graph wiring with a mocked model, API smoke via `TestClient`.
- vitest: twin import parser, decision reducer, agent-client SSE parser.
- Manual: `/demo` end-to-end before recording the video.

## 4. Submission artifacts

- `LICENSE` (MIT)
- `README.md` rewritten: what / who / why, architecture diagram (Mermaid +
  `docs/architecture.png`), Strands usage section, setup, env, disclosure.
- `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `.env.example`
- `docs/submission/DEVPOST.md` (both hackathons' text), `VIDEO_SCRIPT.md`,
  `DECK.md` (10 slides) + HTML deck, `BUILDER_POST.md` (builder.aws.com draft
  titled "Agents for Humans: …").
- Deploy: agent-service + web to Cloud Run (`deploy:gcp` updated); AgentCore
  deploy instructions ready for when an AWS account exists.

## 5. Out of scope

Supabase replacement, twin canvas rewrite, DataHub integration, all-AWS
migration, the external ML risk-prediction repo (route stays optional).
