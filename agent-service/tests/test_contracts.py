import contracts as ct


def test_penalty_respects_grace_and_cap():
    c = {"grace_days": 2, "penalty_per_day_usd": 1000, "penalty_cap_usd": 2500}
    assert ct.penalty_for(c, 1) == 0
    assert ct.penalty_for(c, 4) == 2000
    assert ct.penalty_for(c, 10) == 2500


def test_exposure_filters_by_site_and_sorts():
    cs = [{"counterparty": "RetailCo", "kind": "customer", "node_id": "berlin", "grace_days": 0, "penalty_per_day_usd": 500, "penalty_cap_usd": None},
          {"counterparty": "OtherCo", "kind": "customer", "node_id": "paris", "grace_days": 0, "penalty_per_day_usd": 900, "penalty_cap_usd": None},
          {"counterparty": "Carrier", "kind": "carrier", "node_id": None, "grace_days": 1, "penalty_per_day_usd": 100, "penalty_cap_usd": None}]
    ex = ct.exposure(cs, 5, ["berlin"], {"berlin": "Berlin DC"})
    assert ex.contracts_considered == 2 and ex.total_usd == 2500 + 400
    assert ex.lines[0]["counterparty"] == "RetailCo" and ex.lines[0]["site"] == "Berlin DC"
