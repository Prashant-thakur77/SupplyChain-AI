from tests.test_routing import twin
from tools.twin import compute_blast_radius, find_reroutes, twin_cache


def test_find_reroutes_tool_uses_cache():
    twin_cache.put(twin())
    out = find_reroutes(supply_chain_id="t", failed_node_ids=["singapore"], failed_edge_ids=[], k=2)
    assert out["status"] == "success"
    body = out["content"][0]["json"]
    assert body["candidates"][0]["path"] == ["shenzhen", "colombo", "rotterdam"]
    assert body["candidates"][0]["added_cost"] == 1000


def test_blast_radius_tool_labels():
    twin_cache.put(twin())
    out = compute_blast_radius(supply_chain_id="t", failed_node_ids=["singapore"])
    assert "ROTTERDAM" in out["content"][0]["json"]["downstream_labels"]
