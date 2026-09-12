"""Strands hooks: one agent_traces row per agent invocation. Observability without touching agent code."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from strands.hooks import HookProvider, HookRegistry
from strands.hooks.events import AfterInvocationEvent, BeforeInvocationEvent

import db


def new_session_id(prefix: str) -> str:
    return f"{prefix}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"


class TraceHooks(HookProvider):
    def __init__(self, session_id: str, user_id: Optional[str] = None, supply_chain_id: Optional[str] = None, stage: Optional[str] = None):
        self.session_id = session_id
        self.user_id = user_id
        self.supply_chain_id = supply_chain_id
        self.stage = stage
        self._start: dict[int, datetime] = {}

    def register_hooks(self, registry: HookRegistry, **kwargs) -> None:
        registry.add_callback(BeforeInvocationEvent, self._before)
        registry.add_callback(AfterInvocationEvent, self._after)

    def _before(self, event: BeforeInvocationEvent) -> None:
        self._start[id(event.agent)] = datetime.now(timezone.utc)

    def _after(self, event: AfterInvocationEvent) -> None:
        started = self._start.pop(id(event.agent), datetime.now(timezone.utc))
        metrics = getattr(event.agent, "event_loop_metrics", None)
        usage = getattr(metrics, "accumulated_usage", None) or {}
        db.insert_trace(
            self.session_id, getattr(event.agent, "name", None) or "agent", started, datetime.now(timezone.utc), True, None,
            self.user_id, self.supply_chain_id, self.stage, usage.get("inputTokens"), usage.get("outputTokens"),
        )
