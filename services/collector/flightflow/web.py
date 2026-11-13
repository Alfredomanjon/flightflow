"""Serves the built web apps (/map/, /analytics/, /portrait/) and the landing page (/)."""

from __future__ import annotations

import html
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, RedirectResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.staticfiles import StaticFiles

from .config import Settings

APPS = ("map", "analytics", "portrait")

TEXT = {
    "en": {
        "subtitle": "Your ADS-B receiver, three ways.",
        "map": ("Live map", "Every aircraft your receiver hears, on a map."),
        "analytics": ("Analytics", "History: daily traffic, airlines, models and altitudes."),
        "portrait": ("Portrait", "The closest planes, drawn to scale, for a frame or a spare screen."),
        "missing": "Not built. Run <code>npm run build</code>.",
        "api": "API docs",
        "mock": "Demo mode: showing synthetic traffic (receiver.url: mock).",
    },
    "es": {
        "subtitle": "Tu receptor ADS-B, de tres maneras.",
        "map": ("Mapa en vivo", "Todos los aviones que oye tu receptor, sobre un mapa."),
        "analytics": ("Analytics", "Histórico: tráfico diario, aerolíneas, modelos y altitudes."),
        "portrait": (
            "Portrait",
            "Los aviones más cercanos, dibujados a escala, para un cuadro o una pantalla libre.",
        ),
        "missing": "Sin compilar. Ejecuta <code>npm run build</code>.",
        "api": "Documentación de la API",
        "mock": "Modo demo: tráfico sintético (receiver.url: mock).",
    },
}


def web_dir() -> Path:
    env = os.environ.get("FLIGHTFLOW_WEB_DIR")
    if env:
        return Path(env)
    # Development checkout: services/collector/flightflow/web.py → services/<app>/dist
    return Path(__file__).resolve().parents[2]


def app_dist(app: str) -> Path:
    """Built files of one app: <web_dir>/<app> in the image, services/<app>/dist in a checkout."""
    if os.environ.get("FLIGHTFLOW_WEB_DIR"):
        return web_dir() / app
    return web_dir() / app / "dist"


class SPAStaticFiles(StaticFiles):
    """Static files with index.html fallback, for client-side routes such as /analytics/flights."""

    async def get_response(self, path, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as e:
            if e.status_code != 404 or "." in Path(path).name:
                raise
            return await super().get_response("index.html", scope)


def _landing(settings: Settings, available: dict[str, bool]) -> str:
    t = TEXT[settings.ui.language]
    cards = []
    for app in APPS:
        if not getattr(settings, app).enabled:
            continue
        title, desc = t[app]
        if available[app]:
            cards.append(f'<a class="card" href="/{app}/"><h2>{title}</h2><p>{desc}</p></a>')
        else:
            cards.append(f'<div class="card off"><h2>{title}</h2><p>{t["missing"]}</p></div>')
    home = settings.location.home_airport
    where = (
        html.escape(home) if home else f"{settings.receiver.latitude:.3f}, {settings.receiver.longitude:.3f}"
    )
    mock = f'<p class="mock">{t["mock"]}</p>' if settings.receiver.is_mock else ""
    return f"""<!doctype html>
<html lang="{settings.ui.language}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FlightFlow</title>
<style>
:root {{ --bg:#f5f5f7; --card:#fff; --ink:#1c1c1e; --muted:#6e6e73; --accent:#007aff; --line:rgba(0,0,0,.08); }}
@media (prefers-color-scheme: dark) {{ :root {{ --bg:#000; --card:#1c1c1e; --ink:#f5f5f7; --muted:#8e8e93; --line:rgba(255,255,255,.1); }} }}
* {{ box-sizing:border-box }}
body {{ margin:0; font:16px/1.5 Inter, system-ui, -apple-system, sans-serif; background:var(--bg); color:var(--ink); }}
main {{ max-width:880px; margin:0 auto; padding:56px 16px; }}
h1 {{ margin:0; font-size:32px; letter-spacing:-.02em }}
.sub {{ color:var(--muted); margin:4px 0 32px }}
.grid {{ display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)) }}
.card {{ display:block; background:var(--card); border:1px solid var(--line); border-radius:16px; padding:20px; color:inherit; text-decoration:none; transition:transform .15s }}
a.card:hover {{ transform:translateY(-2px); border-color:var(--accent) }}
.card h2 {{ margin:0 0 6px; font-size:18px }} .card p {{ margin:0; color:var(--muted); font-size:14px }}
.off {{ opacity:.6 }} .mock {{ color:#c77c00; font-size:14px }}
footer {{ margin-top:32px; font-size:13px; color:var(--muted) }} footer a {{ color:var(--accent) }}
</style></head>
<body><main>
<h1>FlightFlow <span style="color:var(--muted);font-weight:500">· {where}</span></h1>
<p class="sub">{t["subtitle"]}</p>{mock}
<div class="grid">{"".join(cards)}</div>
<footer><a href="/api/docs">{t["api"]}</a></footer>
</main></body></html>"""


def mount_web(app: FastAPI, settings: Settings) -> None:
    available = {}
    for name in APPS:
        dist = app_dist(name)
        available[name] = (dist / "index.html").exists()
        if getattr(settings, name).enabled and available[name]:
            app.mount(f"/{name}", SPAStaticFiles(directory=dist, html=True), name=name)

            def _redirect(name=name):
                return RedirectResponse(url=f"/{name}/")

            app.add_api_route(f"/{name}", _redirect, include_in_schema=False)

    if settings.airline_logos:
        settings.logos_dir.mkdir(parents=True, exist_ok=True)
        app.mount("/logos", StaticFiles(directory=settings.logos_dir), name="logos")

    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    def landing():
        return _landing(settings, available)
