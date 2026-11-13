from fastapi import APIRouter
from sqlalchemy import distinct, func, select

from ..db import as_date, flights_summary, get_engine

router = APIRouter()
fs = flights_summary


@router.get("/aircraft")
def get_aircraft(page: int = 1, limit: int = 50):
    page = max(1, page)
    limit = min(200, max(1, limit))
    appearances = func.count().label("appearances")
    with get_engine().connect() as conn:
        total = conn.execute(select(func.count(distinct(fs.c.hex))).where(fs.c.hex.is_not(None))).scalar()
        rows = conn.execute(
            select(
                fs.c.hex,
                func.max(fs.c.reg),
                func.max(fs.c.aircraft_type),
                appearances,
                func.min(fs.c.date),
                func.max(fs.c.date),
                func.avg(fs.c.max_alt_baro),
                func.min(fs.c.min_distance_km),
            )
            .where(fs.c.hex.is_not(None))
            .group_by(fs.c.hex)
            .order_by(appearances.desc(), fs.c.hex)
            .limit(limit)
            .offset((page - 1) * limit)
        ).all()
    items = [
        {
            "hex": r[0],
            "reg": r[1],
            "type": r[2],
            "appearances": r[3],
            "first_date": str(as_date(r[4])),
            "last_date": str(as_date(r[5])),
            "avg_max_alt": round(float(r[6])) if r[6] is not None else None,
            "closest_km": round(float(r[7]), 1) if r[7] is not None else None,
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
