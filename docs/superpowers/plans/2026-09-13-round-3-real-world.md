# Round 3 — real-world scaling features (approved by delegation)

| # | Feature | Why it matters in real life |
|---|---|---|
| 1 | **Text-to-twin**: describe your network in plain English (or paste a supplier list) → Strands `twin_builder` agent drafts nodes + lanes with coordinates → preview → save | The #1 onboarding blocker is building the twin. Most SMBs have a spreadsheet and a head full of knowledge, not a graph. |
| 2 | **Geocoding + lane estimation**: nodes without lat/lng get geocoded (OpenWeather geocoding, free); lanes without cost/days get estimated from haversine distance × mode rate card, flagged `estimated` | Sentinel/weather need coordinates; routing needs costs. Users rarely know exact lane costs — estimates get them to a working twin in minutes. |
| 3 | **CSV templates + industry templates**: downloadable `nodes.csv`/`lanes.csv` templates; one-click twins (electronics importer, automotive tier-2, pharma cold chain, food & beverage) | Fast start for demos and real trials. |
| 4 | **Autonomy policy per twin**: thresholds (auto-approve reroutes ≤ $X and ≤ N days, min confidence, quiet hours). Incident graph auto-approves within policy and notifies; outside → Decision Inbox | This is the "runs in the background, only surfaces for real decisions" promise made configurable — human-in-the-loop with guardrails. |
| 5 | **Notifications out of the app**: Slack/Teams/generic webhook on decision created / auto-approved / expired, with deep links | Ops teams live in Slack, not dashboards. |
| 6 | **Decision SLA**: pending decisions expire after N hours (cron), with a reminder webhook before expiry | Stale decisions are dangerous; expiry keeps the inbox honest. |
| 7 | **Agent Ops page** (`/agents`): runs, latency, tokens, failures, per-stage breakdown from `agent_traces`; CSV export of decisions/audit | Observability + audit are what a real buyer asks for first. |
| 8 | Styling parity: sign-in, simulation screens → same tokens as landing/inbox | Consistency for the video. |

Build order: 2 → 1 → 3 → 4 → 5 → 6 → 7 → 8. Each with tests (pytest/vitest) and a browser check.
