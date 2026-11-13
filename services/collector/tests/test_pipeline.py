"""Ingestion → compaction → every history endpoint, on each database backend."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select

from flightflow.db import daily_stats, flights_summary, get_engine, positions, utc_today
from flightflow.receiver import mock_aircraft
from flightflow.tasks.compact import compact_job
from flightflow.tasks.insert import build_rows, insert_once


def _count(table):
    with get_engine().connect() as c:
        return c.execute(select(func.count()).select_from(table)).scalar()


def _seed_yesterday(settings):
    """Two snapshots of the mock traffic yesterday at 10:00 and 10:20 UTC."""
    y = utc_today() - timedelta(days=1)
    rows = []
    for minute in (0, 20):
        ts = datetime(y.year, y.month, y.day, 10, minute, tzinfo=UTC)
        data = mock_aircraft(settings.receiver.latitude, settings.receiver.longitude, now=ts.timestamp())
        rows += build_rows(data["aircraft"], ts)
    with get_engine().begin() as c:
        c.execute(positions.insert(), rows)
    return y, len(rows)


def test_insert_from_mock_receiver(settings):
    n = insert_once()
    assert n == 7
    assert _count(positions) == 7
    with get_engine().connect() as c:
        row = c.execute(select(positions).limit(1)).mappings().one()
    assert row["ts"].tzinfo is not None
    assert row["type"] == "adsb_icao"  # longer than the 4 chars of the old schema
    assert row["distance_km"] > 0


def test_compaction_and_endpoints(settings, client):
    y, n = _seed_yesterday(settings)
    insert_once()  # today's positions must survive compaction

    compact_job()
    assert _count(positions) == 7
    assert _count(daily_stats) == 1
    assert _count(flights_summary) == 7  # 7 aircraft, one flight each

    with get_engine().connect() as c:
        ds = c.execute(select(daily_stats)).mappings().one()
        fs = c.execute(select(flights_summary).where(flights_summary.c.hex == "f00001")).mappings().one()
    assert ds["date"] == y and ds["total_positions"] == n and ds["unique_aircraft"] == 7
    assert ds["busiest_hour"] == 10 and ds["most_common_type"] == "adsb_icao"
    assert fs["detection_count"] == 2 and fs["aircraft_type"] == "A20N"
    assert fs["first_seen"] == datetime(y.year, y.month, y.day, 10, 0, tzinfo=UTC)

    compact_job()  # idempotent
    assert _count(daily_stats) == 1

    ov = client.get("/api/overview").json()
    assert ov["latest_date"] == str(y)
    assert ov["kpis"]["aircraft_today"]["value"] == 7
    assert ov["kpis"]["busiest_hour"]["value"] == 10
    assert ov["kpis"]["flights_7d"]["value"] == 7
    assert {a["code"] for a in ov["top_airlines"]} == {"VLG", "RYR", "ANE", "IBE", "DLH"}
    assert ov["hourly_activity"] == [{"hour": 10, "count": 7}]
    assert ov["daily_aircraft"][-1]["date"] == str(y)

    fl = client.get("/api/flights", params={"flight": "vlg"}).json()
    assert fl["total"] == 1
    item = fl["items"][0]
    assert item["duration_min"] == 20 and item["type"] == "A20N"
    assert item["first_seen"].endswith("+00:00")

    assert client.get("/api/flights", params={"type": "b738"}).json()["total"] == 1

    ac = client.get("/api/aircraft").json()
    assert ac["total"] == 7 and ac["items"][0]["appearances"] == 1

    alt = client.get("/api/altitudes").json()
    assert sum(b["flights"] for b in alt["bands"]) == 7
    assert {p["key"] for p in alt["profiles"]} == {"cruise", "climb_descent", "regional"}

    svc = client.get("/api/service").json()
    assert svc["positions_today"] == 7
    assert svc["last_insert_ts"].endswith("+00:00")
    assert svc["compact_history"][0]["date"] == str(y)

    today = client.get("/api/today").json()
    assert today["count"] == 7


def test_live_and_meta(client):
    a = client.get("/api/live/aircraft").json()
    assert len(a["aircraft"]) == 7 and "lat" in a["aircraft"][0]
    assert client.get("/api/live/stats").json()["aircraft_with_pos"] == 7
    cfg = client.get("/api/config").json()
    assert cfg["home_airport"]["icao"] == "LEMD"
    assert cfg["receiver"]["mock"] is True
    assert client.get("/api/health").json() == {"status": "ok"}
    page = client.get("/")
    assert page.status_code == 200 and "FlightFlow" in page.text and "LEMD" in page.text


def test_legacy_database_requires_stamp(tmp_path, monkeypatch):
    import pytest

    from flightflow import db, migrate
    from flightflow.config import load_settings, set_settings

    monkeypatch.setenv("FLIGHTFLOW_DATA_DIR", str(tmp_path))
    s = load_settings(data={"receiver": {"url": "mock", "latitude": 0, "longitude": 0}})
    set_settings(s)
    engine = db.init_engine(s.database_url)
    db.metadata.create_all(engine)  # tables without alembic_version, like an old install
    with pytest.raises(migrate.LegacyDatabaseError):
        migrate.upgrade()
    migrate.stamp()
    migrate.upgrade()  # now a no-op
    set_settings(None)
