# Devpost submission copy

Use the same project for both hackathons; the sections map onto each form.

## Project name
SupplyChain AI

## Tagline (≤ 60 chars)
The supply-chain agent that only interrupts you with a decision.

## Track (Agents for Humans)
Professional Agents

## Inspiration
Every operations manager we have talked to at a small manufacturer or importer finds out about a port closure, a strike or a typhoon the same way: from the news, usually at the wrong time. Then a full day goes to spreadsheets — what does it hit, what do the alternatives cost, who do I call. It is repetitive, judgement-heavy work that a person shouldn't have to *start* from zero every time. We wanted an agent that does the watching and the arithmetic in the background and shows up once, with the decision already framed.

## What it does
SupplyChain AI models a company's network as a digital twin (build it on a canvas or import CSV/Excel) and runs an autonomous agent over it:

- **Sentinel** scans news and weather for every node and lane, every 15 minutes, server-side.
- **Analyst** grades each event against *your* twin — severity, confidence, blast radius. Below HIGH it is just logged; nobody is pinged.
- A deterministic **routing engine** (Dijkstra, Yen k-shortest) computes the real alternate lanes with exact added cost and days. The LLM never invents a route.
- **Router ∥ Impact → Strategist** run as a Strands Graph and produce a ranked set of options, revenue at risk, and an executable mitigation plan.
- The result is one card in the **Decision Inbox**: *Reroute via Colombo (+$1,000, +5 days, low risk) · Wait · Mitigate*, with the recommendation, rationale, sources and a confidence badge. Approve, reject or snooze. The agent records it, notifies the team, and remembers it.

There is also a streaming copilot ("what if Suez is blocked?") that calls the same tools, and a public no-login demo at `/demo` where you can fail a port and watch the graph run.

## How we built it
- **Strands Agents SDK (Python)** for every model call: ten agents with `@tool`s and Pydantic `structured_output_model`s; two multi-agent graphs with `GraphBuilder` (incident: `router ∥ impact → strategist`; analysis: `intel → forecast ∥ scenario → strategy → report`); hooks (`BeforeInvocationEvent`/`AfterInvocationEvent`) writing one `agent_traces` row per run; `Agent.stream_async` for the copilot; `A2AServer` exposes a Lane Assessor agent to other agents over the Agent-to-Agent protocol.
- **Provider switch**: `AGENT_MODEL_PROVIDER=gemini|bedrock|openai|ollama` — `GeminiModel`, `BedrockModel`, Groq/xAI via `OpenAIModel`, or a local `OllamaModel` with one env var. Retry rotates keys then falls back across models on 429/503.
- **AgentCore-ready**: the service implements `POST /invocations` + `GET /ping`, with a `BedrockAgentCoreApp` entrypoint.
- **Deterministic core**: `routing.py` — blast radius, end-to-end lane detection, k-best reroutes, flow-weighting, carbon objective, Monte Carlo cascade; `inventory.py` (can we wait?), `contracts.py` (SLA penalties), `resilience.py` (audit + benchmark), `demand.py` (demand shocks), `calibration.py` (learn from recorded outcomes) — all unit-tested, no model in the loop.
- **Web**: Next.js 16, React Flow twin + Leaflet/OSM map, Supabase (RLS, orgs & roles), SSE streaming from the agents to the browser, Decision Inbox with autonomy policy, execution checklists and recorded outcomes, Slack one-click approvals, web push (PWA), ERP/TMS connectors (SAP/NetSuite/Odoo/CSV/REST), shipments in flight, rate cards & carrier quotes, contracts & SLAs, playbooks, Agent Ops with estimate accuracy.

## Challenges
- Free-tier model quotas are tiny; we built key rotation + model fallback and a JSON-mode fallback for large nested schemas that Gemini's function-calling path rejects.
- "Affected" ≠ "failed": the analyst initially listed downstream nodes as failed and the engine had nothing to reroute. Splitting the two fields fixed the whole pipeline.
- Rerouting a local segment produced meaningless "+$0" candidates; we switched to end-to-end lanes whose baseline path crosses the failure.
- Keeping the LLM honest: candidates are computed first and injected; the Router can only rank ids that exist.

## Accomplishments
A complete loop — watch → assess → compute → decide → approve → remember — that runs end-to-end live in about 30 seconds, with every step traced and every number exact.

## What we learned
Strands' Graph + typed outputs make multi-agent pipelines debuggable: you can read the execution order and each node's object. The best agent products do most of their work silently.

## What's next
Bedrock/AgentCore deployment with the same container; a real AIS/vessel-tracking provider behind the existing tracking interface; production tenants so the anonymised benchmark and the outcome calibration become statistically meaningful; a marketplace for third-party Sentinel tools and playbooks.

## Built with
Strands Agents SDK · Python · FastAPI · Pydantic · Amazon Bedrock (provider) · Gemini · Next.js 16 · React Flow · Supabase · Tavily · OpenWeather · Mem0 · Google Cloud Run

## Links
- Repo: https://github.com/Prashant-thakur77/SupplyChain-AI (MIT)
- Live demo: `https://supplychain-ai-nine.vercel.app/demo`
- Video: https://youtu.be/JAJdO3QHyts
- builder.aws blog post (bonus): https://builder.aws.com/post/3JJBfcbc8A4VmCn2v48hRMVwUs3_p/agents-for-humans-a-supply-chain-resilience-agent-built-with-strands-agents-on-amazon-bedrock
- Architecture diagram: `docs/architecture.png`

## AI Builders Hackathon — extra fields
- **Target users**: operations / logistics managers at SMB manufacturers and importers (5–50 suppliers, no control tower).
- **Product features**: digital twin (canvas + CSV import), background Sentinel scans, Decision Inbox, incident view with exact reroutes, streaming copilot, simulation & forecast reports, audit trail + traces.
- **AI technologies**: Strands Agents (multi-agent Graph, tools, structured outputs, hooks), Gemini / Bedrock models, Mem0 memory, Tavily search.
- **Impact**: replaces the "find out from the news, spend a day in spreadsheets" loop with a 30-second decision; one avoided stock-out week pays for years of the product.
- **Roadmap**: see *What's next*.
