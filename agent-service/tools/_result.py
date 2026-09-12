"""Strands tool result envelopes."""


def ok(payload: dict) -> dict:
    return {"status": "success", "content": [{"json": payload}]}


def err(message: str) -> dict:
    return {"status": "error", "content": [{"text": message}]}
