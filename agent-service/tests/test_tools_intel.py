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


def test_search_news_without_key_uses_grounded_fallback(monkeypatch):
    monkeypatch.setattr("tools.intel.settings.tavily_api_key", "")
    monkeypatch.setattr("tools.intel.grounded_news", lambda q, n: [{"title": "t", "url": "https://x/y", "credibility": 0.7}])
    out = search_news(query="x")
    assert out["status"] == "success" and out["content"][0]["json"]["provider"] == "gemini-google-search"


def test_search_news_grounded_failure_is_error(monkeypatch):
    monkeypatch.setattr("tools.intel.settings.tavily_api_key", "")
    def boom(q, n): raise RuntimeError("quota")
    monkeypatch.setattr("tools.intel.grounded_news", boom)
    assert search_news(query="x")["status"] == "error"


@respx.mock
def test_search_news_tavily_432_falls_back(monkeypatch):
    monkeypatch.setattr("tools.intel.settings.tavily_api_key", "k")
    respx.post("https://api.tavily.com/search").mock(return_value=httpx.Response(432))
    monkeypatch.setattr("tools.intel.grounded_news", lambda q, n: [{"title": "t", "url": "https://x/y", "credibility": 0.7}])
    out = search_news(query="x")
    assert out["status"] == "success" and "fallback_reason" in out["content"][0]["json"]
