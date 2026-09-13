from graphs.incident import build_decision, severity_gate
from routing import reroute_plan
from schemas import Assessment, RouteRanking, Severity, Source
from tests.test_routing import twin


def _a(sev):
    return Assessment(event_id="e", title="Singapore closed", summary="s", severity=sev, confidence=0.9, affected_node_ids=["singapore"],
                      affected_edge_ids=[], sources=[Source(title="x", url="u")], needs_review=False)


def test_severity_gate():
    assert severity_gate(_a(Severity.HIGH)) and severity_gate(_a(Severity.CRITICAL))
    assert not severity_gate(_a(Severity.MEDIUM)) and not severity_gate(_a(Severity.LOW))


def test_build_decision_has_reroute_and_wait_options():
    t = twin()
    plan = reroute_plan(t, ["singapore"], [])
    r = RouteRanking(ranked_candidate_ids=["r1"], recommended_candidate_id="r1", rationale="cheapest", tradeoffs=[], wait_is_viable=False, wait_rationale="no")
    d = build_decision(t, _a(Severity.HIGH), plan, r, None, None, "trace")
    assert [o.kind for o in d.options] == ["reroute", "wait"]
    assert d.recommended_option_id == "r1" and d.options[0].added_cost == 1000 and d.title.endswith("choose a route")


def test_reconcile_keeps_event_failures_and_fills_blast_radius():
    from graphs.incident import reconcile_assessment
    from schemas import Event

    t = twin()
    ev = Event(id="e", kind="manual", title="Singapore closed", description="", failed_node_ids=["singapore"])
    a = _a(Severity.HIGH)
    a.failed_node_ids = ["singapore", "rotterdam", "berlin"]  # a weak model widening the failure to downstream sites
    a.affected_node_ids = []
    reconcile_assessment(t, ev, a)
    assert a.failed_node_ids == ["singapore"]
    assert "rotterdam" in a.affected_node_ids and "berlin" in a.affected_node_ids and "singapore" not in a.affected_node_ids
