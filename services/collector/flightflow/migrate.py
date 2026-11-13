"""Run Alembic migrations programmatically (no alembic.ini needed)."""

from __future__ import annotations

import logging
from pathlib import Path

from alembic import command
from alembic.config import Config

from .db import get_engine, has_legacy_schema, safe_url

logger = logging.getLogger(__name__)


class LegacyDatabaseError(RuntimeError):
    pass


def _config() -> Config:
    cfg = Config()
    cfg.set_main_option("script_location", str(Path(__file__).parent / "migrations"))
    cfg.set_main_option(
        "sqlalchemy.url", get_engine().url.render_as_string(hide_password=False).replace("%", "%%")
    )
    return cfg


def upgrade() -> None:
    engine = get_engine()
    if has_legacy_schema(engine):
        raise LegacyDatabaseError(
            "This database already has FlightFlow tables but no migration history.\n"
            "If it comes from an earlier FlightFlow install, check the schema (see docs/configuration.md)\n"
            "and adopt it once with:  flightflow db stamp"
        )
    logger.info("Applying database migrations on %s", safe_url(str(engine.url)))
    command.upgrade(_config(), "head")


def stamp(revision: str = "0001") -> None:
    command.stamp(_config(), revision)


def current() -> None:
    command.current(_config(), verbose=True)
