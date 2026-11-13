# Configuration

FlightFlow reads a single YAML file. Copy [`config.example.yaml`](../config.example.yaml) to
`config.yaml` and edit it. In Docker it is mounted at `/config/config.yaml`; when running
from source it is looked up as `$FLIGHTFLOW_CONFIG`, then `./config.yaml`.

The file is validated at startup. Mistakes stop FlightFlow with a clear message, e.g.:

```
Invalid configuration in /config/config.yaml:
  - receiver.latitude: Input should be less than or equal to 90
  - ui.langauge: unknown setting (typo?)
```

Check a file without starting anything: `docker compose run --rm flightflow flightflow check`.

Changing the configuration only needs a restart (`docker compose restart`); the web apps
read it from `/api/config` and are never rebuilt.

## Reference

| Setting | Default | Description |
|---------|---------|-------------|
| `receiver.url` | — (required) | Base URL of tar1090/readsb, e.g. `http://192.168.1.50/tar1090`, or `mock`. |
| `receiver.latitude` / `longitude` | — (required) | Antenna position, decimal degrees. |
| `receiver.aircraft_json_url` | `<url>/data/aircraft.json` | Override for other receivers. |
| `receiver.stats_json_url` | `<url>/data/stats.json` | Override for other receivers. |
| `receiver.aircraft_db` | `true` | Use tar1090's aircraft database for registrations and types. |
| `receiver.timeout_seconds` | `5` | HTTP timeout when reading the receiver. |
| `location.home_airport` | none | ICAO code of your local airport (map label + METAR). Coordinates are looked up. |
| `location.home_airport_name` / `_latitude` / `_longitude` | from dataset | Overrides for airports missing from the dataset. |
| `location.nearby_radius_km` | `150` | Airports drawn on the map within this radius. |
| `ui.language` | `en` | `en` or `es`. Add `?lang=es` to any URL to override per screen. |
| `ui.units` | `aviation` | `aviation` (ft, kt, km), `metric` (m, km/h, km), `imperial` (ft, mph, mi). |
| `database.url` | SQLite in the data folder | `sqlite:////data/flightflow.db` or `postgresql://…`. |
| `collector.enabled` | `true` | Store positions and build the history. Off = live apps only. |
| `collector.interval_seconds` | `5` | How often positions are stored. |
| `collector.compact_at` | `"00:30"` | UTC time of the daily summary. |
| `map.enabled` / `analytics.enabled` / `portrait.enabled` | `true` | Serve each app. |
| `map.metar` | `true` | Show the METAR of `home_airport` (aviationweather.gov). |
| `map.callsign_radius_km` | `50` | Radius of the "nearby callsigns" filter. |
| `map.style_url` | OpenFreeMap Positron | Any MapLibre style URL. |
| `portrait.default_radius_km` | `40` | Initial search radius (5–100), changeable on screen. |
| `portrait.max_planes` | `3` | Initial number of planes (1–3). |
| `airline_logos` | `false` | Download airline logos into `data/logos/` (see below). |

Environment variables: `FLIGHTFLOW_DATABASE_URL` (overrides `database.url`, keeps secrets out
of the file), `FLIGHTFLOW_CONFIG`, `FLIGHTFLOW_DATA_DIR`, `FLIGHTFLOW_PORT`, `FLIGHTFLOW_LOG_LEVEL`.

## Database

**SQLite** (default) needs nothing: the file lives in the data volume.

**PostgreSQL** works with any provider through a URL — a local server, Aiven, Supabase, Neon,
Cloud SQL, Azure… Add `?sslmode=require` for hosted services:

```yaml
database:
  url: postgresql://user:password@host:5432/flightflow?sslmode=require
```

or, better, leave it out of the file and set it in `docker-compose.yml`:

```yaml
    environment:
      FLIGHTFLOW_DATABASE_URL: postgresql://user:password@host:5432/flightflow?sslmode=require
```

Tables are created and migrated automatically at startup (Alembic).

### Adopting a database from an earlier FlightFlow install

Databases created by FlightFlow before migrations existed have the tables but no
migration history. FlightFlow refuses to start on them rather than guess. Check the schema
read-only first:

```sql
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('positions', 'flights_summary', 'daily_stats')
ORDER BY table_name, ordinal_position;
```

You should see the three tables, with `aircraft_type` in `positions` and `flights_summary`,
and `type` long enough for values such as `adsb_icao` (TEXT or VARCHAR without a small limit).
Then mark it as up to date, once:

```bash
docker compose run --rm flightflow flightflow db stamp
```

No data is touched; FlightFlow starts normally afterwards.

## Airline logos

Airline logos are trademarks and are not shipped. Without them, a badge with the airline's
IATA code in its colour is shown. With `airline_logos: true`, FlightFlow downloads the logos
once into `data/logos/` for your own use (`flightflow logos --force` refreshes them).

## Maintenance commands

```bash
docker compose run --rm flightflow flightflow <command>
```

| Command | What it does |
|---------|--------------|
| `check` | Validate the configuration. |
| `db upgrade` / `db current` / `db stamp` | Database migrations. |
| `compact` | Summarise pending days now. |
| `backfill-types` | Fill missing aircraft models in the history from tar1090's database. |
| `logos [--force]` | Download airline logos. |
