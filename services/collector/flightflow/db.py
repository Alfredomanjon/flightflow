"""Database access: SQLAlchemy Core tables + a few portable SQL helpers.

The same queries run on SQLite (default) and PostgreSQL. The handful of constructs that
differ between the two (day/hour of a timestamp, minutes between timestamps) are
compiled per dialect below. All timestamps are stored and returned in UTC.
"""

from __future__ import annotations

import logging
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import (
    BigInteger,
    Column,
    Date,
    DateTime,
    Engine,
    Float,
    Index,
    Integer,
    MetaData,
    SmallInteger,
    String,
    Table,
    create_engine,
    event,
    inspect,
)
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.expression import FunctionElement
from sqlalchemy.types import TypeDecorator

logger = logging.getLogger(__name__)


# ── Types ──────────────────────────────────────────────────────────────────────


class UTCDateTime(TypeDecorator):
    """Timezone-aware UTC datetimes on every backend.

    PostgreSQL stores TIMESTAMPTZ. SQLite has no timezone support, so values are stored as
    naive UTC and re-tagged as UTC when read back.
    """

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("naive datetime passed to the database; use datetime.now(UTC)")
        value = value.astimezone(UTC)
        return value.replace(tzinfo=None) if dialect.name == "sqlite" else value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):  # raw SQLite string from an untyped expression
            value = datetime.fromisoformat(value)
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


# BIGSERIAL on PostgreSQL, INTEGER PRIMARY KEY (rowid alias, autoincrement) on SQLite.
BigId = BigInteger().with_variant(Integer(), "sqlite")


# ── Schema ─────────────────────────────────────────────────────────────────────

metadata = MetaData()

positions = Table(
    "positions",
    metadata,
    Column("id", BigId, primary_key=True, autoincrement=True),
    Column("ts", UTCDateTime(), nullable=False),
    Column("hex", String(6)),
    # Source of the position as reported by readsb (adsb_icao, mlat, tisb_other…).
    Column("type", String(16)),
    Column("flight", String(10)),
    Column("reg", String(10)),
    Column("aircraft_type", String(10)),
    Column("squawk", String(4)),
    Column("category", String(4)),
    Column("lat", Float),
    Column("lon", Float),
    Column("distance_km", Float),
    Column("nic", SmallInteger),
    Column("rc", Float),
    Column("seen_pos", Float),
    Column("alt_baro", Integer),
    Column("alt_geom", Integer),
    Column("baro_rate", Integer),
    Column("geom_rate", Integer),
    Column("gs", Float),
    Column("ias", Integer),
    Column("tas", Integer),
    Column("mach", Float),
    Column("track", Float),
    Column("track_rate", Float),
    Column("roll", Float),
    Column("mag_heading", Float),
    Column("true_heading", Float),
    Column("wd", Integer),
    Column("ws", Integer),
    Column("oat", Integer),
    Column("tat", Integer),
    Column("nav_qnh", Float),
    Column("nav_altitude_mcp", Integer),
    Column("rssi", Float),
    Column("messages", BigInteger),
    Index("idx_positions_ts", "ts"),
    Index("idx_positions_hex", "hex"),
)

flights_summary = Table(
    "flights_summary",
    metadata,
    Column("id", BigId, primary_key=True, autoincrement=True),
    Column("date", Date, nullable=False),
    Column("hex", String(6)),
    Column("flight", String(10)),
    Column("reg", String(10)),
    Column("type", String(16)),
    Column("category", String(4)),
    Column("aircraft_type", String(10)),
    Column("first_seen", UTCDateTime(), nullable=False),
    Column("last_seen", UTCDateTime(), nullable=False),
    Column("detection_count", Integer, nullable=False),
    Column("avg_lat", Float),
    Column("avg_lon", Float),
    Column("min_distance_km", Float),
    Column("max_distance_km", Float),
    Column("min_alt_baro", Integer),
    Column("max_alt_baro", Integer),
    Column("avg_gs", Float),
    Column("max_gs", Float),
    Column("avg_rssi", Float),
    Index("idx_flights_summary_date", "date"),
    Index("idx_flights_summary_date_hex", "date", "hex"),
    Index("idx_flights_summary_aircraft_type", "aircraft_type"),
)

daily_stats = Table(
    "daily_stats",
    metadata,
    Column("date", Date, primary_key=True),
    Column("unique_aircraft", Integer, nullable=False),
    Column("total_positions", Integer, nullable=False),
    Column("busiest_hour", SmallInteger),
    Column("avg_distance_km", Float),
    Column("max_distance_km", Float),
    Column("most_common_type", String(16)),
)


