"""Reads the ADS-B receiver (readsb/tar1090/dump1090) with a short shared cache.

Every consumer — the ingestion loop and the /api/live endpoints used by the web apps —
goes through here, so the receiver is read at most once per cache window no matter how
many browsers are open. ``receiver.url: mock`` produces synthetic traffic instead.
"""

from __future__ import annotations

import math
import threading
import time
from dataclasses import dataclass
from typing import Any

import requests

from .config import Settings

AIRCRAFT_TTL_S = 1.0
STATS_TTL_S = 5.0


class ReceiverError(RuntimeError):
    pass


@dataclass
class _Entry:
    at: float = 0.0
    data: Any = None
    error: str | None = None


class Receiver:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._lock = threading.Lock()
        self._aircraft = _Entry()
        self._stats = _Entry()
        self._session = requests.Session()

    # ── public ────────────────────────────────────────────────────────────────

    def aircraft(self) -> dict[str, Any]:
        return self._cached(self._aircraft, AIRCRAFT_TTL_S, self._fetch_aircraft)

    def stats(self) -> dict[str, Any]:
        return self._cached(self._stats, STATS_TTL_S, self._fetch_stats)

    # ── internals ─────────────────────────────────────────────────────────────

    def _cached(self, entry: _Entry, ttl: float, fetch) -> dict[str, Any]:
        with self._lock:
            now = time.monotonic()
            if now - entry.at < ttl:
                if entry.error:
                    raise ReceiverError(entry.error)
                return entry.data
            try:
                entry.data, entry.error = fetch(), None
            except Exception as e:  # noqa: BLE001 - surfaced as ReceiverError
                entry.data, entry.error = None, f"{type(e).__name__}: {e}"
            entry.at = now
            if entry.error:
                raise ReceiverError(entry.error)
            return entry.data

    def _get_json(self, url: str) -> dict[str, Any]:
        r = self._session.get(url, timeout=self.settings.receiver.timeout_seconds)
        r.raise_for_status()
        return r.json()

    def _fetch_aircraft(self) -> dict[str, Any]:
        if self.settings.receiver.is_mock:
            return mock_aircraft(self.settings.receiver.latitude, self.settings.receiver.longitude)
        data = self._get_json(self.settings.receiver.aircraft_url)
        if not isinstance(data, dict) or not isinstance(data.get("aircraft"), list):
            raise ReceiverError("aircraft.json has no 'aircraft' list")
        return data

    def _fetch_stats(self) -> dict[str, Any]:
        if self.settings.receiver.is_mock:
            return mock_stats()
        return self._get_json(self.settings.receiver.stats_url)


# ── Mock receiver ──────────────────────────────────────────────────────────────

# Synthetic planes that orbit slowly around the receiver, so every app can be tried
# without an antenna. Registrations and hex codes are fictitious.
_MOCK_PLANES = [
    {
        "hex": "f00001",
        "flight": "VLG1834",
        "r": "EC-XAA",
        "t": "A20N",
        "category": "A3",
        "dist": 5.5,
        "brg": 40,
        "alt": 3200,
        "gs": 186,
    },
    {
        "hex": "f00002",
        "flight": "RYR42KP",
        "r": "EI-XAB",
        "t": "B738",
        "category": "A3",
        "dist": 13,
        "brg": 200,
        "alt": 9800,
        "gs": 312,
    },
    {
        "hex": "f00003",
        "flight": "ANE8412",
        "r": "EC-XAC",
        "t": "AT76",
        "category": "A2",
        "dist": 21,
        "brg": 300,
        "alt": 7400,
        "gs": 238,
    },
    {
        "hex": "f00004",
        "flight": "IBE6253",
        "r": "EC-XAD",
        "t": "A359",
        "category": "A5",
        "dist": 34,
        "brg": 120,
        "alt": 36000,
        "gs": 486,
    },
    {
        "hex": "f00005",
        "flight": "DLH1121",
        "r": "D-XAAE",
        "t": "A321",
        "category": "A3",
        "dist": 48,
        "brg": 80,
        "alt": 24000,
        "gs": 420,
    },
    {
        "hex": "f00006",
        "flight": "N650XA",
        "r": "N650XA",
        "t": "GLF6",
        "category": "A2",
        "dist": 62,
        "brg": 10,
        "alt": 41000,
        "gs": 470,
    },
    {
        "hex": "f00007",
        "flight": "",
        "r": "",
        "t": "",
        "category": "A1",
        "dist": 9,
        "brg": 260,
        "alt": 2100,
        "gs": 95,
    },
]


def mock_aircraft(lat0: float, lon0: float, now: float | None = None) -> dict[str, Any]:
    now = time.time() if now is None else now
    out = []
    for i, p in enumerate(_MOCK_PLANES):
        brg = math.radians((p["brg"] + now * (0.6 + i * 0.15)) % 360)
        d = p["dist"] + math.sin(now / 40 + i) * 1.5
        dlat = (d / 111.32) * math.cos(brg)
        dlon = (d / (111.32 * math.cos(math.radians(lat0)))) * math.sin(brg)
        out.append(
            {
                "hex": p["hex"],
                "type": "adsb_icao",
                "flight": p["flight"].ljust(8) if p["flight"] else None,
                "r": p["r"] or None,
                "t": p["t"] or None,
                "category": p["category"],
                "lat": lat0 + dlat,
                "lon": lon0 + dlon,
                "alt_baro": round(p["alt"] + math.sin(now / 30 + i) * 200),
                "gs": round(p["gs"] + math.sin(now / 20 + i) * 4),
                "track": (math.degrees(brg) + 90) % 360,
                "squawk": f"{1000 + i * 111:04d}"[:4],
                "rssi": -10.0 - i * 2.5,
                "messages": int(now) % 100000 + i * 1000,
                "seen": 0.4,
                "seen_pos": 0.8,
            }
        )
    out = [{k: v for k, v in a.items() if v is not None} for a in out]
    return {"now": now, "messages": int(now) % 1_000_000, "aircraft": out}


def mock_stats() -> dict[str, Any]:
    n = len(_MOCK_PLANES)
    return {
        "now": time.time(),
        "gain_db": 49.6,
        "estimated_ppm": 0.4,
        "aircraft_with_pos": n,
        "aircraft_without_pos": 0,
        "last1min": {"local": {"accepted": [60 * 42]}},
    }


_receiver: Receiver | None = None


def get_receiver() -> Receiver:
    global _receiver
    if _receiver is None:
        from .config import get_settings

        _receiver = Receiver(get_settings())
    return _receiver


def set_receiver(r: Receiver | None) -> None:
    global _receiver
    _receiver = r
