from strands import Agent

from models import make_model


def make_agent(role: str, system_prompt: str, tools: list | None = None, hooks: list | None = None, name: str | None = None) -> Agent:
    """Every agent in the service is built here so provider, temperature and tracing are uniform."""
    return Agent(
        name=name or role,
        model=make_model(role),
        system_prompt=system_prompt,
        tools=tools or [],
        hooks=hooks or [],
        callback_handler=None,
    )
