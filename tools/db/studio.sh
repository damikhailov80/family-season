#!/usr/bin/env bash
# Opens Prisma Studio over the dev database. Prisma is not a dependency and there is no schema
# file: Studio reads the tables straight from the database. Pinned to 7.x because the 8.x
# prerelease under `latest` ships without the studio command.
set -euo pipefail

[ -f .env.local ] && set -a && . ./.env.local && set +a
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is empty, see .env.example"
  exit 1
fi

exec npx -y prisma@7.10.0 studio --url "$DATABASE_URL" --port 5555
