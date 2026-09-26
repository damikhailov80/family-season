#!/usr/bin/env bash
# Brings the local postgres up: creates the container on first run, starts it afterwards.
# The data lives in the volume, so recreating the container loses nothing.
set -euo pipefail

NAME=family-season-db
VOLUME=family-season-pgdata
PORT=5432

busy=$(docker ps --filter "publish=$PORT" --format '{{.Names}}' | grep -vx "$NAME" || true)
if [ -n "$busy" ]; then
  echo "Port $PORT is taken by the container: $busy"
  echo "Stop it first: docker stop $busy"
  exit 1
fi

# A container created while the port was busy ends up without a published port.
if docker container inspect "$NAME" >/dev/null 2>&1 &&
  [ -z "$(docker inspect "$NAME" --format '{{json .HostConfig.PortBindings}}' | grep "$PORT")" ]; then
  echo "$NAME has no published port, recreating it (the data stays in $VOLUME)"
  docker rm -f "$NAME" >/dev/null
fi

if docker container inspect "$NAME" >/dev/null 2>&1; then
  docker start "$NAME" >/dev/null
else
  docker run -d --name "$NAME" \
    -e POSTGRES_PASSWORD=local -e POSTGRES_DB=family_season \
    -p "$PORT:5432" -v "$VOLUME:/var/lib/postgresql" \
    postgres:18-alpine >/dev/null
fi

# pg_isready answers during the image's init too, so ask for a real query.
for _ in $(seq 1 30); do
  docker exec "$NAME" psql -U postgres -d family_season -c 'select 1' >/dev/null 2>&1 && break
  sleep 1
done

if [ -z "$(docker exec "$NAME" psql -U postgres -tAc "select 1 from pg_database where datname = 'family_season_e2e'")" ]; then
  docker exec "$NAME" createdb -U postgres family_season_e2e
fi

echo "postgres is up on localhost:$PORT (family_season, family_season_e2e)"
