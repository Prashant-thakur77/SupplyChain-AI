"""Outbound notifications (Slack-compatible incoming webhooks, or any JSON endpoint). Never raises."""
from __future__ import annotations

import httpx

from config import settings


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


def decision_message(kind: str, title: str, option_label: str | None, added_cost: float | None, added_days: float | None, reason: str | None, decision_id: str | None) -> tuple[str, list[dict]]:
    link = f"{settings.app_url.rstrip('/')}/decisions" if settings.app_url else None
    head = {"pending": ":inbox_tray: *Decision needs you*", "auto": ":white_check_mark: *Auto-approved by policy*", "expired": ":hourglass: *Decision expired*", "alert": ":rotating_light: *Alert*"}.get(kind, kind)
    delta = f" (+${added_cost:,.0f}, +{added_days:.0f}d)" if added_cost is not None and added_days is not None else ""
    text = f"{head}\n{title}" + (f"\n→ {option_label}{delta}" if option_label else "") + (f"\n_{reason}_" if reason else "") + (f"\n{link}" if link else "")
    blocks = [{"type": "section", "text": {"type": "mrkdwn", "text": text}}]
    if link:
        blocks.append({"type": "actions", "elements": [{"type": "button", "text": {"type": "plain_text", "text": "Open Decision Inbox"}, "url": link}]})
    return text, blocks
