import pytest
from schemas import Assessment, Decision, DecisionOption, Severity


def test_assessment_severity_enum_value():
    a = Assessment(event_id="e1", title="t", summary="s", severity=Severity.HIGH, confidence=0.8,
                   affected_node_ids=["n1"], affected_edge_ids=[], sources=[], needs_review=False)
    assert a.severity == "HIGH"


def test_decision_recommended_must_exist():
    with pytest.raises(ValueError):
        Decision(supply_chain_id="s", title="t", summary="s", options=[DecisionOption(id="a", label="A", kind="reroute")],
                 recommended_option_id="zzz", rationale="r")
