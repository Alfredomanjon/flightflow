"""Optional airline logos.

Airline logos are trademarks of their owners, so FlightFlow does not ship them. With
``airline_logos: true`` they are downloaded once into ``<data>/logos/`` from the public
images.kiwi.com CDN and served at ``/logos/<ICAO>.png``. Without them, the apps show a
coloured badge with the airline code.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import requests

from .config import Settings

logger = logging.getLogger(__name__)

SOURCE = "https://images.kiwi.com/airlines/64/{iata}.png"


def airlines_file() -> Path | None:
    candidates = [
        os.environ.get("FLIGHTFLOW_AIRLINES_JSON"),
        Path(__file__).parent / "static" / "airlines.json",
        Path(__file__).resolve().parents[3] / "packages" / "shared" / "src" / "data" / "airlines.json",
    ]
    for c in candidates:
        if c and Path(c).exists():
            return Path(c)
    return None


def download_logos(settings: Settings, force: bool = False) -> int:
    src = airlines_file()
    if src is None:
        logger.warning("airlines.json not found; cannot download logos")
        return 0
    airlines: dict[str, dict] = json.loads(src.read_text(encoding="utf-8"))
    out = settings.logos_dir
    out.mkdir(parents=True, exist_ok=True)
    count = 0
    for icao, info in airlines.items():
        iata = info.get("iata")
        dest = out / f"{icao}.png"
        if not iata or (dest.exists() and not force):
            continue
        try:
            r = requests.get(SOURCE.format(iata=iata), timeout=10)
            if r.status_code == 200 and r.headers.get("content-type", "").startswith("image/"):
                dest.write_bytes(r.content)
                count += 1
            else:
                logger.debug("logo %s (%s): HTTP %s", icao, iata, r.status_code)
        except requests.RequestException as e:
            logger.debug("logo %s: %s", icao, e)
    logger.info("Airline logos: %d downloaded into %s", count, out)
    return count
