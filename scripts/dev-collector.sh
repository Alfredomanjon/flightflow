#!/usr/bin/env bash
# Runs the collector with auto-reload on :8001 for development.
# Creates services/collector/.venv on first use.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/services/collector"
if [ ! -x .venv/bin/flightflow ]; then
  echo "Creating Python virtualenv in services/collector/.venv…"
  python3 -m venv .venv
  .venv/bin/pip install -q -e '.[dev]'
fi
export FLIGHTFLOW_CONFIG="${FLIGHTFLOW_CONFIG:-$ROOT/config.yaml}"
export FLIGHTFLOW_DATA_DIR="${FLIGHTFLOW_DATA_DIR:-$ROOT/data}"
exec .venv/bin/flightflow serve --reload --host 127.0.0.1 --port "${FLIGHTFLOW_DEV_PORT:-8001}"
