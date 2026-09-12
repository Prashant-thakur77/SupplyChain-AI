from strands import Agent

from models import invoke_with_retry, make_model


def make_agent(
    role: str,
    system_prompt: str,
    tools: list | None = None,
    hooks: list | None = None,
    name: str | None = None,
    structured_output_model=None,
    model=None,
) -> Agent:
    """Every agent in the service is built here so provider, temperature, tracing and typed output are uniform.

    `structured_output_model` makes the agent return that Pydantic model by default — used when the agent runs as a
    node inside a Strands Graph, where we cannot pass per-call arguments.
    """
    return Agent(
        name=name or role,
        model=model or make_model(role),
        system_prompt=system_prompt,
        tools=tools or [],
        hooks=hooks or [],
        callback_handler=None,
        structured_output_model=structured_output_model,
    )


def call_structured(agent, prompt: str, output_model):
    """Invoke `agent` for a typed result with retry. On transient provider errors the agent's model is swapped
    (next key, then the fallback model) and the call is repeated with a clean message history."""
    if not isinstance(agent, Agent):  # test doubles
        return agent(prompt, structured_output_model=output_model).structured_output

    def attempt(model):
        agent.model = model
        agent.messages = []
        return agent(prompt, structured_output_model=output_model).structured_output

    return invoke_with_retry(agent.name or "agent", attempt)
