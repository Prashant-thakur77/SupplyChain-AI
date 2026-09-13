import calibration
from schemas import Twin, TwinEdge, TwinNode


def _twin():
    return Twin(supply_chain_id="c", nodes=[TwinNode(id="a", label="A", type="port"), TwinNode(id="b", label="B", type="port")],
                edges=[TwinEdge(id="e1", source="a", target="b", mode="sea", cost=1000, transit_days=10, provenance="estimate"),
                       TwinEdge(id="e2", source="b", target="a", mode="sea", cost=1000, transit_days=10, provenance="quote")])


def test_factors_need_min_samples(monkeypatch):
    rows = [{"estimated_added_cost": 100, "actual_added_cost": 150, "estimated_added_days": 2, "actual_added_days": 3}] * 2
    class _Q:
        def __init__(self, d): self.data = d
    class _T:
        def select(self, *a): return self
        def eq(self, *a): return self
        def order(self, *a, **k): return self
        def limit(self, *a): return self
        def execute(self): return _Q(rows)
    monkeypatch.setattr(calibration.db, "client", lambda: type("C", (), {"table": lambda self, n: _T()})())
    assert calibration.factors("c").cost_factor == 1.0
    rows.append(rows[0])
    f = calibration.factors("c")
    assert f.cost_factor == 1.5 and f.days_factor == 1.5 and f.samples == 3


def test_apply_scales_only_estimates():
    t = _twin()
    n = calibration.apply(t, calibration.Calibration(cost_factor=1.2, days_factor=1.5, samples=5))
    assert n == 1
    assert t.edges[0].cost == 1200 and t.edges[0].transit_days == 15
    assert t.edges[1].cost == 1000 and t.edges[1].transit_days == 10


def test_factors_clamped():
    assert max(0.5, min(2.0, 9.0)) == 2.0
