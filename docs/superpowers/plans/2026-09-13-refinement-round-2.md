# Refinement round 2 — plan

Spec: docs/superpowers/specs/2026-09-13-refinement-round-2-design.md. Constraints as in the round-1 plan.

- [ ] R1 Hygiene first (tests exist before features touch the code): `lanes_through` tests; per-node task text in `graphs/incident.py`; `current_time` in Sentinel; `lib/twin-mapping.ts` + vitest; `lib/server/twin.ts` re-exports.
- [ ] R2 Memory loop: `db`/tools `store_memory` → `POST /memory`; `IncidentResult.memories`; decision card "Last time this happened"; `/api/decisions/[id]` writes memory on approve/reject (fire-and-forget); test `format_memory()` pure fn.
- [ ] R3 Sentinel endpoint + demo scan: `POST /sentinel` (events only) with test via FakeAgent; `/api/demo/scan`; demo sidebar "Scan live news now" list → run incident.
- [ ] R4 Copilot history: `ChatIn.history`, `Agent(messages=…, conversation_manager=SlidingWindowConversationManager)`; `StrandsChat` sends history; verify a 2-turn exchange live.
- [ ] R5 Agent status: `/api/agent/status`; `AgentStatusCard` on dashboard; header health dot; 503 banner in inbox/demo.
- [ ] R6 Screenshots via Playwright into `docs/img`; README embeds; mobile pass (400px) fixes.
- [ ] R7 Final verification (pytest, vitest, tsc, build, headless demo run) and commit.
