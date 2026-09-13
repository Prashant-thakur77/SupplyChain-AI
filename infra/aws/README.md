# Running SupplyChain AI on AWS

The agent-service is provider-agnostic; on AWS it runs **Strands Agents on Amazon Bedrock** and deploys to
**Amazon Bedrock AgentCore Runtime**. Everything below is wired into the code today (`AGENT_MODEL_PROVIDER=bedrock`,
`agent-service/agentcore_entry.py`, `POST /invocations` + `GET /ping`); this folder holds the infrastructure to stand it up.

| Piece | What it is | Where |
|---|---|---|
| Model provider | `strands.models.BedrockModel` with cross-region inference profile (`us.anthropic.claude-sonnet-4-6` by default) | `agent-service/models.py` |
| Runtime | `BedrockAgentCoreApp` entrypoint → same handlers as the FastAPI app (`action` dispatch) | `agent-service/agentcore_entry.py` |
| Container | arm64 image for AgentCore (`docker buildx --platform linux/arm64`) or amd64 for App Runner / ECS | `agent-service/Dockerfile` |
| IAM | execution role + least-privilege policy for Bedrock invoke, ECR pull, CloudWatch logs | `infra/aws/agentcore-execution-role.json`, `infra/aws/agentcore-policy.json` |
| Scheduler | EventBridge rule that calls the web app's `/api/cron/scan` every 15 min (replaces Cloud Scheduler / Vercel cron) | `infra/aws/eventbridge-scan.json` |
| One-shot deploy | `deploy-agentcore.sh` — configure, build, launch, print the invocation URL | `infra/aws/deploy-agentcore.sh` |

## Deploy in five commands

```bash
cd agent-service
pip install bedrock-agentcore-starter-toolkit
export AWS_REGION=us-east-1 AGENT_MODEL_PROVIDER=bedrock BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-6
../infra/aws/deploy-agentcore.sh              # agentcore configure → launch → prints AGENT_SERVICE_URL
agentcore invoke '{"action":"reroute","supply_chain_id":"<id>","failed_node_ids":["<node>"]}'
```

Then set `AGENT_SERVICE_URL` (and `AGENT_SERVICE_SECRET`) on the web app. Model access must be enabled once in the Bedrock
console (Anthropic Claude models) for the account/region.

## Why AgentCore

- Managed, session-isolated runtime for the Strands agents with built-in observability (CloudWatch + X-Ray traces line up with the
  `agent_traces` rows the hooks already write).
- The same container serves Cloud Run today; nothing in the handlers is AWS-specific except the entrypoint.
- Bedrock keeps model calls inside the customer's AWS account — the data-residency story behind `orgs.region`.
