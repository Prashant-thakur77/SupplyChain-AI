from schemas import Flow
from tests.test_routing import twin
from warroom import ScenarioIn, compare, presets


def test_compare_ranks_and_recommends():
    t = twin()
    t.flows = [Flow(origin="shenzhen", destination="berlin", units_per_week=500, value_per_unit=40)]
    rows = compare(t, [ScenarioIn("Singapore", ["singapore"], [], 14), ScenarioIn("Colombo", ["colombo"], [], 14)])
    sg, co = rows
    assert sg.lanes_affected == 1 and sg.value_at_risk_usd == 40000 and "Reroute" in sg.recommended
    assert co.lanes_affected == 0 and "monitor" in co.recommended


def test_presets_exist():
    t = twin()
    for n in t.nodes: n.country = "NL" if n.id in ("rotterdam", "berlin") else "SG"
    names = [p.name for p in presets(t)]
    assert any("NL" in n for n in names) and any("fragile" in n for n in names)
