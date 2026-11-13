"""Daily compaction: positions of each finished UTC day → flights_summary + daily_stats.

Raw positions of a compacted day are deleted afterwards, keeping the database small.
"""

from __future__ import annotations

import logging
from datetime import date

from sqlalchemy import Date, delete, distinct, func, insert, literal, select, update

from ..aircraft_db import get_aircraft_db
from ..db import (
    as_date,
    daily_stats,
    day_bounds,
    flights_summary,
    get_engine,
    positions,
    utc_day,
    utc_hour,
    utc_today,
)

logger = logging.getLogger(__name__)
p = positions


def pending_dates(conn) -> list[date]:
    """Days before today (UTC) that still have raw positions and no daily_stats row."""
    start_today, _ = day_bounds(utc_today())
    day = utc_day(p.c.ts)
    q = (
        select(day)
        .distinct()
        .where(p.c.ts < start_today)
        .where(day.not_in(select(daily_stats.c.date)))
        .order_by(day)
    )
    return [as_date(r[0]) for r in conn.execute(q)]


def compact_day(conn, d: date) -> tuple[int, int]:
    start, end = day_bounds(d)
    in_day = (p.c.ts >= start) & (p.c.ts < end)

    conn.execute(delete(flights_summary).where(flights_summary.c.date == d))
    summary = (
        select(
            literal(d, type_=Date),
            p.c.hex,
            p.c.flight,
            func.max(p.c.reg),
            func.max(p.c.type),
            func.max(p.c.category),
            func.max(p.c.aircraft_type),
            func.min(p.c.ts),
            func.max(p.c.ts),
            func.count(),
            func.avg(p.c.lat),
            func.avg(p.c.lon),
            func.min(p.c.distance_km),
            func.max(p.c.distance_km),
            func.min(p.c.alt_baro),
            func.max(p.c.alt_baro),
            func.avg(p.c.gs),
            func.max(p.c.gs),
            func.avg(p.c.rssi),
        )
        .where(in_day)
        .group_by(p.c.hex, p.c.flight)
    )
    cols = [
        "date",
        "hex",
        "flight",
        "reg",
        "type",
        "category",
        "aircraft_type",
        "first_seen",
        "last_seen",
        "detection_count",
        "avg_lat",
        "avg_lon",
        "min_distance_km",
        "max_distance_km",
        "min_alt_baro",
        "max_alt_baro",
        "avg_gs",
        "max_gs",
        "avg_rssi",
    ]
    flights = conn.execute(insert(flights_summary).from_select(cols, summary)).rowcount

    hour = utc_hour(p.c.ts).label("hour")
    busiest = conn.execute(
        select(hour).where(in_day).group_by(hour).order_by(func.count().desc()).limit(1)
    ).scalar()
    top_type = conn.execute(
        select(p.c.type)
        .where(in_day & p.c.type.is_not(None))
        .group_by(p.c.type)
        .order_by(func.count().desc())
        .limit(1)
    ).scalar()
    agg = conn.execute(
        select(
            func.count(distinct(p.c.hex)), func.count(), func.avg(p.c.distance_km), func.max(p.c.distance_km)
        ).where(in_day)
    ).one()
    conn.execute(
        insert(daily_stats).values(
            date=d,
            unique_aircraft=agg[0],
            total_positions=agg[1],
            busiest_hour=busiest,
            avg_distance_km=agg[2],
            max_distance_km=agg[3],
            most_common_type=top_type,
        )
    )
    deleted = conn.execute(delete(p).where(in_day)).rowcount
    return flights, deleted


def backfill_aircraft_type(conn, d: date | None = None) -> int:
    """Fill flights_summary.aircraft_type from the aircraft database where it is missing."""
    db = get_aircraft_db()
    if not db.enabled:
        return 0
    fs = flights_summary
    cond = fs.c.aircraft_type.is_(None) & fs.c.hex.is_not(None)
    if d is not None:
        cond = cond & (fs.c.date == d)
    hexes = [r[0] for r in conn.execute(select(fs.c.hex).distinct().where(cond))]
    updated = 0
    for h in hexes:
        t = db.lookup_type(h)
        if t:
            stmt = update(fs).where(cond & (fs.c.hex == h)).values(aircraft_type=t[:10])
            updated += conn.execute(stmt).rowcount
    return updated


def compact_job() -> None:
    engine = get_engine()
    with engine.connect() as conn:
        dates = pending_dates(conn)
    if not dates:
        logger.info("Compaction: nothing pending.")
        return
    for d in dates:
        try:
            with engine.begin() as conn:
                flights, deleted = compact_day(conn, d)
            logger.info("Compacted %s: %d flights, %d positions removed", d, flights, deleted)
            with engine.begin() as conn:
                filled = backfill_aircraft_type(conn, d)
            if filled:
                logger.info("%s: %d aircraft types resolved from the aircraft database", d, filled)
        except Exception:
            logger.exception("Compaction of %s failed", d)
