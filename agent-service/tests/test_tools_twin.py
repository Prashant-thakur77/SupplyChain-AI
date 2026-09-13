from tests.test_routing import twin
from tools.twin import compute_blast_radius, find_reroutes, twin_cache


def test_find_reroutes_tool_uses_cache():
    twin_cache.put(twin())
    out = find_reroutes(supply_chain_id="t", failed_node_ids=["singapore"], failed_edge_ids=[], k=2)
    assert out["status"] == "success"
    body = out["content"][0]["json"]
    assert body["candidates"][0]["labels"] == ["SHENZHEN", "COLOMBO", "ROTTERDAM", "BERLIN"]
    assert body["candidates"][0]["added_cost"] == 1000


def test_blast_radius_tool_labels():
    twin_cache.put(twin())
    out = compute_blast_radius(supply_chain_id="t", failed_node_ids=["singapore"])
    assert "ROTTERDAM" in out["content"][0]["json"]["downstream_labels"]


def test_tools_accept_labels_not_just_ids():
    from tests.test_routing import twin as make_twin
    from tools.twin import compute_blast_radius, find_reroutes, resolve_nodes, twin_cache

    t = make_twin(); twin_cache.put(t)
    assert resolve_nodes(t, ["SINGAPORE", "singapore", "nope"]) == ["singapore"]
    assert resolve_nodes(t, ["rotter"]) == ["rotterdam"]  # unique loose match
    out = compute_blast_radius(t.supply_chain_id, ["SINGAPORE"])
    assert out["status"] == "success" and out["content"][0]["json"]["downstream_node_ids"]
    assert find_reroutes(t.supply_chain_id, ["Atlantis"])["status"] == "error"


def test_inline_twin_keeps_saved_flows(monkeypatch):
    from tests.test_routing import twin as make_twin
    from schemas import Flow
    from tools import twin as tt

    t = make_twin(); t.supply_chain_id = "saved-1"
    monkeypatch.setattr(tt.db, "load_flows", lambda sid: [Flow(id="f", origin="shenzhen", destination="berlin", units_per_week=10, value_per_unit=5)])
    monkeypatch.setattr(tt.db, "load_rate_card", lambda sid: {})
    monkeypatch.setattr(tt.db, "load_quotes", lambda sid: [])
    tt.twin_cache.put(t)  # canvas payload: no flows
    assert len(tt.twin_cache.get("saved-1").flows) == 1
