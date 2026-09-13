# Deployment

## Prerequisites

- Supabase project: run `supabase/setup.sql` once in the SQL editor (idempotent; creates every table, RLS policy and the auth→users trigger).
- Model access: a Gemini API key with billing enabled (free tiers are ~20–250 requests/day and will not survive a demo),
  **or** an AWS account with Bedrock model access (`AGENT_MODEL_PROVIDER=bedrock`).
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
