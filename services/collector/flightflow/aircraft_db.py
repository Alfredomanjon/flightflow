"""Registration and ICAO type lookup from tar1090's bundled aircraft database.

Optional: only tar1090 serves this database. With other receivers (dump1090-fa, a bare
readsb) or ``receiver.aircraft_db: false`` lookups simply return ``(None, None)``.
Discovery failures are retried at most every ``RETRY_S`` seconds.
"""

from __future__ import annotations

import gzip
import json
import logging
import re
import threading
import time

import requests

from .config import Settings

logger = logging.getLogger(__name__)

RETRY_S = 600


class AircraftDb:
    def __init__(self, settings: Settings):
        r = settings.receiver
        self.enabled = r.aircraft_db and not r.is_mock
        self.base = r.url
        self.timeout = r.timeout_seconds
        self._db_url: str | None = None
        self._next_try = 0.0
        self._blocks: dict[str, dict | None] = {}
        self._cache: dict[str, tuple[str | None, str | None]] = {}
        self._lock = threading.Lock()
        self._warned = False

    def _discover(self) -> bool:
        if self._db_url is not None:
            return True
        if not self.enabled or time.monotonic() < self._next_try:
            return False
        self._next_try = time.monotonic() + RETRY_S
        try:
            html = requests.get(f"{self.base}/", timeout=self.timeout).text
            m = re.search(r'"(db-[0-9a-f]+)"', html)
            if m:
                self._db_url = f"{self.base}/{m.group(1)}"
                logger.info("tar1090 aircraft database found at %s", self._db_url)
                return True
            reason = "no db-<hash> folder referenced by the receiver page (not tar1090?)"
        except requests.RequestException as e:
            reason = str(e)
        if not self._warned:
            logger.warning(
                "Aircraft database unavailable (%s). Registrations/types will come only from the "
                "receiver feed. Set receiver.aircraft_db: false to silence this.",
                reason,
            )
            self._warned = True
        return False

    def _block(self, prefix: str) -> dict | None:
        if prefix in self._blocks:
            return self._blocks[prefix]
        data = None
        try:
            r = requests.get(f"{self._db_url}/{prefix}.js", timeout=self.timeout)
            if r.status_code == 200:
                try:
                    data = r.json()
                except ValueError:
                    data = json.loads(gzip.decompress(r.content).decode("utf-8"))
        except (requests.RequestException, OSError, ValueError) as e:
            logger.debug("aircraft db block %s: %s", prefix, e)
        self._blocks[prefix] = data
        return data

    def lookup(self, hex_code: str | None) -> tuple[str | None, str | None]:
        """Return ``(registration, icao_type)`` for an ICAO hex address."""
        if not hex_code:
            return None, None
        h = hex_code.upper().lstrip("~")
        with self._lock:
            if h in self._cache:
                return self._cache[h]
            if not self._discover():
                return None, None
            result: tuple[str | None, str | None] = (None, None)
            prefix, rest = h[0], h[1:]
            data = self._block(prefix)
            while data is not None:
                if rest in data:
                    entry = data[rest] or []
                    result = (entry[0] if len(entry) > 0 else None, entry[1] if len(entry) > 1 else None)
                    break
                children = data.get("children", [])
                if not rest or (prefix + rest[0]) not in children:
                    break
                prefix, rest = prefix + rest[0], rest[1:]
                data = self._block(prefix)
            self._cache[h] = result
            return result

    def lookup_type(self, hex_code: str | None) -> str | None:
        return self.lookup(hex_code)[1]


_db: AircraftDb | None = None


def get_aircraft_db() -> AircraftDb:
    global _db
    if _db is None:
        from .config import get_settings

        _db = AircraftDb(get_settings())
    return _db


def set_aircraft_db(db: AircraftDb | None) -> None:
    global _db
    _db = db
