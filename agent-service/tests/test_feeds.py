import httpx

from tools import feeds
from tools.twin import twin_cache
from schemas import Twin, TwinNode


def _twin():
    t = Twin(supply_chain_id="feeds", nodes=[TwinNode(id="hou", label="Houston DC", type="warehouse", lat=29.76, lng=-95.37), TwinNode(id="sin", label="Singapore", type="port", lat=1.29, lng=103.85)], edges=[])
    twin_cache.put(t)
    return t


def test_usgs_filters_to_nearby_sites(monkeypatch):
    _twin()
    payload = {"features": [
        {"id": "q1", "geometry": {"coordinates": [-95.0, 29.5, 10]}, "properties": {"mag": 6.1, "place": "near Houston", "time": 1_700_000_000_000, "tsunami": 0, "url": "https://usgs/q1"}},
        {"id": "q2", "geometry": {"coordinates": [140.0, 35.0, 10]}, "properties": {"mag": 7.0, "place": "Japan", "time": 1_700_000_000_000, "tsunami": 1, "url": "https://usgs/q2"}},
    ]}
    monkeypatch.setattr(feeds.httpx, "get", lambda *a, **k: httpx.Response(200, json=payload, request=httpx.Request("GET", "https://x")))
    out = feeds.usgs_earthquakes("feeds")["content"][0]["json"]
    assert out["count"] == 1 and out["events"][0]["near_sites"][0]["node_id"] == "hou"


def test_gdacs_maps_alert_level(monkeypatch):
    _twin()
    payload = {"features": [{"geometry": {"coordinates": [103.9, 1.4]}, "properties": {"eventid": 9, "eventtype": "TC", "name": "Cyclone X", "alertlevel": "Orange", "fromdate": "2099-01-01T00:00:00", "iscurrent": True, "country": "SG", "url": {"report": "https://gdacs/9"}}}]}
    monkeypatch.setattr(feeds.httpx, "get", lambda *a, **k: httpx.Response(200, json=payload, request=httpx.Request("GET", "https://x")))
    out = feeds.gdacs_disasters("feeds")["content"][0]["json"]
    assert out["count"] == 1 and out["events"][0]["alert_level"] == "Orange" and out["events"][0]["near_sites"][0]["node_id"] == "sin"


def test_feed_failure_is_an_error_result(monkeypatch):
    _twin()
    def boom(*a, **k): raise httpx.ConnectError("down")
    monkeypatch.setattr(feeds.httpx, "get", boom)
    assert feeds.usgs_earthquakes("feeds")["status"] == "error"
