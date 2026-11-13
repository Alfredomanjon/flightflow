# Raspberry Pi: next to tar1090

The most common setup: FlightFlow on the same Raspberry Pi that runs readsb + tar1090,
where lighttpd already serves tar1090 on port 80.

## Requirements

- **64-bit OS** (`uname -m` prints `aarch64`). Images are built for `arm64` and `amd64`;
  32-bit Raspberry Pi OS (`armv7l`) is not supported.
- Docker with the compose plugin:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER      # log out and back in
  ```

## Install

```bash
mkdir ~/flightflow && cd ~/flightflow
curl -LO https://raw.githubusercontent.com/Alfredomanjon/flightflow/main/docker-compose.yml
curl -L -o config.yaml https://raw.githubusercontent.com/Alfredomanjon/flightflow/main/config.example.yaml
```

In `docker-compose.yml`, enable the two options marked *same host as the receiver*:

```yaml
    ports:
      - "127.0.0.1:8080:8080"         # only lighttpd reaches it
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

In `config.yaml`, point at tar1090 through the host (inside the container `localhost`
is the container itself):

```yaml
receiver:
  url: http://host.docker.internal/tar1090
  latitude: ...
  longitude: ...
```

Then:

```bash
docker compose run --rm flightflow flightflow check
docker compose up -d
```

## Serve it on port 80 with lighttpd

Install [`examples/lighttpd-flightflow.conf`](examples/lighttpd-flightflow.conf), which proxies
`/map/`, `/analytics/`, `/portrait/`, `/api/` and `/logos/` to the container and leaves
`/tar1090/` alone:

```bash
sudo cp lighttpd-flightflow.conf /etc/lighttpd/conf-available/97-flightflow.conf
sudo lighty-enable-mod flightflow
sudo lighttpd -tt -f /etc/lighttpd/lighttpd.conf && sudo systemctl reload lighttpd
```

Open `http://<pi>/map/`. If you prefer not to touch lighttpd, publish `8080:8080` instead
and use `http://<pi>:8080/`.

## Database password in a file of its own

To keep a PostgreSQL password out of `config.yaml`, put it in `~/flightflow/.env`
(`chmod 600`) and enable `env_file` in `docker-compose.yml`:

```
FLIGHTFLOW_DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require
```

Characters such as `@ : / ? #` in the password must be URL-encoded (`@` → `%40`).

## Updating

```bash
cd ~/flightflow && docker compose pull && docker compose up -d
```

## Moving from a manual install

If FlightFlow previously ran as a systemd service against the same database:

1. Stop the old service **before** starting the container (two collectors would store
   every position twice): `sudo systemctl disable --now <old-service>`.
2. Adopt the existing database once: `docker compose run --rm flightflow flightflow db stamp`
   (see [configuration](configuration.md#adopting-a-database-from-an-earlier-flightflow-install)).
3. `docker compose up -d`, then replace the old lighttpd aliases with the proxy above.
   Avoid doing it around `collector.compact_at` (00:30 UTC by default).
