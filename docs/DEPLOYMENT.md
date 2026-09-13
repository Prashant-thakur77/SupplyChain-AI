# Deployment

## Prerequisites

- Supabase project: run `supabase/setup.sql` once in the SQL editor (idempotent; creates every table, RLS policy and the auth→users trigger).
- Model access: a Gemini API key with billing enabled (free tiers are ~20–250 requests/day and will not survive a demo),
  **or** an AWS account with Bedrock model access (`AGENT_MODEL_PROVIDER=bedrock`), **or** a free Groq key (`AGENT_MODEL_PROVIDER=openai`, `OPENAI_BASE_URL=https://api.groq.com/openai/v1`, `OPENAI_MODEL_ID=llama-3.3-70b-versatile`), **or** local Ollama (`AGENT_MODEL_PROVIDER=ollama`, `ollama pull qwen2.5:7b`).
- Tavily key (news). Without it, the Gemini provider falls back to Google Search grounding; other providers need it.
- Optional: Tavily, OpenWeather, Mem0 keys.

## Option A — Google Cloud Run (current)

```bash
# agent-service
cp agent-service/.env agent-service/.env.yaml   # convert KEY=value → KEY: "value" (see below)
pnpm deploy:agents                              # gcloud run deploy supplychain-agents --source agent-service …

# web
#   set AGENT_SERVICE_URL=https://<agents-url> and AGENT_SERVICE_SECRET, CRON_SECRET in .env.yaml
pnpm deploy:gcp

# background loop
gcloud scheduler jobs create http supplychain-scan \
  --schedule="*/15 * * * *" --uri="https://<web-url>/api/cron/scan" --http-method=GET \
  --headers="Authorization=Bearer $CRON_SECRET" --location=us-central1
```

Weekly digest: `gcloud scheduler jobs create http supplychain-digest --schedule="0 7 * * 1" --uri="https://<web-url>/api/cron/digest" --http-method=GET --headers="Authorization=Bearer $CRON_SECRET" --location=us-central1`
Connector sync (ERP/TMS feeds): `gcloud scheduler jobs create http supplychain-sync --schedule="*/30 * * * *" --uri="https://<web-url>/api/cron/sync" --http-method=GET --headers="Authorization=Bearer $CRON_SECRET" --location=us-central1`

`.env.yaml` format: one `KEY: "value"` per line. Never commit it (`*.env.yaml` is gitignored).

## Option B — Amazon Bedrock AgentCore Runtime (agent-service)

```bash
cd agent-service
pip install bedrock-agentcore-starter-toolkit
export AGENT_MODEL_PROVIDER=bedrock BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-6 AWS_REGION=us-east-1
agentcore configure -e agentcore_entry.py      # builds an arm64 container, creates the runtime + IAM role
agentcore launch
agentcore invoke '{"action":"reroute","supply_chain_id":"<id>","failed_node_ids":["<node>"]}'
```

Then set `AGENT_SERVICE_URL` in the web app to the runtime's invocation URL (all handlers are reachable through
`POST /invocations` with an `action` field). The web app can stay on Cloud Run or move to App Runner.

## Option C — Vercel (web) + Railway or Render (agent-service)

No GCP account needed. The Python service runs as a Docker web service; the web app runs on Vercel.

**agent-service → Railway** (`agent-service/railway.json`) or **Render** (`render.yaml` at the repo root):
1. Railway (what the hosted demo runs on): create an empty service, then deploy the folder with the CLI so the build context is
   exactly `agent-service/` — `cd agent-service && RAILWAY_TOKEN=<project token> npx @railway/cli up --service <name> --detach`
   (repeat to redeploy). Render reads `render.yaml` automatically (Blueprint).
2. Variables (copy from `agent-service/.env.example`): `AGENT_MODEL_PROVIDER=openai`, `OPENAI_BASE_URL=https://api.groq.com/openai/v1`,
   `OPENAI_API_KEY`, `OPENAI_API_KEYS` (comma-separated pool, rotated on 429), `OPENAI_MODEL_ID=qwen/qwen3.8-27b`,
   `OPENAI_FALLBACK_MODELS=openai/gpt-oss-120b`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TAVILY_API_KEY`,
   `OPENWEATHER_API_KEY`, `AGENT_SERVICE_SECRET`, `APP_URL` (the Vercel URL, for deep links + push), `AGENT_PUBLIC_URL` (its own URL).
3. Note the public URL — `https://….up.railway.app` / `https://….onrender.com`. `GET /ping` must answer.

**web → Vercel** (`vercel.json`):
1. `vercel` → import the repo (framework: Next.js, root `/`).
2. Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `AGENT_SERVICE_URL=<agent-service url>`, `AGENT_SERVICE_SECRET` (same value), `CRON_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `TRACKING_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL=<vercel url>`, and `DEMO_PREFER_REPLAY=true`
   when the model is on a free tier (the three `/demo` presets then replay the committed recordings instantly; custom disruptions run live).
3. Deploy. `vercel.json` raises the function timeouts for the streaming routes and registers the cron endpoints
   (Vercel's Hobby plan runs crons once a day; for the 15-minute Sentinel loop point a free external scheduler such as
   cron-job.org at `GET /api/cron/scan` with header `Authorization: Bearer $CRON_SECRET`, and `/api/cron/sync` every 30 min).

## Option D — AWS end to end

See [`infra/aws/README.md`](../infra/aws/README.md): Bedrock as the model provider, AgentCore Runtime for the agent-service
(`infra/aws/deploy-agentcore.sh`), IAM policy and EventBridge schedule included.

## Local

```bash
(cd agent-service && uv run python app.py) &
AGENT_SERVICE_URL=http://localhost:8080 pnpm dev
```

`/demo` works without a database. Everything else needs Supabase.

## Health checks

- `GET <agents>/ping` → `{"status":"healthy","provider":"gemini"|"bedrock","model":…}`
- `GET <web>/api/agent/orchestrator` → `{status:"ok", engine:"strands-graph"}`
- `GET <web>/api/cron/scan` with the bearer secret → JSON summary of scanned twins

## Multi-region (data residency)

Run one agent-service per region and point the web app at each:

```
AGENT_SERVICE_URL=https://agents-global.example.com      # default
AGENT_SERVICE_URL_EU=https://agents-eu.example.com       # eu orgs
AGENT_SERVICE_URL_US=https://agents-us.example.com
AGENT_SERVICE_URL_APAC=https://agents-apac.example.com
```

Each org has a `region` (Team page, owner only). Route handlers resolve `supply_chain_id → org.region → AGENT_SERVICE_URL_<REGION>`
(`lib/agent-client.ts`), so an EU org's twin is only ever processed by the EU service. Every regional service sets `REGION=eu` (reported
by `/ping`) and can differ in provider: Bedrock/AgentCore in `us-east-1` for US customers, Cloud Run `europe-west4` with Gemini for EU.
Supabase remains one project; for strict residency create one project per region and set the `SUPABASE_*` variables per agent-service.
