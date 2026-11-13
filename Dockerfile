# syntax=docker/dockerfile:1.7
# FlightFlow: one image with the collector (API + ingestion) and the three web apps.

# ── 1. Build the web apps (runs on the build host's arch: no QEMU for Vite) ──────
FROM --platform=$BUILDPLATFORM node:20-alpine AS web
WORKDIR /src
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY services/map/package.json services/map/
COPY services/analytics/package.json services/analytics/
COPY services/portrait/package.json services/portrait/
RUN npm ci --no-audit --no-fund
COPY packages packages
COPY services/map services/map
COPY services/analytics services/analytics
COPY services/portrait services/portrait
RUN npm run build

# ── 2. Runtime ───────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLIGHTFLOW_CONFIG=/config/config.yaml \
    FLIGHTFLOW_DATA_DIR=/data \
    FLIGHTFLOW_WEB_DIR=/app/web \
    FLIGHTFLOW_PORT=8080
WORKDIR /app
COPY services/collector/pyproject.toml services/collector/README.md ./collector/
COPY services/collector/flightflow ./collector/flightflow
COPY packages/shared/src/data/airlines.json ./collector/flightflow/static/airlines.json
RUN pip install --no-cache-dir ./collector \
    && useradd --system --uid 1000 --user-group --home /app flightflow \
    && mkdir -p /data /config \
    && chown flightflow:flightflow /data
COPY --from=web /src/services/map/dist ./web/map
COPY --from=web /src/services/analytics/dist ./web/analytics
COPY --from=web /src/services/portrait/dist ./web/portrait
COPY services/collector/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; urllib.request.urlopen('http://127.0.0.1:8080/api/health', timeout=4)" || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["flightflow", "serve"]
