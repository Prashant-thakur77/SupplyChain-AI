from tools.lanes import assess_lane
from tools.twin import twin_cache
from tests.test_routing import twin as make_twin


def test_assess_lane_resolves_names_and_returns_verdict():
    sample_twin = make_twin()
    twin_cache.put(sample_twin)
    out = assess_lane(sample_twin.supply_chain_id, sample_twin.nodes[0].label, sample_twin.nodes[-1].label)
    assert out["status"] == "success"
    j = out["content"][0]["json"]
    assert j["verdict"] in {"safe", "watch", "at_risk"} and j["transit_days"] > 0 and j["best_path"]


def test_assess_lane_unknown_site():
    sample_twin = make_twin()
    twin_cache.put(sample_twin)
    assert assess_lane(sample_twin.supply_chain_id, "Atlantis", sample_twin.nodes[-1].id)["status"] == "error"
