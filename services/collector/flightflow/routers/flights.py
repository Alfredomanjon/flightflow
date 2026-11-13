from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter
from sqlalchemy import func, select

from ..db import as_date, flights_summary, get_engine, minutes_between, positions, utc_today

router = APIRouter()
fs = flights_summary


def _iso(dt):
    return dt.isoformat() if dt else None


def _r(v, n):
    return round(v, n) if v is not None else None


@router.get("/flights")
def get_flights(
    from_date: date | None = None,
    to_date: date | None = None,
    hex: str | None = None,
    flight: str | None = None,
    reg: str | None = None,
    type: str | None = None,
    page: int = 1,
    limit: int = 50,
):
    today = utc_today()
    to_date = to_date or today
    from_date = from_date or (today - timedelta(days=29))
    page = max(1, page)
    limit = min(200, max(1, limit))

    cond = fs.c.date.between(from_date, to_date)
    if hex:
        cond &= func.lower(fs.c.hex) == hex.lower()
    if flight:
        cond &= func.lower(fs.c.flight).like(f"%{flight.lower()}%")
    if reg:
        cond &= func.lower(fs.c.reg).like(f"%{reg.lower()}%")
    if type:
        # Filter by aircraft model (A320, B738…), falling back to the feed type column.
        cond &= (func.lower(fs.c.aircraft_type) == type.lower()) | (func.lower(fs.c.type) == type.lower())

    with get_engine().connect() as conn:
        total = conn.execute(select(func.count()).select_from(fs).where(cond)).scalar()
        rows = conn.execute(
            select(
                fs.c.id,
                fs.c.date,
                fs.c.hex,
                fs.c.flight,
                fs.c.reg,
                fs.c.aircraft_type,
                fs.c.category,
                fs.c.first_seen,
                fs.c.last_seen,
                minutes_between(fs.c.first_seen, fs.c.last_seen),
                fs.c.detection_count,
                fs.c.min_distance_km,
                fs.c.max_distance_km,
                fs.c.min_alt_baro,
                fs.c.max_alt_baro,
                fs.c.avg_gs,
                fs.c.max_gs,
                fs.c.avg_rssi,
            )
            .where(cond)
            .order_by(fs.c.first_seen.desc())
            .limit(limit)
            .offset((page - 1) * limit)
        ).all()

    items = [
        {
            "id": r[0],
            "date": str(as_date(r[1])),
            "hex": r[2],
            "flight": r[3],
            "reg": r[4],
            "type": r[5],
            "category": r[6],
            "first_seen": _iso(r[7]),
            "last_seen": _iso(r[8]),
            "duration_min": r[9],
            "detection_count": r[10],
            "min_distance_km": r[11],
            "max_distance_km": r[12],
            "min_alt_baro": r[13],
            "max_alt_baro": r[14],
            "avg_gs": _r(r[15], 1),
            "max_gs": _r(r[16], 1),
            "avg_rssi": _r(r[17], 1),
        }
        for r in rows
    ]
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "items": items,
    }


@router.get("/today")
def get_today():
    """Positions stored in the last 30 minutes (most recent first)."""
    since = datetime.now(UTC) - timedelta(minutes=30)
    p = positions
    with get_engine().connect() as conn:
        rows = conn.execute(
            select(
                p.c.hex,
                p.c.flight,
                p.c.lat,
                p.c.lon,
                p.c.alt_baro,
                p.c.gs,
                p.c.ts,
                p.c.reg,
                p.c.aircraft_type,
            )
            .where(p.c.ts >= since)
            .order_by(p.c.ts.desc())
            .limit(500)
        ).all()
    keys = ("hex", "flight", "lat", "lon", "alt_baro", "gs", "ts", "reg", "type")
    items = [dict(zip(keys, r, strict=True)) | {"ts": _iso(r[6])} for r in rows]
    return {"count": len(items), "items": items}
