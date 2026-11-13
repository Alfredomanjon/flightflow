"""FlightFlow configuration: a single YAML file, validated at startup.

Lookup order for the file: ``$FLIGHTFLOW_CONFIG`` → ``./config.yaml`` → ``/config/config.yaml``.
Secrets can stay out of the file: ``FLIGHTFLOW_DATABASE_URL`` overrides ``database.url``.
"""

from __future__ import annotations

import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator

DEFAULT_STYLE_URL = "https://tiles.openfreemap.org/styles/positron"


class _Model(BaseModel):
    # Unknown keys are almost always typos: fail loudly instead of ignoring them.
    model_config = ConfigDict(extra="forbid")


class ReceiverConfig(_Model):
    url: str = Field(
        description="Base URL of tar1090/readsb (e.g. http://192.168.1.50/tar1090) or 'mock' for demo data.",
    )
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    aircraft_json_url: str | None = None
    stats_json_url: str | None = None
    timeout_seconds: float = Field(default=5, gt=0, le=60)
    # tar1090 ships an aircraft database (registration + ICAO type). Not available on dump1090-fa.
    aircraft_db: bool = True

    @field_validator("url")
    @classmethod
    def _url(cls, v: str) -> str:
        v = v.strip().rstrip("/")
        if v == "mock":
            return v
        if not re.match(r"^https?://", v):
            raise ValueError("must start with http:// or https:// (or be 'mock')")
        return v

    @property
    def is_mock(self) -> bool:
        return self.url == "mock"

    @property
    def aircraft_url(self) -> str:
        return self.aircraft_json_url or f"{self.url}/data/aircraft.json"

    @property
    def stats_url(self) -> str:
        return self.stats_json_url or f"{self.url}/data/stats.json"


