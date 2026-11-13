# Receivers

FlightFlow reads two JSON files that every readsb-family decoder produces:
`aircraft.json` (aircraft in view) and `stats.json` (receiver statistics, used by the map's
Stats tab). Only the collector talks to the receiver; browsers talk to the collector.

## tar1090 / readsb (recommended)

```yaml
receiver:
  url: http://192.168.1.50/tar1090
```

FlightFlow reads `http://192.168.1.50/tar1090/data/aircraft.json` and `…/data/stats.json`.
tar1090 also ships an aircraft database that FlightFlow uses for registrations and models.

If FlightFlow runs **on the same Raspberry Pi** as the receiver, use
`http://host.docker.internal/tar1090` with `extra_hosts` enabled in `docker-compose.yml`, or the
host's LAN IP — not `localhost`, which inside the container is the container itself.
See [Raspberry Pi](raspberry-pi.md).

## dump1090-fa (FlightAware / PiAware)

dump1090-fa has no tar1090 database. Point at the JSON files and disable the lookup:

```yaml
receiver:
  url: http://192.168.1.50:8080
  aircraft_json_url: http://192.168.1.50:8080/data/aircraft.json
  stats_json_url: http://192.168.1.50:8080/data/stats.json
  aircraft_db: false
```

Registrations and types then come from the feed itself (when present) and from hexdb.io in the map.

## Other feeds

Any HTTP endpoint that returns the readsb `aircraft.json` format works through
`aircraft_json_url`. If there is no `stats.json`, the map's Stats tab shows dashes.

## Mock mode

```yaml
receiver:
  url: mock
  latitude: 40.4168
  longitude: -3.7038
```

Seven synthetic aircraft circle the given position. Useful to try FlightFlow, develop
without an antenna, or demo it. Everything works, including history.
