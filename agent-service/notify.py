"""Outbound notifications (Slack-compatible incoming webhooks, or any JSON endpoint). Never raises."""
from __future__ import annotations

import base64
import hashlib
import hmac
import time

import httpx

from config import settings


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def sign_action(decision_id: str, action: str, user_id: str, ttl_hours: int = 72) -> str:
    """Mirror of lib/action-token.ts (web verifies these)."""
    secret = (settings.action_secret or settings.agent_service_secret or "dev-action-secret").encode()
    payload = f"{decision_id}|{action}|{user_id}|{int(time.time()) + ttl_hours * 3600}".encode()
    return f"{_b64(payload)}.{_b64(hmac.new(secret, payload, hashlib.sha256).digest())}"


def action_links(decision_id: str, user_id: str) -> dict[str, str]:
    base = settings.app_url.rstrip("/")
    if not base:
        return {}
    return {a: f"{base}/d/{decision_id}/{a}?t={sign_action(decision_id, a, user_id)}" for a in ("approve", "reject", "snooze")}


def post_webhook(url: str | None, text: str, blocks: list[dict] | None = None) -> bool:
    url = url or settings.decision_webhook_url
    if not url:
        return False
    payload: dict = {"text": text}
    if blocks:
        payload["blocks"] = blocks
    try:
        r = httpx.post(url, json=payload, timeout=8)
        return r.status_code < 300
    except Exception as e:  # noqa: BLE001
        print(f"[notify] webhook failed: {e}")
        return False


def decision_message(kind: str, title: str, option_label: str | None, added_cost: float | None, added_days: float | None, reason: str | None, decision_id: str | None, user_id: str | None = None) -> tuple[str, list[dict]]:
    link = f"{settings.app_url.rstrip('/')}/decisions" if settings.app_url else None
    head = {"pending": ":inbox_tray: *Decision needs you*", "auto": ":white_check_mark: *Auto-approved by policy*", "expired": ":hourglass: *Decision expired*", "alert": ":rotating_light: *Alert*"}.get(kind, kind)
    delta = f" (+${added_cost:,.0f}, +{added_days:.0f}d)" if added_cost is not None and added_days is not None else ""
    text = f"{head}\n{title}" + (f"\n→ {option_label}{delta}" if option_label else "") + (f"\n_{reason}_" if reason else "") + (f"\n{link}" if link else "")
    blocks = [{"type": "section", "text": {"type": "mrkdwn", "text": text}}]
    elements: list[dict] = []
    if kind == "pending" and decision_id and user_id:
        links = action_links(decision_id, user_id)
        if links:
            elements += [{"type": "button", "style": "primary", "text": {"type": "plain_text", "text": "Approve"}, "url": links["approve"]},
                         {"type": "button", "style": "danger", "text": {"type": "plain_text", "text": "Reject"}, "url": links["reject"]},
                         {"type": "button", "text": {"type": "plain_text", "text": "Snooze 24h"}, "url": links["snooze"]}]
            text += f"\nApprove: {links['approve']}\nReject: {links['reject']}"
    if link:
        elements.append({"type": "button", "text": {"type": "plain_text", "text": "Open Decision Inbox"}, "url": link})
    if elements:
        blocks.append({"type": "actions", "elements": elements})
    return text, blocks
