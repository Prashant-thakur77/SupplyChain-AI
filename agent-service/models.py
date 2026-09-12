"""Model provider factory + resilience.

AGENT_MODEL_PROVIDER decides Gemini vs Bedrock; nothing else changes. `invoke_with_retry` wraps every agent call with
exponential backoff on 429/503, rotates across the configured Gemini keys, and finally falls back to a lighter model.
"""
from __future__ import annotations

import random
import time
from typing import Callable, TypeVar

from config import settings

T = TypeVar("T")

ROLE_TEMPERATURE: dict[str, float] = {
    "sentinel": 0.2,
    "analyst": 0.2,
    "router": 0.1,
    "impact": 0.2,
    "strategist": 0.4,
    "forecaster": 0.3,
    "scenario": 0.6,
    "copilot": 0.5,
    "orchestrator": 0.3,
}

FALLBACK_GEMINI_MODEL = "gemini-2.5-flash-lite"
_TRANSIENT = ("503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED", "overloaded", "high demand", "rate", "quota", "ThrottlingException")


def gemini_keys(role: str) -> list[str]:
    """Preferred key first, then every other distinct key we have — used for rotation on quota errors."""
    ordered = [settings.gemini_key(role), settings.google_api_key_orchestrator, settings.google_api_key_agents, settings.google_api_key]
    out: list[str] = []
    for k in ordered:
        if k and k not in out:
            out.append(k)
    return out


def make_model(role: str, api_key: str | None = None, model_id: str | None = None):
    temperature = ROLE_TEMPERATURE.get(role, 0.3)
    if settings.agent_model_provider == "bedrock":
        from strands.models import BedrockModel

        return BedrockModel(model_id=model_id or settings.bedrock_model_id, region_name=settings.aws_region, temperature=temperature)
    from strands.models.gemini import GeminiModel

    return GeminiModel(
        client_args={"api_key": api_key or settings.gemini_key(role)},
        model_id=model_id or settings.gemini_model_id,
        params={"temperature": temperature, "max_output_tokens": 4096},
    )


def is_transient(err: BaseException) -> bool:
    msg = str(err)
    return any(tok.lower() in msg.lower() for tok in _TRANSIENT)


def invoke_with_retry(role: str, attempt: Callable[[object], T], max_attempts: int = 4) -> T:
    """Call `attempt(model)` with fresh models until one succeeds.

    Attempt order: primary key → other keys → fallback model on the primary key. Backoff 1.5s·2^n with jitter.
    Non-transient errors are raised immediately.
    """
    plans: list[tuple[str | None, str | None]] = []
    if settings.agent_model_provider == "bedrock":
        plans = [(None, None)] * max_attempts
    else:
        keys = gemini_keys(role)
        plans = [(k, None) for k in keys] + [(keys[0] if keys else None, FALLBACK_GEMINI_MODEL)]
        plans = plans[:max_attempts] if len(plans) >= max_attempts else plans + [plans[-1]] * (max_attempts - len(plans))

    last: BaseException | None = None
    for n, (key, mid) in enumerate(plans):
        try:
            return attempt(make_model(role, api_key=key, model_id=mid))
        except BaseException as e:  # noqa: BLE001 — we classify below
            last = e
            if not is_transient(e) or n == len(plans) - 1:
                raise
            delay = 1.5 * (2**n) + random.uniform(0, 0.75)
            print(f"[models] {role}: transient error ({str(e)[:80]}…) — retry {n + 1}/{len(plans) - 1} in {delay:.1f}s")
            time.sleep(delay)
    assert last is not None
    raise last
