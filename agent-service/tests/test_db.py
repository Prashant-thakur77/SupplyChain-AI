from db import fingerprint, rows_to_twin


def test_rows_to_twin_maps_edge_data():
    nodes = [
        {"node_id": "n1", "name": "Shenzhen", "type": "factory", "location_lat": 22.5, "location_lng": 114.0, "capacity": 10,
         "risk_level": 2, "data": {"label": "Shenzhen Plant", "country": "CN"}},
        {"node_id": "n2", "name": "Singapore", "type": "port", "data": {}},
    ]
    edges = [{"edge_id": "e1", "from_node_id": "n1", "to_node_id": "n2", "data": {"mode": "sea", "cost": "1200", "transitTime": 5}}]
    t = rows_to_twin("sc1", "Demo", nodes, edges)
    assert t.nodes[0].label == "Shenzhen Plant" and t.nodes[0].country == "CN"
    assert t.edges[0].cost == 1200 and t.edges[0].transit_days == 5 and t.edges[0].mode == "sea"


def test_rows_to_twin_drops_dangling_edges():
    t = rows_to_twin("sc1", "Demo", [{"node_id": "n1", "data": {}}], [{"edge_id": "e1", "from_node_id": "n1", "to_node_id": None, "data": {}}])
    assert t.edges == []


def test_fingerprint_is_stable_and_order_independent():
    assert fingerprint("Port closed", ["b", "a"]) == fingerprint("port closed ", ["a", "b"])
