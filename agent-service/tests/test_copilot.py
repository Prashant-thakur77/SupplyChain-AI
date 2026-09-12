from agents.copilot import to_messages


def test_to_messages_alternates_and_drops_trailing_user():
    hist = [{"role": "assistant", "text": "hi"}, {"role": "user", "text": "a"}, {"role": "user", "text": "b"}, {"role": "assistant", "text": "c"}, {"role": "user", "text": "pending"}]
    m = to_messages(hist)
    assert [x["role"] for x in m] == ["user", "assistant"]
    assert m[0]["content"][0]["text"] == "a\n\nb"
