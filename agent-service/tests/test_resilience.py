from resilience import audit
from schemas import TwinEdge
from tests.test_routing import twin


def test_audit_ranks_spof_first():
    t = twin()
    t.edges = [e for e in t.edges if e.id not in ("e3", "e4")]  # only path is via singapore
    r = audit(t)
    assert r.single_points_of_failure == ["SINGAPORE", "ROTTERDAM"] and set(r.single_source_sites) == {"SHENZHEN", "BERLIN"}
    assert r.cases[0].kind == "node" and r.cases[0].lanes_cut == 1 and r.score <= 50


def test_audit_redundant_network_scores_higher():
    t = twin()
    t.edges.append(TwinEdge(id="e6", source="colombo", target="berlin", cost=6000, transit_days=25, mode="sea"))
    r = audit(t)
    assert r.single_points_of_failure == [] and r.score >= audit(twin()).score
    assert r.total_lanes == 1 and any(c.kind == "lane" for c in r.cases)
