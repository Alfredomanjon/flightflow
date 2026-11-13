"""Command line: ``flightflow serve | check | db … | compact | backfill-types | logos``."""

from __future__ import annotations

import argparse
import logging
import os
import sys

from .config import ConfigError, get_settings


def _setup_logging(level: str) -> None:
    logging.basicConfig(level=level.upper(), format="%(asctime)s %(levelname)s [%(name)s] %(message)s")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="flightflow", description="FlightFlow collector")
    parser.add_argument("--log-level", default=os.environ.get("FLIGHTFLOW_LOG_LEVEL", "info"))
    sub = parser.add_subparsers(dest="cmd", required=True)

    serve = sub.add_parser("serve", help="run the API, the collector and the web apps")
    serve.add_argument("--host", default=os.environ.get("FLIGHTFLOW_HOST", "0.0.0.0"))
    serve.add_argument("--port", type=int, default=int(os.environ.get("FLIGHTFLOW_PORT", "8080")))
    serve.add_argument("--reload", action="store_true", help="auto-reload on code changes (development)")

    sub.add_parser("check", help="validate config.yaml and exit")

    db = sub.add_parser("db", help="database migrations")
    db.add_argument("action", choices=["upgrade", "stamp", "current"])
    db.add_argument("--revision", default="0001", help="revision for 'stamp' (default: 0001)")

    sub.add_parser("compact", help="compact pending days now")
    sub.add_parser(
        "backfill-types", help="fill missing aircraft types in the history from the aircraft database"
    )
    logos = sub.add_parser("logos", help="download airline logos into the data directory")
    logos.add_argument("--force", action="store_true")

    args = parser.parse_args(argv)
    _setup_logging(args.log_level)

    try:
        settings = get_settings()
    except ConfigError as e:
        print(e, file=sys.stderr)
        return 2

    if args.cmd == "check":
        from .db import safe_url

        print(f"OK · receiver {settings.receiver.url} · database {safe_url(settings.database_url)}")
        return 0

    if args.cmd == "serve":
        import uvicorn

        if args.reload:
            uvicorn.run(
                "flightflow.asgi:app", host=args.host, port=args.port, reload=True, log_level=args.log_level
            )
        else:
            from .main import create_app

            uvicorn.run(
                create_app(), host=args.host, port=args.port, log_level=args.log_level, proxy_headers=True
            )
        return 0

    from . import migrate

    if args.cmd == "db":
        if args.action == "upgrade":
            migrate.upgrade()
        elif args.action == "stamp":
            migrate.stamp(args.revision)
            print(f"Database stamped at revision {args.revision}.")
        else:
            migrate.current()
        return 0

    if args.cmd == "compact":
        from .tasks.compact import compact_job

        migrate.upgrade()
        compact_job()
        return 0

    if args.cmd == "backfill-types":
        from .db import get_engine
        from .tasks.compact import backfill_aircraft_type

        with get_engine().begin() as conn:
            n = backfill_aircraft_type(conn)
        print(f"{n} rows updated.")
        return 0

    if args.cmd == "logos":
        from .logos import download_logos

        download_logos(settings, force=args.force)
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
