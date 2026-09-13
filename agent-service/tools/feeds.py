"""Public, keyless hazard feeds — sensing beyond news search.

- GDACS (UN/EC): global disasters (cyclones, floods, earthquakes, volcanoes) with alert level and bounding box.
- USGS: significant earthquakes with coordinates and magnitude.
- NWS (US): active severe-weather alerts by point.
Each tool filters to the twin's sites so Sentinel only sees what could touch this network.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import httpx
from strands import tool

from tools._ctx import chain_id

from enrich import haversine_km
from tools._result import err, ok
from tools.twin import twin_cache

UA = {"User-Agent": "SupplyChainAI/1.0 (ops@supplychain.ai)"}


def _sites(supply_chain_id: str):
    twin = twin_cache.get(supply_chain_id)
    return [(n.id, n.label, n.lat, n.lng) for n in twin.nodes if n.lat is not None and n.lng is not None]


def _near(sites, lat, lng, km):
    return [{"node_id": i, "label": l, "distance_km": round(haversine_km(lat, lng, la, lo))} for i, l, la, lo in sites if haversine_km(lat, lng, la, lo) <= km]


@tool
def gdacs_disasters(supply_chain_id: str = "", radius_km: float = 300, days: int = 7) -> dict:
    """Active/recent natural disasters from GDACS (cyclones, floods, earthquakes, volcanoes, droughts) within radius_km of any site in the twin. Keyless."""
    supply_chain_id = chain_id(supply_chain_id)
    try:
        sites = _sites(supply_chain_id)
        since = datetime.now(timezone.utc) - timedelta(days=days)
        r = httpx.get("https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH", headers=UA, timeout=20,
                      params={"fromDate": since.date().isoformat(), "toDate": datetime.now(timezone.utc).date().isoformat(), "alertlevel": "Orange;Red", "eventlist": "EQ;TC;FL;VO;DR"})
        r.raise_for_status()
        out = []
        for f in r.json().get("features", []):
            p = f.get("properties", {}); g = f.get("geometry", {}) or {}
            coords = g.get("coordinates") or [None, None]
            lng, lat = (coords[0], coords[1]) if isinstance(coords, list) and len(coords) >= 2 else (None, None)
            if lat is None:
                continue
            try:
                when = datetime.fromisoformat(str(p.get("fromdate", "")).replace("Z", "+00:00"))
            except Exception:
                when = datetime.now(timezone.utc)
            if when.tzinfo is None:
                when = when.replace(tzinfo=timezone.utc)
            near = _near(sites, lat, lng, radius_km)
            if near:
                out.append({"id": f"gdacs-{p.get('eventid')}", "type": p.get("eventtype"), "name": p.get("name") or p.get("eventname"), "alert_level": p.get("alertlevel"), "is_current": str(p.get("iscurrent", "")).lower() == "true",
                            "severity_text": (p.get("severitydata") or {}).get("severitytext"), "country": p.get("country"), "from": p.get("fromdate"), "to": p.get("todate"),
                            "lat": lat, "lng": lng, "url": (p.get("url") or {}).get("report") if isinstance(p.get("url"), dict) else p.get("url"), "near_sites": near})
        return ok({"events": out, "count": len(out), "source": "GDACS"})
    except Exception as e:
        return err(f"gdacs_disasters failed: {e}")


@tool
def usgs_earthquakes(supply_chain_id: str = "", min_magnitude: float = 5.5, radius_km: float = 250, days: int = 7) -> dict:
    """Recent earthquakes (USGS) at or above min_magnitude within radius_km of any twin site. Keyless."""
    supply_chain_id = chain_id(supply_chain_id)
    try:
        sites = _sites(supply_chain_id)
        start = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
        r = httpx.get("https://earthquake.usgs.gov/fdsnws/event/1/query", params={"format": "geojson", "starttime": start, "minmagnitude": min_magnitude}, headers=UA, timeout=20)
        r.raise_for_status()
        out = []
        for f in r.json().get("features", []):
            lng, lat = f["geometry"]["coordinates"][:2]
            near = _near(sites, lat, lng, radius_km)
            if near:
                p = f["properties"]
                out.append({"id": f"usgs-{f.get('id')}", "magnitude": p.get("mag"), "place": p.get("place"), "time": datetime.fromtimestamp(p["time"] / 1000, tz=timezone.utc).isoformat(),
                            "tsunami": bool(p.get("tsunami")), "url": p.get("url"), "lat": lat, "lng": lng, "near_sites": near})
        return ok({"events": out, "count": len(out), "source": "USGS"})
    except Exception as e:
        return err(f"usgs_earthquakes failed: {e}")


@tool
def nws_alerts(supply_chain_id: str = "") -> dict:
    """Active US National Weather Service alerts (hurricane, flood, winter storm, tornado…) at each US site in the twin. Keyless; US only."""
    supply_chain_id = chain_id(supply_chain_id)
    try:
        sites = [s for s in _sites(supply_chain_id) if 24 <= s[2] <= 50 and -125 <= s[3] <= -66]  # CONUS bbox
        out = []
        with httpx.Client(headers={**UA, "Accept": "application/geo+json"}, timeout=15) as c:
            for i, label, lat, lng in sites[:25]:
                r = c.get("https://api.weather.gov/alerts/active", params={"point": f"{lat:.3f},{lng:.3f}"})
                if r.status_code != 200:
                    continue
                for f in r.json().get("features", []):
                    p = f.get("properties", {})
                    if p.get("severity") in ("Severe", "Extreme"):
                        out.append({"id": f"nws-{p.get('id', '')[-12:]}", "node_id": i, "site": label, "event": p.get("event"), "severity": p.get("severity"), "headline": p.get("headline"),
                                    "onset": p.get("onset"), "ends": p.get("ends"), "url": p.get("@id") or f.get("id")})
        return ok({"alerts": out, "count": len(out), "sites_checked": len(sites), "source": "NWS"})
    except Exception as e:
        return err(f"nws_alerts failed: {e}")
