from resilience import audit
from schemas import TwinEdge
from tests.test_routing import twin


def test_audit_ranks_spof_first():
    t = twin()
    t.edges = [e for e in t.edges if e.id not in ("e3", "e4")]  # only path is via singapore
    r = audit(t)
    assert "SINGAPORE" in r.single_points_of_failure and r.cases[0].label == "SINGAPORE" and r.cases[0].lanes_cut == 1
    assert r.score < 60


def test_audit_redundant_network_scores_higher():
    t = twin()
    t.edges.append(TwinEdge(id="e6", source="colombo", target="berlin", cost=6000, transit_days=25, mode="sea"))
    r = audit(t)
    assert r.score > audit(twin()).score or r.single_points_of_failure == []
    assert r.total_lanes == 1 and any(c.kind == "lane" for c in r.cases)
