import re
from datetime import date, timedelta

from fastapi import APIRouter
from sqlalchemy import func, select

from ..db import as_date, daily_stats, flights_summary, get_engine, utc_hour, utc_today

router = APIRouter()
ds, fs = daily_stats, flights_summary
_AIRLINE = re.compile(r"^[A-Z]{3}$")


def _pct(cur, prev):
    if cur is None or not prev:
        return None
    return round((cur - prev) / prev * 100, 1)


@router.get("/overview")
def get_overview(from_date: date | None = None, to_date: date | None = None):
    today = utc_today()
    to_date = to_date or today
    from_date = from_date or (today - timedelta(days=29))

    with get_engine().connect() as conn:
        # Latest day with stats (today is only compacted after midnight UTC).
        latest = as_date(conn.execute(select(func.max(ds.c.date)).where(ds.c.date <= to_date)).scalar())
        row_today = row_week_ago = None
        if latest:
            row_today = conn.execute(
                select(
                    ds.c.unique_aircraft, ds.c.total_positions, ds.c.busiest_hour, ds.c.max_distance_km
                ).where(ds.c.date == latest)
            ).first()
            row_week_ago = conn.execute(
                select(ds.c.unique_aircraft).where(ds.c.date == latest - timedelta(days=7))
            ).first()
        else:
            latest = to_date

        daily = conn.execute(
            select(ds.c.date, ds.c.unique_aircraft, ds.c.total_positions)
            .where(ds.c.date.between(from_date, to_date))
            .order_by(ds.c.date)
        ).all()

        hour = utc_hour(fs.c.first_seen).label("hour")
        hourly = conn.execute(
            select(hour, func.count())
            .where(fs.c.date.between(from_date, to_date))
            .group_by(hour)
            .order_by(hour)
        ).all()

        def flights_between(a, b):
            return conn.execute(select(func.count()).select_from(fs).where(fs.c.date.between(a, b))).scalar()

        flights_7d = flights_between(to_date - timedelta(days=6), to_date)
        flights_prev = flights_between(to_date - timedelta(days=13), to_date - timedelta(days=7))

        prefix = func.substr(fs.c.flight, 1, 3).label("airline")
        airline_rows = conn.execute(
            select(prefix, func.count().label("n"))
            .where((fs.c.date == latest) & fs.c.flight.is_not(None) & (fs.c.flight != ""))
            .group_by(prefix)
            .order_by(func.count().desc())
        ).all()
        top_airlines = [{"code": c, "count": n} for c, n in airline_rows if c and _AIRLINE.match(c)][:7]

        top_models = [
            {"type": t, "count": n}
            for t, n in conn.execute(
                select(fs.c.aircraft_type, func.count())
                .where((fs.c.date == latest) & fs.c.aircraft_type.is_not(None) & (fs.c.aircraft_type != ""))
                .group_by(fs.c.aircraft_type)
                .order_by(func.count().desc())
                .limit(5)
            )
        ]

    aircraft_today = row_today[0] if row_today else None
    return {
        "latest_date": str(latest) if row_today else None,
        "kpis": {
            "aircraft_today": {
                "value": aircraft_today,
                "change_pct": _pct(aircraft_today, row_week_ago[0] if row_week_ago else None),
                "period": "vs_7_days_ago",
            },
            "flights_7d": {
                "value": flights_7d,
                "change_pct": _pct(flights_7d, flights_prev),
                "period": "vs_previous_week",
            },
            "busiest_hour": {"value": row_today[2] if row_today else None},
            "max_distance_km": {"value": row_today[3] if row_today else None},
        },
        "daily_aircraft": [
            {"date": str(as_date(d)), "unique_aircraft": u, "total_positions": t} for d, u, t in daily
        ],
        "hourly_activity": [{"hour": h, "count": c} for h, c in hourly],
        "top_airlines": top_airlines,
        "top_models": top_models,
    }
