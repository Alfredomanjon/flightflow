# FlightFlow

**Your ADS-B receiver, three ways.** FlightFlow connects to the receiver you already run
(readsb / tar1090 / dump1090) and gives you:

| App | Path | What it is |
|-----|------|------------|
| **Map** | `/map/` | Live map of every aircraft your antenna hears, with trails, METAR and receiver stats. |
| **Analytics** | `/analytics/` | History: aircraft per day, busiest hours, top airlines and models, altitudes. |
| **Portrait** | `/portrait/` | The 1–3 closest planes drawn to scale as side profiles — for a frame or a spare screen. |

Everything runs in **one container** that also stores the history (SQLite by default, PostgreSQL optional).
English and Spanish UI; aviation, metric or imperial units.

## Quick start

You need Docker and an ADS-B receiver with tar1090 or readsb reachable on your network.

```bash
mkdir flightflow && cd flightflow
curl -LO https://raw.githubusercontent.com/Alfredomanjon/flightflow/main/docker-compose.yml
curl -L -o config.yaml https://raw.githubusercontent.com/Alfredomanjon/flightflow/main/config.example.yaml
```

1. Edit `config.yaml`: set `receiver.url` and your antenna's `latitude`/`longitude`.
   (No antenna? Set `url: mock` to try it with synthetic traffic.)
2. `docker compose up -d`
3. Open `http://<host>:8080`.

That's it. History accumulates in `./data/`; each day is summarised at 00:30 UTC, so
Analytics fills up from the second day. Update with `docker compose pull && docker compose up -d`.

Images are published for `linux/amd64` and `linux/arm64` (Raspberry Pi 4/5 with a 64-bit OS).

## Documentation

- [Configuration](docs/configuration.md) — every setting, PostgreSQL, migrating an existing database.
- [Receivers](docs/receivers.md) — tar1090, readsb, dump1090-fa, remote feeds, mock mode.
- [Raspberry Pi](docs/raspberry-pi.md) — same Pi as tar1090, behind lighttpd on port 80, moving from a manual install.
- [Development](CONTRIBUTING.md) — running from source with hot reload, tests, releases.

## How it fits together

```
receiver (tar1090/readsb) ──► collector (FastAPI, one container, :8080)
                                ├─ /api/live/*   cached live data for the apps
                                ├─ /api/*        history (SQLite or PostgreSQL)
                                ├─ /api/config   public part of config.yaml
                                └─ /map/ /analytics/ /portrait/  static web apps
```

The web apps never talk to the receiver directly: the collector reads it once per second
and shares the result, so any number of screens can be open.

## License

MIT — see [LICENSE](LICENSE). Third-party data and attributions are listed in [NOTICE](NOTICE).
Airline logos are not included (they are trademarks); see `airline_logos` in the configuration.
