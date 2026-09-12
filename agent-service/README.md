# agent-service

The Strands Agents layer of SupplyChain AI. See the repository README for the architecture.

```bash
uv sync --extra dev --extra memory
cp .env.example .env            # fill in keys
uv run pytest                   # unit tests (no network)
uv run python app.py            # http://localhost:8080/ping
```

Switch to Amazon Bedrock with `AGENT_MODEL_PROVIDER=bedrock` (+ AWS credentials). Deploy to AgentCore with
`pip install bedrock-agentcore-starter-toolkit && agentcore configure -e agentcore_entry.py && agentcore launch`.
