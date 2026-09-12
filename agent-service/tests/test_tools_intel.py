import httpx
import respx

from tools.intel import search_news


@respx.mock
def test_search_news_maps_sources(monkeypatch):
    monkeypatch.setattr("tools.intel.settings.tavily_api_key", "k")
    respx.post("https://api.tavily.com/search").mock(
        return_value=httpx.Response(200, json={"results": [
            {"title": "Port of Singapore closed", "url": "https://x/a", "published_date": "2026-09-13", "score": 0.9, "content": "Closure..."}
        ]})
    )
    out = search_news(query="Singapore port")
    assert out["status"] == "success" and out["content"][0]["json"]["results"][0]["credibility"] == 0.9


def test_search_news_without_key(monkeypatch):
    monkeypatch.setattr("tools.intel.settings.tavily_api_key", "")
    assert search_news(query="x")["status"] == "error"
