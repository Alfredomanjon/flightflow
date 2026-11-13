#!/bin/sh
# Starts as root only to make the data volume writable (Docker creates ./data as root),
# then drops to the unprivileged `flightflow` user.
set -e
if [ "$(id -u)" = "0" ]; then
  chown flightflow:flightflow /data 2>/dev/null || true
  [ -d /data/logos ] && chown -R flightflow:flightflow /data/logos 2>/dev/null || true
  exec setpriv --reuid=flightflow --regid=flightflow --init-groups "$@"
fi
exec "$@"
