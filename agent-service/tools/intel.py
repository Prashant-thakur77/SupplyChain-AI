"""External intelligence tools: Tavily news search and OpenWeather."""
from __future__ import annotations

import json
import re

import httpx
from strands import tool

from config import settings
from tools._result import err, ok


_JSON_ARRAY = re.compile(r"\[.*\]", re.S)


def grounded_news(query: str, max_results: int = 5) -> list[dict]:
    """News via Gemini's built-in Google Search grounding — no third-party search key needed.

    A one-shot Strands Agent whose model carries the GoogleSearch tool; it must answer with a JSON array we parse.
    """
    from strands import Agent

    from models import invoke_with_retry

    if settings.agent_model_provider != "gemini":
        raise RuntimeError("Google Search grounding needs the gemini provider; set TAVILY_API_KEY for other providers")

    prompt = (
        f"Search the web for news from the last 7 days about: {query}\n"
        f"Return ONLY a JSON array (max {max_results} items) of objects with keys title, url, published_at (ISO date or null), "
        "snippet (<= 300 chars), credibility (0-1, higher for major outlets). Use real URLs from your search results. "
        "If nothing relevant was published in the last 7 days, return []."
    )

    def attempt(model):
        agent = Agent(name="grounded_news", model=model, callback_handler=None,
                      system_prompt="You are a news research tool. You always answer with a JSON array and nothing else.")
        text = str(agent(prompt))
        m = _JSON_ARRAY.search(text)
        items = json.loads(m.group(0)) if m else []
        return [x for x in items if isinstance(x, dict) and x.get("url")]

    return invoke_with_retry("sentinel", attempt, google_search=True)


@tool
def search_news(query: str, max_results: int = 5) -> dict:
    """Search the last 7 days of global news for supply-chain disruptions (ports, strikes, storms, sanctions, supplier failures, canal blockages). Returns title, url, published date, credibility and a snippet."""
    if not settings.tavily_api_key or settings.news_provider == "gemini":
        try:
            return ok({"query": query, "results": grounded_news(query, max_results), "provider": "gemini-google-search"})
        except Exception as e:  # noqa: BLE001
            return err(f"search_news failed: {e}")
    try:
        r = httpx.post(
            "https://api.tavily.com/search",
            json={"api_key": settings.tavily_api_key, "query": query, "search_depth": "basic", "topic": "news", "days": 7, "max_results": max_results},
            timeout=20,
        )
        r.raise_for_status()
        results = [
            {
                "title": x.get("title"),
                "url": x.get("url"),
                "published_at": x.get("published_date"),
                "credibility": round(float(x.get("score") or 0.5), 2),
                "snippet": (x.get("content") or "")[:400],
            }
            for x in r.json().get("results", [])
        ]
        return ok({"query": query, "results": results, "provider": "tavily"})
    except Exception as e:
        # Tavily quota (432) or outage → fall back to Google Search grounding so Sentinel keeps working.
        try:
            return ok({"query": query, "results": grounded_news(query, max_results), "provider": "gemini-google-search", "fallback_reason": str(e)[:80]})
        except Exception as e2:  # noqa: BLE001
            return err(f"search_news failed: {e}; grounded fallback failed: {e2}")


@tool
def get_weather(lat: float, lng: float) -> dict:
    """Current weather and a severe-weather flag at a coordinate (OpenWeather). Use for ports, factories and route midpoints."""
    if not settings.openweather_api_key:
        return err("OPENWEATHER_API_KEY not configured")
    try:
        r = httpx.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"lat": lat, "lon": lng, "appid": settings.openweather_api_key, "units": "metric"},
            timeout=15,
        )
        r.raise_for_status()
        j = r.json()
        w = (j.get("weather") or [{}])[0]
        m = j.get("main", {})
        wind = j.get("wind", {})
        severe = int(w.get("id", 800)) < 600 or float(wind.get("speed") or 0) > 17
        return ok({
            "condition": w.get("main"), "description": w.get("description"), "temp_c": m.get("temp"),
            "wind_ms": wind.get("speed"), "visibility_m": j.get("visibility"), "severe": severe, "place": j.get("name"),
        })
    except Exception as e:
        return err(f"get_weather failed: {e}")
