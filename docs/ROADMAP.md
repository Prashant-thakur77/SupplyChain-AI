# SupplyChain AI — Product Roadmap

*What it would take to turn the hackathon build into something an operations team runs their network on.*

## 0. Where we are

Working today: digital twin (canvas, CSV, text-to-twin, templates), deterministic routing engine, eight Strands agents in two graphs, background Sentinel scans, Decision Inbox with autonomy policy, memory, geo view, Agent Ops, webhooks, four model providers. All persisted in Postgres with RLS; provider-agnostic; deployable to Cloud Run or AgentCore.

What is *not* true yet: the twin knows lanes but not **flows** (what moves, how much, worth how much, due when), so impact is a capacity proxy; approvals end at "approved" rather than at "done"; one user = one org; no external systems feed it.

## 1. Who we build for (in order)

| Persona | Job to be done | What they need first |
|---|---|---|
| **Ops / logistics manager, SMB importer or manufacturer** (primary) | keep goods moving; decide fast when a lane breaks | a trustworthy decision with exact numbers, in Slack, in under a minute |
| **Supply-chain planner, mid-market** | reduce exposure before it bites | resilience audit, what-ifs, supplier concentration, dual-sourcing plans |
| **CFO / COO** | know the cost of risk and of inaction | value at risk, cost of decisions, audit trail, weekly digest |
| **3PL / freight forwarder account manager** | serve many clients' networks | multi-tenant orgs, per-client policies, white-label alerts |

## 2. Phases

### Phase A — "Trust it" (next 2–4 weeks)
Goal: an operator can run one real network on it and believe every number.

| # | Feature | Why | How | Effort |
|---|---|---|---|---|
| A1 | **Resilience audit** | The most-asked question is "where am I fragile?" — and it's deterministic | for every node/lane: simulate failure → reroute cost/days, infeasible lanes, single points of failure; rank; one page + PDF export; optional Strategist narrative | S |
| A2 | **Flows (shipments)** | Impact should be value-weighted, not capacity-weighted | `shipments` table (lane, product, units, value, due date, incoterm); routing engine weights severed lanes by value/day; Impact agent receives real numbers | M |
| A3 | **Execution checklist** | "Approved" isn't "done" | on approval, persist the Strategist steps as `decision_tasks` (owner, due, status); card shows progress; reminders via webhook | S |
| A4 | **Supplier risk score** | Risk levels are hand-typed today | blend: concentration (share of flow), geo/political index, news frequency (Sentinel), weather exposure, financial signals when available; recompute nightly; explainable breakdown | M |
| A5 | **Evidence panel** | Judges and buyers ask "why should I believe this?" | per decision: sources with excerpts, tool outputs (routing candidates), model/provider, tokens, trace; "re-run with a different provider" button | S |
| A6 | **Data quality gate** | Bad twins → bad decisions | lint on save: missing coords, zero-cost lanes, orphan nodes, duplicate labels; fix-it actions; blocks scans on critical issues | S |

### Phase B — "Run the team on it" (1–3 months)
| # | Feature | Why | How | Effort |
|---|---|---|---|---|
| B1 | **Organisations & roles** | Real teams: planner, ops, approver, viewer | `orgs`, `memberships`, RLS by org; approver role required for decisions over policy; invite by email | M |
| B2 | **Approve from Slack / email** | Decisions happen where people are | signed action links (`/d/<id>/approve?token=`), Slack interactive buttons, email digest with buttons | M |
| B3 | **Weekly digest & cost of inaction** | CFO visibility | scheduled report: incidents, decisions, $ avoided (baseline cost of "wait" vs chosen), agent cost; email/Slack | S |
| B4 | **Scenario war-room** | Planners want to stress-test | batch what-ifs (multi-node failures, port strikes by region, tariff changes) → comparative table; Monte Carlo already exists | M |
| B5 | **Lane rate cards & carrier quotes** | Estimates → real numbers | per-org rate card editor; import carrier quotes (CSV); Freightos/Xeneta API adapters behind an interface | M |
| B6 | **Vessel/shipment tracking** | Know where cargo *is* | AIS/vessel-tracking adapter (e.g. MarineTraffic-style API), container milestones; Sentinel correlates delays with twin lanes | L |
| B7 | **Inventory & safety-stock model** | "Can we wait?" needs stock data | per-node inventory days; Impact uses days-of-cover; Router's `wait_is_viable` becomes computed, not judged | M |
| B8 | **Mobile-first inbox** | Decisions at 2 a.m. | PWA, push notifications, one-thumb approve | S |

### Phase C — "Connect it" (3–6 months)
| # | Feature | Why | How | Effort |
|---|---|---|---|---|
| C1 | **ERP/TMS connectors** | Flows should come from the system of record | SAP (IDoc/OData), NetSuite, Odoo; scheduled sync of POs, shipments, suppliers; mapping UI | L |
| C2 | **A2A endpoint** | Other agents/systems ask "is this lane safe?" | Strands A2A server exposing `assess_lane`, `reroute`, `risk_score`; API keys per org | M |
| C3 | **Public data feeds** | Better sensing | port congestion indices, ACLED-style conflict events, NOAA/ECMWF storms, customs/tariff bulletins; each a Sentinel tool | M |
| C4 | **Learning from outcomes** | Close the loop scientifically | record actual delay/cost after each decision; compare with estimates; calibrate rate cards and Router thresholds; show accuracy on Agent Ops | M |
| C5 | **Multi-region deployment** | Data residency, latency | agent-service per region; AgentCore for AWS customers; Cloud Run elsewhere | M |

### Phase D — "Platform" (6–12 months)
| # | Feature | How |
|---|---|---|
| D1 | Marketplace of Sentinel tools and playbooks (industry-specific) | plugin manifest; Strands tools loaded per org |
| D2 | Network benchmarking (anonymised) | resilience percentile vs similar networks |
| D3 | Contract & SLA awareness | parse contracts (penalty clauses, lead-time commitments) → Impact includes penalties |
| D4 | Carbon & cost co-optimisation | rate card gains CO₂e per km; Router ranks on a weighted objective the org sets |
| D5 | Digital-twin simulation of demand shocks | couple demand forecasts to flows |

## 3. Platform & quality track (continuous)

- **Evaluation harness** for agents: golden incidents with expected severity/routes; run on every model/provider change; report in CI.
- **Cost controls**: per-org token budgets, model routing (cheap model for Sentinel triage, strong model for decisions).
- **Reliability**: durable job queue for scans (Cloud Tasks / SQS), idempotency keys, retries with backoff — already partially there.
- **Security**: SSO (SAML/OIDC), audit log export to SIEM, secrets in a vault, signed webhooks.
- **Observability**: OpenTelemetry from Strands to Grafana/CloudWatch; SLOs on "event → decision" latency.
- **Accessibility & i18n**: keyboard-complete inbox, screen-reader labels, DE/FR/ES/ZH.

## 4. Business model (so the roadmap has a spine)

- **Starter** (free): 1 twin, 20 nodes, daily scans, community providers (Groq/Ollama).
- **Team** ($): unlimited twins, 15-min scans, autonomy policies, Slack, Agent Ops, exports.
- **Enterprise**: orgs/roles, SSO, connectors, private deployment (AgentCore/VPC), SLAs.

Success metrics: time-to-first-twin < 10 min; event→decision < 60 s; % decisions auto-approved within policy; $ avoided vs "wait"; weekly active approvers.

## 5. Immediate build order (this iteration)

A1 Resilience audit → A3 Execution checklist → A6 Data quality gate → A5 Evidence panel → A2 Flows.
