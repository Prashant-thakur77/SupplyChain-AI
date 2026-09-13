from risk import score_twin
from schemas import Flow
from tests.test_routing import twin


def test_hub_scores_higher_than_leaf():
    t = twin()
    for n in t.nodes:
        n.country = "NL"
    t.edges = [e for e in t.edges if e.id not in ("e3", "e4")]  # singapore becomes a SPOF
    scores = {r.node_id: r for r in score_twin(t)}
    assert scores["singapore"].score > scores["colombo"].score
    assert "single point of failure" in " ".join(scores["singapore"].reasons)


def test_news_and_weather_raise_score():
    t = twin()
    base = {r.node_id: r.score for r in score_twin(t)}
    hot = {r.node_id: r.score for r in score_twin(t, news_counts={"rotterdam": 5}, adverse_weather={"rotterdam"})}
    assert hot["rotterdam"] > base["rotterdam"]
