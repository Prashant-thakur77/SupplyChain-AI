from notify import decision_message, sign_action


def test_sign_action_shape():
    t = sign_action("d1", "approve", "u1")
    assert t.count(".") == 1 and len(t) > 40


def test_pending_message_has_action_buttons(monkeypatch):
    monkeypatch.setattr("notify.settings.app_url", "https://app.example")
    text, blocks = decision_message("pending", "Port closed", "via Colombo", 1000, 5, None, "d1", "u1")
    assert "/d/d1/approve?t=" in text and any(b["type"] == "actions" and len(b["elements"]) == 4 for b in blocks)
