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

FALLBACK_GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.5-flash"]
_TRANSIENT = ("503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED", "overloaded", "high demand", "rate", "quota", "ThrottlingException", "404", "NOT_FOUND", "no longer available")


def gemini_keys(role: str) -> list[str]:
    """Preferred key first, then every other distinct key we have — used for rotation on quota errors."""
    ordered = [settings.gemini_key(role), settings.google_api_key_orchestrator, settings.google_api_key_agents, settings.google_api_key]
    out: list[str] = []
    for k in ordered:
        if k and k not in out:
            out.append(k)
    return out


MAX_OUTPUT_TOKENS = 16384


def make_model(role: str, api_key: str | None = None, model_id: str | None = None, json_mode: bool = False, google_search: bool = False):
    """Build a provider model for a role.

    `json_mode` asks Gemini for a guaranteed-JSON response (large nested reports). `google_search` attaches Gemini's
    built-in Google Search grounding (used as the news source when no Tavily key/credits are available).
    """
    temperature = ROLE_TEMPERATURE.get(role, 0.3)
    if settings.agent_model_provider == "bedrock":
        from strands.models import BedrockModel

        return BedrockModel(model_id=model_id or settings.bedrock_model_id, region_name=settings.aws_region, temperature=temperature,
                            max_tokens=MAX_OUTPUT_TOKENS)
    from strands.models.gemini import GeminiModel

    params: dict = {"temperature": temperature, "max_output_tokens": MAX_OUTPUT_TOKENS}
    if json_mode:
        params["response_mime_type"] = "application/json"
    extra: dict = {}
    if google_search:
        from google.genai import types as gtypes

        extra["gemini_tools"] = [gtypes.Tool(google_search=gtypes.GoogleSearch())]
    return GeminiModel(client_args={"api_key": api_key or settings.gemini_key(role)}, model_id=model_id or settings.gemini_model_id, params=params, **extra)


def is_transient(err: BaseException) -> bool:
    msg = str(err)
    return any(tok.lower() in msg.lower() for tok in _TRANSIENT)


def model_plans(role: str, max_attempts: int = 5) -> list[tuple[str | None, str | None]]:
    """(api_key, model_id) attempts in order: primary key → second key → fallback models on the primary key."""
    if settings.agent_model_provider == "bedrock":
        return [(None, None)] * max_attempts
    keys = gemini_keys(role) or [None]
    plans: list[tuple[str | None, str | None]] = [(keys[0], None)] + ([(keys[1], None)] if len(keys) > 1 else [])
    plans += [(keys[0], m) for m in FALLBACK_GEMINI_MODELS if m != settings.gemini_model_id]
    return plans[:max_attempts]


def invoke_with_retry(role: str, attempt: Callable[[object], T], max_attempts: int = 5, json_mode: bool = False, google_search: bool = False) -> T:
    """Call `attempt(model)` with fresh models until one succeeds.

    Attempt order: primary key → other keys → fallback model on the primary key. Backoff 1.5s·2^n with jitter.
    Non-transient errors are raised immediately.
    """
    plans = model_plans(role, max_attempts)

    last: BaseException | None = None
    for n, (key, mid) in enumerate(plans):
        try:
            return attempt(make_model(role, api_key=key, model_id=mid, json_mode=json_mode, google_search=google_search))
        except BaseException as e:  # noqa: BLE001 — we classify below
            last = e
            if not is_transient(e) or n == len(plans) - 1:
                raise
            delay = 1.5 * (2**n) + random.uniform(0, 0.75)
            nxt = plans[n + 1]
            print(f"[models] {role}: transient error ({str(e)[:60]}…) — retry {n + 1}/{len(plans) - 1} in {delay:.1f}s (model={nxt[1] or settings.gemini_model_id})")
            time.sleep(delay)
    assert last is not None
    raise last
