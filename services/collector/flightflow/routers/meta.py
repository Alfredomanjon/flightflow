"""/api/config (public settings for the web apps), /api/metar and /api/health."""

import threading
import time

import requests
from fastapi import APIRouter, HTTPException

from ..config import get_settings, public_config

router = APIRouter()

METAR_URL = "https://aviationweather.gov/api/data/metar"
METAR_TTL_S = 300
_metar_lock = threading.Lock()
_metar_cache: dict[str, tuple[float, dict | None]] = {}


@router.get("/config")
def get_config():
    return public_config(get_settings())


@router.get("/health")
def health():
    return {"status": "ok"}


def _fetch_metar(icao: str) -> dict | None:
    r = requests.get(METAR_URL, params={"ids": icao, "format": "json"}, timeout=10)
    r.raise_for_status()
    data = r.json() if r.content else []
    if not isinstance(data, list) or not data:
        return None
    m = data[0]
    return {
        "icao": m.get("icaoId"),
        "raw": m.get("rawOb"),
        "observedAt": m.get("reportTime"),
        "temp": m.get("temp"),
        "dewpoint": m.get("dewp"),
        "wdir": m.get("wdir"),
        "wspd": m.get("wspd"),
        "altim": m.get("altim"),
    }


@router.get("/metar")
def get_metar():
    """Latest METAR of the home airport, cached for 5 minutes."""
    s = get_settings()
    icao = s.location.home_airport
    if not (s.map.metar and icao):
        raise HTTPException(status_code=404, detail="METAR disabled or no location.home_airport configured")
    with _metar_lock:
        hit = _metar_cache.get(icao)
        if hit and time.monotonic() - hit[0] < METAR_TTL_S:
            return hit[1]
        try:
            value = _fetch_metar(icao)
        except (requests.RequestException, ValueError) as e:
            if hit:  # serve stale data rather than nothing
                return hit[1]
            raise HTTPException(status_code=502, detail=f"METAR source unavailable: {e}") from e
        _metar_cache[icao] = (time.monotonic(), value)
        return value
