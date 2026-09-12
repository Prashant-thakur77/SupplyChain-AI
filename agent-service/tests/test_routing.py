from routing import blast_radius, build_graph, k_best_routes, reroute_plan, shortest_path
from schemas import Twin, TwinEdge, TwinNode


def twin() -> Twin:
    def n(i, t="port"):
        return TwinNode(id=i, label=i.upper(), type=t)

    def e(i, s, t, c, d, m="sea"):
        return TwinEdge(id=i, source=s, target=t, cost=c, transit_days=d, mode=m)

    return Twin(
        supply_chain_id="t",
        nodes=[n("shenzhen", "factory"), n("singapore"), n("colombo"), n("rotterdam"), n("berlin", "warehouse")],
        edges=[
            e("e1", "shenzhen", "singapore", 1000, 5),
            e("e2", "singapore", "rotterdam", 4000, 20),
            e("e3", "shenzhen", "colombo", 1500, 7),
            e("e4", "colombo", "rotterdam", 4500, 22),
            e("e5", "rotterdam", "berlin", 300, 1, "road"),
        ],
    )


def test_shortest_path_baseline():
    p = shortest_path(build_graph(twin()), "shenzhen", "berlin")
    assert p.path == ["shenzhen", "singapore", "rotterdam", "berlin"] and p.cost == 5300


def test_blast_radius_singapore():
    br = blast_radius(twin(), ["singapore"], [])
    assert set(br.downstream_node_ids) == {"rotterdam", "berlin"}
    assert set(br.broken_edge_ids) == {"e1", "e2"}
    assert ("shenzhen", "rotterdam") in br.severed_pairs


def test_k_best_avoids_failed():
    c = k_best_routes(twin(), "shenzhen", "berlin", ["singapore"], [], k=3)
    assert c[0].path == ["shenzhen", "colombo", "rotterdam", "berlin"]
    assert c[0].added_cost == 1000 and c[0].added_days == 4 and c[0].feasible


def test_k_best_returns_multiple_distinct_paths():
    t = twin()
    t.edges.append(TwinEdge(id="e6", source="colombo", target="berlin", cost=6000, transit_days=25, mode="sea"))
    c = k_best_routes(t, "shenzhen", "berlin", ["singapore"], [], k=3)
    assert len(c) == 2 and c[0].path != c[1].path and c[0].cost <= c[1].cost


def test_reroute_plan_infeasible():
    t = twin()
    t.edges = [e for e in t.edges if e.id not in ("e3", "e4")]
    plan = reroute_plan(t, ["singapore"], [])
    assert plan.infeasible_count >= 1 and plan.severity == "CRITICAL"


def test_reroute_plan_feasible_severity():
    plan = reroute_plan(twin(), ["singapore"], [])
    assert plan.severed_pairs == [("shenzhen", "berlin")]
    assert plan.feasible_count == 1 and plan.infeasible_count == 0 and plan.severity == "MEDIUM"
    assert plan.candidates[0].path == ["shenzhen", "colombo", "rotterdam", "berlin"] and plan.candidates[0].added_cost == 1000


def test_lane_not_using_failed_node_is_not_rerouted():
    plan = reroute_plan(twin(), ["colombo"], [])
    assert plan.severed_pairs == [] and plan.candidates == [] and plan.severity == "LOW"


def test_lanes_multiple_sources_and_sinks():
    from routing import lanes_through
    t = twin()
    t.nodes.append(TwinNode(id="hanoi", label="HANOI", type="factory"))
    t.nodes.append(TwinNode(id="paris", label="PARIS", type="warehouse"))
    t.edges += [TwinEdge(id="e6", source="hanoi", target="singapore", cost=800, transit_days=4),
                TwinEdge(id="e7", source="rotterdam", target="paris", cost=400, transit_days=1, mode="road")]
    lanes = lanes_through(t, ["singapore"], [])
    # Both factories reach both warehouses through Singapore on their healthy shortest path.
    assert set(lanes) == {("shenzhen", "berlin"), ("shenzhen", "paris"), ("hanoi", "berlin"), ("hanoi", "paris")}


def test_lanes_edge_failure_only():
    from routing import lanes_through
    plan = reroute_plan(twin(), [], ["e2"])
    assert plan.severed_pairs == [("shenzhen", "berlin")] and plan.candidates[0].path == ["shenzhen", "colombo", "rotterdam", "berlin"]


def test_lanes_cyclic_twin_falls_back_to_segments():
    from routing import lanes_through
    t = Twin(supply_chain_id="c", nodes=[TwinNode(id=i, label=i) for i in "abc"],
             edges=[TwinEdge(id="ab", source="a", target="b", cost=1, transit_days=1), TwinEdge(id="bc", source="b", target="c", cost=1, transit_days=1),
                    TwinEdge(id="ca", source="c", target="a", cost=1, transit_days=1), TwinEdge(id="ac", source="a", target="c", cost=5, transit_days=5)])
    lanes = lanes_through(t, ["b"], [])
    assert lanes == [("a", "c")]
