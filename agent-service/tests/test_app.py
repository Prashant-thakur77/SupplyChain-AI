from fastapi.testclient import TestClient

from app import app
from tests.test_routing import twin
from tools.twin import twin_cache


def test_ping():
    assert TestClient(app).get("/ping").json()["status"] == "healthy"


def test_reroute_endpoint_is_deterministic(monkeypatch):
    monkeypatch.setattr("app.settings.agent_service_secret", "")
    twin_cache.put(twin())
    r = TestClient(app).post("/reroute", json={"supply_chain_id": "t", "failed_node_ids": ["singapore"]})
    assert r.status_code == 200 and r.json()["candidates"][0]["path"] == ["shenzhen", "colombo", "rotterdam"]


def test_reroute_accepts_inline_twin(monkeypatch):
    monkeypatch.setattr("app.settings.agent_service_secret", "")
    body = {"supply_chain_id": "inline", "failed_node_ids": ["singapore"], "twin": twin().model_dump() | {"supply_chain_id": "inline"}}
    r = TestClient(app).post("/reroute", json=body)
    assert r.status_code == 200 and r.json()["feasible_count"] == 1


def test_secret_enforced(monkeypatch):
    monkeypatch.setattr("app.settings.agent_service_secret", "s3cret")
    twin_cache.put(twin())
    c = TestClient(app)
    assert c.post("/reroute", json={"supply_chain_id": "t", "failed_node_ids": []}).status_code == 401
    assert c.post("/reroute", json={"supply_chain_id": "t", "failed_node_ids": []}, headers={"x-agent-secret": "s3cret"}).status_code == 200
