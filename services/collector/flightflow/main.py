import logging
import threading
from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI

from . import __version__, migrate
from .config import get_settings
from .db import get_engine, safe_url
from .logos import download_logos
from .routers import aircraft, altitudes, flights, live, meta, overview, service
from .tasks.compact import compact_job
from .tasks.insert import insert_loop
from .web import mount_web

logger = logging.getLogger("flightflow")


def create_app(start_background: bool = True) -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        stop = threading.Event()
        scheduler = None
        if start_background:
            logger.info("Database: %s", safe_url(str(get_engine().url)))
            migrate.upgrade()
            if settings.collector.enabled:
                threading.Thread(target=insert_loop, args=(stop,), daemon=True, name="insert-loop").start()
                scheduler = BackgroundScheduler(timezone="UTC")
                scheduler.add_job(
                    compact_job,
                    trigger="cron",
                    hour=settings.collector.compact_hour,
                    minute=settings.collector.compact_minute,
                    id="compact",
                )
                # Catch up on days missed while the collector was down.
                scheduler.add_job(compact_job, id="compact-startup")
                scheduler.start()
                logger.info(
                    "Collector running: receiver=%s every %ss, compaction %s UTC",
                    settings.receiver.url,
                    settings.collector.interval_seconds,
                    settings.collector.compact_at,
                )
            if settings.airline_logos and not any(settings.logos_dir.glob("*.png")):
                threading.Thread(target=download_logos, args=(settings,), daemon=True).start()
        yield
        stop.set()
        if scheduler:
            scheduler.shutdown(wait=False)

    app = FastAPI(
        title="FlightFlow API",
        version=__version__,
        lifespan=lifespan,
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        redoc_url=None,
    )
    for r in (meta, live, overview, flights, aircraft, altitudes, service):
        app.include_router(r.router, prefix="/api")
    mount_web(app, settings)
    return app
