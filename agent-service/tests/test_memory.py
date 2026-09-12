from tools.memory import format_decision_memory


def test_format_decision_memory_reroute():
    assert format_decision_memory("Port of Singapore closed", "approved", "Shenzhen → Colombo → Berlin", 1000, 5, "2026-09-13") == \
        "2026-09-13: Port of Singapore closed → approved: Shenzhen → Colombo → Berlin (+$1,000, +5 days)."


def test_format_decision_memory_rejected_without_option():
    assert format_decision_memory("Suez blocked", "rejected", None, None, None, "2026-09-13") == "2026-09-13: Suez blocked → rejected."
