import json
import re

from strands import Agent
from strands.types.exceptions import StructuredOutputException

from models import invoke_with_retry, make_model


def make_agent(
    role: str,
    system_prompt: str,
    tools: list | None = None,
    hooks: list | None = None,
    name: str | None = None,
    structured_output_model=None,
    model=None,
    description: str | None = None,
) -> Agent:
    """Every agent in the service is built here so provider, temperature, tracing and typed output are uniform.

    `structured_output_model` makes the agent return that Pydantic model by default — used when the agent runs as a
    node inside a Strands Graph, where we cannot pass per-call arguments.
    """
    return Agent(
        name=name or role,
        description=description,
        model=model or make_model(role),
        system_prompt=system_prompt,
        tools=tools or [],
        hooks=hooks or [],
        callback_handler=None,
        structured_output_model=structured_output_model,
    )


_JSON_BLOCK = re.compile(r"\{.*\}", re.S)


def _json_fallback(agent: Agent, prompt: str, output_model):
    """Some providers refuse the structured-output tool on large schemas. Ask for raw JSON and validate it ourselves."""
    schema = json.dumps(output_model.model_json_schema())
    agent.messages = []
    res = agent(f"{prompt}\n\nRespond with ONLY a JSON object (no prose, no markdown fences) that validates against this JSON schema:\n{schema}")
    text = str(res)
    m = _JSON_BLOCK.search(text)
    if not m:
        raise StructuredOutputException("no JSON object in model response")
    return output_model.model_validate_json(m.group(0))


def call_structured(agent, prompt: str, output_model, prefer_json: bool = False):
    """Invoke `agent` for a typed result with retry. On transient provider errors the agent's model is swapped
    (next key, then the fallback model) and the call is repeated with a clean message history.

    `prefer_json=True` skips the structured-output tool and asks for JSON directly — needed for large nested schemas,
    which Gemini's function-calling path rejects. Tool-using agents must keep prefer_json=False (JSON mode disables tools).
    """
    if not isinstance(agent, Agent):  # test doubles
        return agent(prompt, structured_output_model=output_model).structured_output
    role = agent.name or "agent"

    if prefer_json:
        def attempt_json(model):
            agent.model = model
            return _json_fallback(agent, prompt, output_model)

        return invoke_with_retry(role, attempt_json, json_mode=True)

    def attempt(model):
        agent.model = model
        agent.messages = []
        try:
            return agent(prompt, structured_output_model=output_model).structured_output
        except StructuredOutputException:
            agent.model = make_model(role, json_mode=True)
            return _json_fallback(agent, prompt, output_model)

    return invoke_with_retry(role, attempt)
