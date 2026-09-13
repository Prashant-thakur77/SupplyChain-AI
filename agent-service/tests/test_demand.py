import demand
from schemas import Flow, Twin, TwinEdge, TwinNode


def _twin(cap=None):
    nodes = [TwinNode(id=i, label=i.upper(), type="port") for i in ["a", "b", "c"]]
    edges = [TwinEdge(id="ab", source="a", target="b", mode="sea", cost=1000, transit_days=5, capacity=cap), TwinEdge(id="bc", source="b", target="c", mode="road", cost=200, transit_days=1)]
    flows = [Flow(id="f", origin="a", destination="c", product="widgets", units_per_week=100, value_per_unit=50, inventory_days=12)]
    return Twin(supply_chain_id="d", nodes=nodes, edges=edges, flows=flows)


def test_cost_problem_without_capacity_limits():
    r = demand.simulate(_twin(), 1.5, 4)
    assert not r.saturated and r.lost_value_total == 0
    assert r.lanes[0].extra_units == 50 and r.lanes[0].extra_cost_per_week == 600  # 50 × (1200/100)
    assert r.first_stockout_days == 8.0


def test_capacity_saturation_creates_shortfall():
    r = demand.simulate(_twin(cap=120), 1.5, 4)
    assert r.saturated == ["A → B"]
    assert r.lanes[0].shortfall_units == 30 and r.lost_value_total == 1500
    assert "saturate" in r.summary[1]


def test_scope_filters_destinations():
    r = demand.simulate(_twin(), 2.0, 2, ["zzz"])
    assert r.lanes == []
