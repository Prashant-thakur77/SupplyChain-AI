from enrich import enrich_twin, estimate_lane, haversine_km
from schemas import Twin, TwinEdge, TwinNode


def test_haversine_shenzhen_singapore():
    assert abs(haversine_km(22.54, 114.06, 1.29, 103.85) - 2600) < 80


def test_estimate_lane_sea_is_cheaper_than_air():
    sc, sd = estimate_lane("sea", 2600)
    ac, ad = estimate_lane("air", 2600)
    assert sc < ac and sd > ad and sc >= 400


def test_enrich_fills_only_missing_values():
    t = Twin(supply_chain_id="t", nodes=[TwinNode(id="a", label="A", lat=22.54, lng=114.06), TwinNode(id="b", label="B", lat=1.29, lng=103.85), TwinNode(id="c", label="C")],
             edges=[TwinEdge(id="e1", source="a", target="b", mode="sea", cost=0, transit_days=5), TwinEdge(id="e2", source="a", target="b", mode="sea", cost=1000, transit_days=5), TwinEdge(id="e3", source="b", target="c", mode="road")])
    t, notes = enrich_twin(t)
    assert t.edges[0].cost > 0 and t.edges[0].transit_days == 5
    assert t.edges[1].cost == 1000
    assert t.edges[2].cost == 0 and any("no coordinates" in n for n in notes)
