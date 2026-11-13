"""Ingestion: every ``collector.interval_seconds`` store one row per aircraft with a position."""

from __future__ import annotations

import logging
import threading
from datetime import UTC, datetime
from typing import Any

from ..aircraft_db import get_aircraft_db
from ..config import get_settings
from ..db import get_engine, positions
from ..geo import haversine_km
from ..receiver import ReceiverError, get_receiver

logger = logging.getLogger(__name__)

_INT_FIELDS = (
    "alt_geom",
    "baro_rate",
    "geom_rate",
    "ias",
    "tas",
    "wd",
    "ws",
    "oat",
    "tat",
    "nav_altitude_mcp",
    "nic",
)
_FLOAT_FIELDS = (
    "rc",
    "seen_pos",
    "gs",
    "mach",
    "track",
    "track_rate",
    "roll",
    "mag_heading",
    "true_heading",
    "nav_qnh",
    "rssi",
)


def _num(v: Any, kind: type) -> Any:
    if v is None or isinstance(v, bool):
        return None
    try:
        return kind(v)
    except (TypeError, ValueError):
        return None


def _clip(v: Any, n: int) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s[:n] or None


def build_rows(aircraft: list[dict[str, Any]], ts: datetime) -> list[dict[str, Any]]:
    s = get_settings()
    db = get_aircraft_db()
    rows = []
    for ac in aircraft:
        lat, lon = ac.get("lat"), ac.get("lon")
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            continue
        db_reg, db_type = db.lookup(ac.get("hex"))
        alt = ac.get("alt_baro")
        row = {
            "ts": ts,
            "hex": _clip(ac.get("hex"), 6),
            "type": _clip(ac.get("type"), 16),
            "flight": _clip(ac.get("flight"), 10),
            "reg": _clip(ac.get("r") or db_reg, 10),
            "aircraft_type": _clip(ac.get("t") or db_type, 10),
            "squawk": _clip(ac.get("squawk"), 4),
            "category": _clip(ac.get("category"), 4),
            "lat": float(lat),
            "lon": float(lon),
            "distance_km": round(haversine_km(s.receiver.latitude, s.receiver.longitude, lat, lon), 2),
            "alt_baro": 0 if alt == "ground" else _num(alt, int),
            "messages": _num(ac.get("messages"), int),
        }
        for f in _INT_FIELDS:
            row[f] = _num(ac.get(f), int)
        for f in _FLOAT_FIELDS:
            row[f] = _num(ac.get(f), float)
        rows.append(row)
    return rows


def insert_once() -> int:
    data = get_receiver().aircraft()
    rows = build_rows(data.get("aircraft", []), datetime.now(UTC))
    if rows:
        with get_engine().begin() as conn:
            conn.execute(positions.insert(), rows)
    return len(rows)


def insert_loop(stop: threading.Event) -> None:
    """Blocking loop, run in a daemon thread by the app lifespan."""
    interval = get_settings().collector.interval_seconds
    last_error: str | None = None
    while not stop.is_set():
        try:
            n = insert_once()
            if last_error:
                logger.info("Receiver reachable again.")
                last_error = None
            logger.debug("Stored %d positions", n)
        except ReceiverError as e:
            if str(e) != last_error:
                logger.warning("Receiver unavailable: %s", e)
                last_error = str(e)
        except Exception:
            logger.exception("Insert failed")
        stop.wait(interval)