# ── Portable SQL helpers ───────────────────────────────────────────────────────


class utc_day(FunctionElement):
    """Calendar day (UTC) of a timestamp column."""

    type = Date()
    inherit_cache = True
    name = "utc_day"


@compiles(utc_day, "postgresql")
def _utc_day_pg(element, compiler, **kw):
    return "CAST((%s AT TIME ZONE 'UTC') AS DATE)" % compiler.process(element.clauses, **kw)


@compiles(utc_day, "sqlite")
def _utc_day_sqlite(element, compiler, **kw):
    return "date(%s)" % compiler.process(element.clauses, **kw)


class utc_hour(FunctionElement):
    """Hour of day (0-23, UTC) of a timestamp column."""

    type = Integer()
    inherit_cache = True
    name = "utc_hour"


@compiles(utc_hour, "postgresql")
def _utc_hour_pg(element, compiler, **kw):
    return "CAST(EXTRACT(HOUR FROM (%s AT TIME ZONE 'UTC')) AS INTEGER)" % compiler.process(
        element.clauses, **kw
    )


@compiles(utc_hour, "sqlite")
def _utc_hour_sqlite(element, compiler, **kw):
    return "CAST(strftime('%%H', %s) AS INTEGER)" % compiler.process(element.clauses, **kw)


class minutes_between(FunctionElement):
    """Whole minutes from the first timestamp to the second."""

    type = Integer()
    inherit_cache = True
    name = "minutes_between"


@compiles(minutes_between, "postgresql")
def _minutes_pg(element, compiler, **kw):
    a, b = list(element.clauses)
    return "CAST(EXTRACT(EPOCH FROM (%s - %s)) / 60 AS INTEGER)" % (
        compiler.process(b, **kw),
        compiler.process(a, **kw),
    )


@compiles(minutes_between, "sqlite")
def _minutes_sqlite(element, compiler, **kw):
    a, b = list(element.clauses)
    return "CAST((julianday(%s) - julianday(%s)) * 1440 AS INTEGER)" % (
        compiler.process(b, **kw),
        compiler.process(a, **kw),
    )


def day_bounds(d: date) -> tuple[datetime, datetime]:
    """[start, end) of a UTC day, for index-friendly range filters on timestamps."""
    start = datetime.combine(d, time.min, tzinfo=UTC)
    return start, start + timedelta(days=1)


def utc_today() -> date:
    return datetime.now(UTC).date()


def as_date(value) -> date | None:
    """Normalise a DATE result (SQLite may hand back strings for computed expressions)."""
    if value is None or isinstance(value, date):
        return value
    return date.fromisoformat(str(value))


# ── Engine ─────────────────────────────────────────────────────────────────────

_engine: Engine | None = None


def normalize_url(url: str) -> str:
    """Pin the PostgreSQL driver to psycopg 3, whatever SQLAlchemy's default for postgresql:// is."""
    for prefix in ("postgresql://", "postgres://", "postgresql+psycopg2://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def make_engine(url: str) -> Engine:
    url = normalize_url(url)
    if url.startswith("sqlite"):
        if ":///" in url and not url.endswith(":memory:"):
            from pathlib import Path

            db_file = Path(url.split(":///", 1)[1])
            db_file.parent.mkdir(parents=True, exist_ok=True)
        engine = create_engine(url, connect_args={"check_same_thread": False, "timeout": 30})

        @event.listens_for(engine, "connect")
        def _sqlite_pragmas(dbapi_conn, _):
            cur = dbapi_conn.cursor()
            cur.execute("PRAGMA journal_mode=WAL")
            cur.execute("PRAGMA synchronous=NORMAL")
            cur.execute("PRAGMA foreign_keys=ON")
            cur.close()

        return engine
    return create_engine(url, pool_size=5, max_overflow=5, pool_pre_ping=True, pool_recycle=1800)


def init_engine(url: str) -> Engine:
    global _engine
    if _engine is not None:
        _engine.dispose()
    _engine = make_engine(url)
    return _engine


def get_engine() -> Engine:
    if _engine is None:
        from .config import get_settings

        return init_engine(get_settings().database_url)
    return _engine


def safe_url(url: str) -> str:
    """URL with the password masked, for logs."""
    from sqlalchemy.engine import make_url

    return make_url(url).render_as_string(hide_password=True)


def has_legacy_schema(engine: Engine) -> bool:
    """True if FlightFlow tables exist but Alembic has never been run on this database."""
    names = set(inspect(engine).get_table_names())
    return "positions" in names and "alembic_version" not in names
