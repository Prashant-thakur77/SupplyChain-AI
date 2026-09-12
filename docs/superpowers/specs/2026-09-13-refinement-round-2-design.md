# Refinement round 2 — design

Date: 2026-09-13 · Status: approved (delegated)

1. **Learning loop** — `POST /memory` on agent-service (`store_memory`); web `/api/decisions/[id]` calls it on approve/reject with
   a one-line outcome. Analyst memories are returned in `IncidentResult.memories` and shown on the decision card as
   "Last time this happened". Demo shows the section when memories exist.
2. **Live Sentinel in the demo** — agent-service `POST /sentinel` returns candidate `Event`s only (no incident). Web
   `/api/demo/scan` runs it on the demo twin; the demo sidebar lists found events with "Run incident graph".
3. **Copilot multi-turn** — `ChatIn.history: [{role, text}]`; server builds `Agent(messages=…)` with
   `SlidingWindowConversationManager(window_size=20)`. `StrandsChat` sends its message list.
4. **Agent status** — `GET /api/agent/status` (ping + last scan per twin + pending decisions); dashboard widget
   `components/dashboard/AgentStatusCard.tsx`; header dot `components/layout/agent-health-dot.tsx`.
5. **Screenshots + README** — `docs/img/{demo-run,decision-card,trace,copilot}.png` captured with Playwright; README
   embeds them; mobile pass on `/demo` and `/decisions`.
6. **Hygiene** — `lib/twin-mapping.ts` (pure) + tests; per-node graph task text; `strands_tools.current_time` in
   Sentinel; pytest for `lanes_through` (multi source/sink, cyclic, edge failure).
