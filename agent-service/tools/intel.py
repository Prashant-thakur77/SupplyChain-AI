"""External intelligence tools: Tavily news search and OpenWeather."""
from __future__ import annotations

import httpx
from strands import tool

from config import settings
from tools._result import err, ok


@tool
def search_news(query: str, max_results: int = 5) -> dict:
    """Search the last 7 days of global news for supply-chain disruptions (ports, strikes, storms, sanctions, supplier failures, canal blockages). Returns title, url, published date, credibility and a snippet."""
    if not settings.tavily_api_key:
        return err("TAVILY_API_KEY not configured")
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
        return ok({"query": query, "results": results})
    except Exception as e:
        return err(f"search_news failed: {e}")


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
