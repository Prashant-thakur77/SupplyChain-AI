"""Request-scoped defaults for tools. Models (especially through strict OpenAI-compatible gateways such as Groq, which
reject a tool call whose arguments miss a required field) sometimes drop `supply_chain_id`; every entry point sets the
current chain so tools can fall back to it instead of failing the whole run."""
from __future__ import annotations

from contextvars import ContextVar

current_chain: ContextVar[str] = ContextVar("current_chain", default="")


def set_current_chain(supply_chain_id: str | None) -> None:
    if supply_chain_id:
        current_chain.set(supply_chain_id)


def chain_id(supply_chain_id: str | None) -> str:
    return supply_chain_id or current_chain.get("")
