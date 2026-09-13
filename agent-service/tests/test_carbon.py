from enrich import enrich_twin, lane_co2_kg
from routing import objective, reroute_plan
from schemas import Twin, TwinEdge, TwinNode


def _twin():
    n = lambda i, la, lo: TwinNode(id=i, label=i, type="port", lat=la, lng=lo)
    nodes = [n("a", 1.3, 103.8), n("b", 25.0, 55.0), n("c", 51.9, 4.5), n("h", 50.0, 8.6)]
    edges = [TwinEdge(id="ab", source="a", target="b", mode="sea", cost=1000, transit_days=8), TwinEdge(id="bc", source="b", target="c", mode="sea", cost=1500, transit_days=12),
             TwinEdge(id="ah", source="a", target="h", mode="air", cost=9000, transit_days=2), TwinEdge(id="hc", source="h", target="c", mode="road", cost=400, transit_days=1)]
    return enrich_twin(Twin(supply_chain_id="co2", nodes=nodes, edges=edges))[0]


def test_lane_co2_uses_mode_factor_and_rate_card_override():
    assert lane_co2_kg("air", 1000) > 25 * lane_co2_kg("sea", 1000)
    assert lane_co2_kg("sea", 1000, {"sea": {"co2_g_per_tkm": 32}}) == 2 * lane_co2_kg("sea", 1000)


def test_candidates_carry_co2_and_carbon_weight_reorders():
    t = _twin()
    assert all(e.co2_kg > 0 for e in t.edges)
    # fail hub b: only the air bypass remains, so co2 delta is positive and large
    p = reroute_plan(t, ["b"], [])
    c = p.candidates[0]
    assert c.feasible and c.added_co2_kg > 0 and c.co2_kg > c.baseline_co2_kg
    # objective grows with carbon weight
    assert objective(c, 1.0) > objective(c, 0.0) == c.added_cost
