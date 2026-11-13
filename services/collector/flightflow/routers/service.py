from fastapi import APIRouter
from sqlalchemy import func, select

from ..db import as_date, daily_stats, day_bounds, get_engine, positions, utc_today

router = APIRouter()


@router.get("/service")
def get_service():
    start, end = day_bounds(utc_today())
    p, ds = positions, daily_stats
    with get_engine().connect() as conn:
        last_ts = conn.execute(select(func.max(p.c.ts))).scalar()
        today = conn.execute(
            select(func.count()).select_from(p).where((p.c.ts >= start) & (p.c.ts < end))
        ).scalar()
        hist = conn.execute(
            select(
                ds.c.date, ds.c.unique_aircraft, ds.c.total_positions, ds.c.busiest_hour, ds.c.max_distance_km
            )
            .order_by(ds.c.date.desc())
            .limit(14)
        ).all()
    if isinstance(last_ts, str):  # SQLite returns aggregates of typed columns untyped
        from ..db import UTCDateTime

        last_ts = UTCDateTime().process_result_value(last_ts, None)
    return {
        "last_insert_ts": last_ts.isoformat() if last_ts else None,
        "positions_today": today,
        "compact_history": [
            {
                "date": str(as_date(r[0])),
                "unique_aircraft": r[1],
                "total_positions": r[2],
                "busiest_hour": r[3],
                "max_distance_km": float(r[4]) if r[4] is not None else None,
            }
            for r in hist
        ],
    }
