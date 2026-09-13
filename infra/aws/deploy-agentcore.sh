#!/usr/bin/env bash
# Deploy the agent-service to Amazon Bedrock AgentCore Runtime. Requires: AWS CLI creds, Docker (buildx), the starter toolkit.
set -euo pipefail
cd "$(dirname "$0")/../../agent-service"
: "${AWS_REGION:=us-east-1}"; : "${BEDROCK_MODEL_ID:=us.anthropic.claude-sonnet-4-6}"
export AGENT_MODEL_PROVIDER=bedrock AWS_REGION BEDROCK_MODEL_ID
command -v agentcore >/dev/null || pip install bedrock-agentcore-starter-toolkit
agentcore configure -e agentcore_entry.py --name supplychain-agents --region "$AWS_REGION" --non-interactive || agentcore configure -e agentcore_entry.py
agentcore launch
echo "Set AGENT_SERVICE_URL on the web app to the invocation URL printed above (append nothing; the web client posts to /invocations)."
