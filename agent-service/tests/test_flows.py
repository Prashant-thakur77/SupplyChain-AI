from routing import reroute_plan
from schemas import Flow
from tests.test_routing import twin


def test_flow_weighting_on_candidates():
    t = twin()
    t.flows = [Flow(origin="shenzhen", destination="berlin", product="PCBs", units_per_week=500, value_per_unit=40, penalty_per_day=200, inventory_days=10)]
    plan = reroute_plan(t, ["singapore"], [])
    c = plan.candidates[0]
    assert c.weekly_value == 20000 and c.added_cost_per_week == 5000 and c.delay_penalty == 800 and c.days_of_cover == 10


def test_no_flows_leaves_candidates_unweighted():
    plan = reroute_plan(twin(), ["singapore"], [])
    assert plan.candidates[0].weekly_value == 0 and plan.candidates[0].days_of_cover is None
