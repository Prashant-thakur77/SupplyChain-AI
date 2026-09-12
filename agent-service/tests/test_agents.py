from types import SimpleNamespace

from routing import reroute_plan
from schemas import Assessment, Severity, Source
from tests.test_routing import twin


class FakeAgent:
    """Stands in for a Strands Agent: records the prompt and returns a canned structured output."""

    name = "fake"

    def __init__(self, factory):
        self.factory, self.prompt = factory, None

    def __call__(self, prompt, structured_output_model=None, **kw):
        self.prompt = prompt
        return SimpleNamespace(structured_output=self.factory(structured_output_model))


def _assessment():
    return Assessment(event_id="e", title="Singapore closed", summary="s", severity=Severity.HIGH, confidence=0.9,
                      failed_node_ids=["singapore"], affected_node_ids=["rotterdam", "berlin"], affected_edge_ids=[], sources=[Source(title="x", url="u")], needs_review=False)


def test_router_prompt_contains_candidates_and_sanitises_ids():
    import agents.router as router
    t = twin()
    plan = reroute_plan(t, ["singapore"], [])
    fake = FakeAgent(lambda M: M(ranked_candidate_ids=["bogus", "r1"], recommended_candidate_id="bogus", rationale="cheapest",
                                 tradeoffs=["+4d"], wait_is_viable=False, wait_rationale="port closed 2+ weeks"))
    r = router.run_router(fake, t, _assessment(), plan)
    assert "colombo" in fake.prompt.lower()
    assert r.ranked_candidate_ids == ["r1"] and r.recommended_candidate_id == "r1"


def test_analyst_backfills_sources_and_review_flag():
    import agents.analyst as analyst
    from schemas import Event
    ev = Event(id="ev1", kind="news", title="t", description="d", sources=[Source(title="s", url="u")], failed_node_ids=["singapore"])
    fake = FakeAgent(lambda M: M(event_id="x", title="t", summary="s", severity=Severity.HIGH, confidence=0.4,
                                 affected_node_ids=[], affected_edge_ids=[], sources=[], needs_review=False))
    a = analyst.run_analyst(fake, twin(), ev, [])
    assert a.event_id == "ev1" and a.sources[0].url == "u" and a.failed_node_ids == ["singapore"] and a.needs_review
