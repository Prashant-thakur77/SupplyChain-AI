"""Amazon Bedrock AgentCore Runtime entrypoint — wraps the same handlers as app.py.

    pip install bedrock-agentcore
    agentcore configure -e agentcore_entry.py && agentcore launch
"""
from bedrock_agentcore.runtime import BedrockAgentCoreApp

from app import invocations

app = BedrockAgentCoreApp()


@app.entrypoint
def invoke(payload: dict):
    return invocations(dict(payload))


if __name__ == "__main__":
    app.run()
