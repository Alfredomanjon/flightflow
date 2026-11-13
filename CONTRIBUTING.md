# Contributing

## Layout

```
services/collector   Python (FastAPI): ingestion, compaction, API, serves the apps
services/map         React + MapLibre: live map
services/analytics   React + Recharts: history
services/portrait    React: to-scale portrait of the closest planes
packages/shared      TypeScript shared by the three apps (config, i18n, units, hooks, drawings)
```

## Development (no Docker needed)

Requirements: Node 20+, Python 3.11+.

```bash
npm install
cp config.example.yaml config.yaml    # set receiver.url (or `mock`)
npm run dev
```

`npm run dev` starts the collector with auto-reload on `:8001` (creating
`services/collector/.venv` the first time) and the three apps with hot reload:

| App | URL |
|-----|-----|
| Map | http://localhost:5173/map/ |
| Analytics | http://localhost:5174/analytics/ |
| Portrait | http://localhost:5175/portrait/ |

Each app proxies `/api` to `FLIGHTFLOW_API` (default `http://localhost:8001`). To work on a
single app against a running FlightFlow (e.g. on your Pi), skip the local collector:

```bash
FLIGHTFLOW_API=http://my-pi:8080 npm run dev:portrait
```

Editing `packages/shared` reloads all three apps.

## Tests and checks

```bash
npm run test:collector     # pytest on SQLite
npm run lint:collector     # ruff
npm run typecheck          # TypeScript, all apps
npm run build
```

PostgreSQL tests run when `FLIGHTFLOW_TEST_POSTGRES_URL` is set (CI does it):

```bash
docker run -d --rm --name ff-pg -e POSTGRES_PASSWORD=ff -p 55432:5432 postgres:16-alpine
FLIGHTFLOW_TEST_POSTGRES_URL=postgresql://postgres:ff@localhost:55432/postgres npm run test:collector
```

## Try it as a user would

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

builds the image from your checkout instead of pulling it.

## Translations

Strings live in `messages.ts` of each app and in `packages/shared/src/messages.ts`, as flat
`en`/`es` dictionaries. Adding a language: add it to `Language` in `packages/shared/src/i18n.ts`,
to the dictionaries, and to `ui.language` in `services/collector/flightflow/config.py`.

## Aircraft drawings

Side profiles live in `packages/shared/src/art/aircraft/`, one SVG per ICAO type at
**10 px = 1 m**, named after the ICAO designator (`A320.svg`). To add a type, drop in its SVG
and add it to `ART_KEYS`/`ART_NAMES` in `packages/shared/src/art/typeMap.ts`.

## Releases

1. Branch → pull request. CI runs lint, tests (SQLite + PostgreSQL), the web build and an image build.
2. Merging to `main` publishes `ghcr.io/alfredomanjon/flightflow:edge`.
3. Tagging `vX.Y.Z` publishes `X.Y.Z`, `X.Y` and `latest`, plus a GitHub release with notes.