class LocationConfig(_Model):
    home_airport: str | None = None
    home_airport_name: str | None = None
    home_airport_latitude: float | None = Field(default=None, ge=-90, le=90)
    home_airport_longitude: float | None = Field(default=None, ge=-180, le=180)
    nearby_radius_km: float = Field(default=150, gt=0, le=1000)

    @field_validator("home_airport")
    @classmethod
    def _icao(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        v = v.strip().upper()
        if not re.fullmatch(r"[A-Z0-9]{3,4}", v):
            raise ValueError("must be an ICAO airport code such as LEMD")
        return v


class UIConfig(_Model):
    language: Literal["en", "es"] = "en"
    units: Literal["aviation", "metric", "imperial"] = "aviation"


class DatabaseConfig(_Model):
    url: str | None = None

    @field_validator("url")
    @classmethod
    def _url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not re.match(r"^(sqlite|postgres|postgresql)(\+\w+)?://", v):
            raise ValueError("must be a sqlite:/// or postgresql:// URL")
        return v


class CollectorConfig(_Model):
    enabled: bool = True
    interval_seconds: int = Field(default=5, ge=1, le=3600)
    compact_at: str = "00:30"

    @field_validator("compact_at")
    @classmethod
    def _hhmm(cls, v: str) -> str:
        m = re.fullmatch(r"(\d{1,2}):(\d{2})", str(v))
        if not m or int(m[1]) > 23 or int(m[2]) > 59:
            raise ValueError("must be HH:MM in UTC, e.g. '00:30'")
        return f"{int(m[1]):02d}:{m[2]}"

    @property
    def compact_hour(self) -> int:
        return int(self.compact_at.split(":")[0])

    @property
    def compact_minute(self) -> int:
        return int(self.compact_at.split(":")[1])


class MapConfig(_Model):
    enabled: bool = True
    style_url: str = DEFAULT_STYLE_URL
    metar: bool = True
    callsign_radius_km: float = Field(default=50, gt=0, le=1000)


class AnalyticsConfig(_Model):
    enabled: bool = True


class PortraitConfig(_Model):
    enabled: bool = True
    default_radius_km: float = Field(default=40, ge=5, le=100)
    max_planes: int = Field(default=3, ge=1, le=3)


class Settings(_Model):
    receiver: ReceiverConfig
    location: LocationConfig = LocationConfig()
    ui: UIConfig = UIConfig()
    database: DatabaseConfig = DatabaseConfig()
    collector: CollectorConfig = CollectorConfig()
    map: MapConfig = MapConfig()
    analytics: AnalyticsConfig = AnalyticsConfig()
    portrait: PortraitConfig = PortraitConfig()
    airline_logos: bool = False

    # Resolved at load time, not part of the YAML.
    data_dir: Path = Field(default=Path("data"), exclude=True)

    @model_validator(mode="before")
    @classmethod
    def _empty_sections(cls, data: Any) -> Any:
        # A section left with only comments (`database:`) parses as null: treat it as defaults.
        if isinstance(data, dict):
            return {k: ({} if v is None and k != "airline_logos" else v) for k, v in data.items()}
        return data

    @model_validator(mode="after")
    def _home_coords(self) -> Settings:
        loc = self.location
        if (loc.home_airport_latitude is None) != (loc.home_airport_longitude is None):
            raise ValueError("location.home_airport_latitude and home_airport_longitude go together")
        return self

    @property
    def database_url(self) -> str:
        env = os.environ.get("FLIGHTFLOW_DATABASE_URL")
        if env:
            return env
        if self.database.url:
            return self.database.url
        return f"sqlite:///{(self.data_dir / 'flightflow.db').resolve()}"

    @property
    def logos_dir(self) -> Path:
        return self.data_dir / "logos"


class ConfigError(Exception):
    """Raised with a human-readable message when the configuration is missing or invalid."""


def config_path() -> Path:
    env = os.environ.get("FLIGHTFLOW_CONFIG")
    if env:
        return Path(env)
    for candidate in (Path("config.yaml"), Path("/config/config.yaml")):
        if candidate.exists():
            return candidate
    return Path("config.yaml")


def _format_errors(err: ValidationError, path: Path) -> str:
    lines = [f"Invalid configuration in {path}:"]
    for e in err.errors():
        loc = ".".join(str(p) for p in e["loc"]) or "(root)"
        msg = e["msg"].removeprefix("Value error, ")
        if e["type"] == "extra_forbidden":
            msg = "unknown setting (typo?)"
        elif e["type"] == "missing":
            msg = "required setting is missing"
        lines.append(f"  - {loc}: {msg}")
    return "\n".join(lines)


def load_settings(path: Path | None = None, data: dict[str, Any] | None = None) -> Settings:
    if data is None:
        path = path or config_path()
        if not path.exists():
            raise ConfigError(
                f"Configuration file not found: {path}\n"
                "Copy config.example.yaml to config.yaml and fill in your receiver URL and coordinates."
            )
        try:
            data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        except yaml.YAMLError as e:
            raise ConfigError(f"{path} is not valid YAML:\n{e}") from e
        if not isinstance(data, dict):
            raise ConfigError(f"{path} must contain a YAML mapping at the top level")
    try:
        settings = Settings.model_validate(data)
    except ValidationError as e:
        raise ConfigError(_format_errors(e, path or Path("config"))) from e
    settings.data_dir = Path(os.environ.get("FLIGHTFLOW_DATA_DIR", "data"))
    return settings


_override: Settings | None = None


@lru_cache(maxsize=1)
def _cached() -> Settings:
    return load_settings()


def get_settings() -> Settings:
    return _override if _override is not None else _cached()


def set_settings(settings: Settings | None) -> None:
    """Install settings programmatically (tests, CLI)."""
    global _override
    _override = settings
    _cached.cache_clear()


def public_config(s: Settings) -> dict[str, Any]:
    """The non-sensitive part of the configuration, served at /api/config for the web apps."""
    loc = s.location
    home = None
    if loc.home_airport:
        home = {
            "icao": loc.home_airport,
            "name": loc.home_airport_name,
            "lat": loc.home_airport_latitude,
            "lon": loc.home_airport_longitude,
        }
    from . import __version__

    return {
        "version": __version__,
        "language": s.ui.language,
        "units": s.ui.units,
        "receiver": {"lat": s.receiver.latitude, "lon": s.receiver.longitude, "mock": s.receiver.is_mock},
        "home_airport": home,
        "nearby_radius_km": loc.nearby_radius_km,
        "airline_logos": s.airline_logos,
        "services": {
            "collector": s.collector.enabled,
            "map": s.map.enabled,
            "analytics": s.analytics.enabled,
            "portrait": s.portrait.enabled,
        },
        "map": {
            "style_url": s.map.style_url,
            "metar": s.map.metar and loc.home_airport is not None,
            "callsign_radius_km": s.map.callsign_radius_km,
        },
        "portrait": {
            "default_radius_km": s.portrait.default_radius_km,
            "max_planes": s.portrait.max_planes,
        },
    }
