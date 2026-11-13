"""Test fixtures. Every test runs against SQLite; set FLIGHTFLOW_TEST_POSTGRES_URL to also run on PostgreSQL."""

import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

from flightflow import aircraft_db, db, migrate, receiver
from flightflow.config import load_settings, set_settings

BASE_CONFIG = {
    "receiver": {"url": "mock", "latitude": 40.4168, "longitude": -3.7038},
    "location": {"home_airport": "LEMD"},
    "ui": {"language": "en"},
}

PG_URL = os.environ.get("FLIGHTFLOW_TEST_POSTGRES_URL")
BACKENDS = ["sqlite"] + (["postgresql"] if PG_URL else [])


@pytest.fixture(params=BACKENDS)
def settings(request, tmp_path, monkeypatch):
    monkeypatch.setenv("FLIGHTFLOW_DATA_DIR", str(tmp_path))
    monkeypatch.delenv("FLIGHTFLOW_DATABASE_URL", raising=False)
    schema = None
    if request.param == "postgresql":
        # Isolate each test in its own schema.
        schema = f"t_{uuid.uuid4().hex[:10]}"
        admin = create_engine(PG_URL)
        with admin.begin() as c:
            c.execute(text(f"CREATE SCHEMA {schema}"))
        sep = "&" if "?" in PG_URL else "?"
        url = f"{PG_URL}{sep}options=-csearch_path%3D{schema}"
        cfg = BASE_CONFIG | {"database": {"url": url}}
    else:
        cfg = BASE_CONFIG
    s = load_settings(data=cfg)
    set_settings(s)
    db.init_engine(s.database_url)
    receiver.set_receiver(None)
    aircraft_db.set_aircraft_db(None)
    migrate.upgrade()
    yield s
    db.get_engine().dispose()
    set_settings(None)
    if schema:
        with admin.begin() as c:
            c.execute(text(f"DROP SCHEMA {schema} CASCADE"))
        admin.dispose()


@pytest.fixture
def client(settings):
    from flightflow.main import create_app

    with TestClient(create_app(start_background=False)) as c:
        yield c
