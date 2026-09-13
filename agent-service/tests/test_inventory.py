import inventory
from routing import reroute_plan
from schemas import Flow, Twin, TwinEdge, TwinNode


def _twin(cover: float) -> Twin:
    nodes = [TwinNode(id=i, label=i, type="port", lat=0, lng=0) for i in ["A", "B", "C", "D"]]
    edges = [
        TwinEdge(id="ab", source="A", target="B", mode="sea", cost=100, transit_days=5),
        TwinEdge(id="bd", source="B", target="D", mode="sea", cost=100, transit_days=5),
        TwinEdge(id="ac", source="A", target="C", mode="air", cost=900, transit_days=2),
        TwinEdge(id="cd", source="C", target="D", mode="air", cost=900, transit_days=2),
    ]
    flows = [Flow(id="f", origin="A", destination="D", sku="x", units_per_week=100, value_per_week=50000, penalty_per_day=1000, inventory_days=cover)]
    return Twin(supply_chain_id="t", nodes=nodes, edges=edges, flows=flows)


def test_wait_viable_when_cover_exceeds_outage():
    twin = _twin(cover=20)
    pos = inventory.assess(twin, reroute_plan(twin, ["B"], []), expected_outage_days=7)
    assert pos.wait_is_viable and not pos.stockout_lanes
    assert "stays covered" in pos.rationale


def test_stockout_flags_and_reroute_beats_it():
    twin = _twin(cover=6)
    pos = inventory.assess(twin, reroute_plan(twin, ["B"], []), expected_outage_days=7)
    assert not pos.wait_is_viable
    assert pos.stockout_lanes == ["A → D"]
    assert pos.reroute_beats_stockout == ["A → D"]  # air bypass is 4 days < 6 days of cover
    assert pos.lanes[0].reroute_days == 4


def test_no_inventory_data_defers_to_router():
    twin = _twin(cover=0)
    pos = inventory.assess(twin, reroute_plan(twin, ["B"], []), expected_outage_days=7)
    assert pos.wait_is_viable and "No inventory data" in pos.rationale
