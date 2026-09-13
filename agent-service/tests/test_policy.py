from policy import Policy, evaluate
from schemas import Decision, DecisionOption, Severity


def _d(cost=1000, days=4, conf=0.9, kind="reroute", risk=Severity.LOW):
    return Decision(supply_chain_id="s", title="t", summary="s", options=[DecisionOption(id="r1", label="A", kind=kind, added_cost=cost, added_days=days, risk=risk), DecisionOption(id="wait", label="Wait", kind="wait")],
                    recommended_option_id="r1", rationale="r", confidence=conf)


def test_policy_off():
    assert evaluate(Policy(), _d(), 0, False) == (False, "policy: auto-approve off")


def test_policy_auto_approves_inside_guardrails():
    ok, reason = evaluate(Policy(auto_approve=True), _d(), 0, False)
    assert ok and reason.startswith("auto-approved")


def test_policy_rejects_each_guardrail():
    p = Policy(auto_approve=True)
    assert not evaluate(p, _d(cost=5000), 0, False)[0]
    assert not evaluate(p, _d(days=9), 0, False)[0]
    assert not evaluate(p, _d(conf=0.5), 0, False)[0]
    assert not evaluate(p, _d(), 1, False)[0]
    assert not evaluate(p, _d(), 0, True)[0]
    assert not evaluate(p, _d(kind="wait"), 0, False)[0]
    assert not evaluate(p, _d(risk=Severity.HIGH), 0, False)[0]
