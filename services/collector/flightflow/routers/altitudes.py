from datetime import date, timedelta

from fastapi import APIRouter
from sqlalchemy import case, func, select

from ..db import flights_summary, get_engine, utc_today

router = APIRouter()
fs = flights_summary

# (key, lower ft inclusive, upper ft exclusive). Labels are translated by the web apps.
BANDS = [
    ("lt_fl050", None, 5000),
    ("fl050_100", 5000, 10000),
    ("fl100_200", 10000, 20000),
    ("fl200_300", 20000, 30000),
    ("fl300_350", 30000, 35000),
    ("fl350_400", 35000, 40000),
    ("gt_fl400", 40000, None),
]
PROFILES = ("cruise", "climb_descent", "regional")


@router.get("/altitudes")
def get_altitudes(from_date: date | None = None, to_date: date | None = None):
    today = utc_today()
    to_date = to_date or today
    from_date = from_date or (today - timedelta(days=29))
    in_range = fs.c.date.between(from_date, to_date) & fs.c.max_alt_baro.is_not(None)

    band = case(
        *[(fs.c.max_alt_baro < hi, i) for i, (_, _, hi) in enumerate(BANDS) if hi is not None],
        else_=len(BANDS) - 1,
    ).label("band")
    profile = case(
        ((fs.c.max_alt_baro >= 20000) & ((fs.c.max_alt_baro - fs.c.min_alt_baro) < 8000), "cruise"),
        ((fs.c.max_alt_baro >= 20000), "climb_descent"),
        else_="regional",
    ).label("profile")

    with get_engine().connect() as conn:
        bands = dict(conn.execute(select(band, func.count()).where(in_range).group_by(band)).all())
        profiles = dict(
            conn.execute(
                select(profile, func.count())
                .where(in_range & fs.c.min_alt_baro.is_not(None))
                .group_by(profile)
            ).all()
        )

    return {
        "from_date": str(from_date),
        "to_date": str(to_date),
        "bands": [
            {"key": key, "min_ft": lo, "max_ft": hi, "flights": bands.get(i, 0)}
            for i, (key, lo, hi) in enumerate(BANDS)
        ],
        "profiles": [{"key": k, "flights": profiles.get(k, 0)} for k in PROFILES],
    }
