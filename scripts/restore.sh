#!/usr/bin/env bash
# Obnovitev baze (in po želji datotek) iz varnostne kopije. PREPIŠE trenutne podatke!
#   bash scripts/restore.sh backups/edulink-db-<čas>.sql.gz [backups/edulink-uploads-<čas>.tar.gz]
# Skript pred obnovitvijo ustavi backend in ga po njej znova zažene.
set -euo pipefail

cd "$(dirname "$0")/.."
DB_DUMP="${1:?Podajte datoteko s kopijo baze (edulink-db-*.sql.gz).}"
UPLOADS="${2:-}"
[ -f "$DB_DUMP" ] || { echo "Datoteka $DB_DUMP ne obstaja." >&2; exit 1; }

read -r -p "Trenutna baza bo izbrisana in nadomeščena s kopijo $DB_DUMP. Nadaljujem? [d/N] " answer
[ "$answer" = "d" ] || { echo "Prekinjeno."; exit 1; }

docker compose stop backend
# Shemo public izbrišemo in ustvarimo znova, nato naložimo kopijo (ob napaki se ustavi).
gunzip -c "$DB_DUMP" | docker compose exec -T db sh -c '
  psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" &&
  psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

if [ -n "$UPLOADS" ]; then
  [ -f "$UPLOADS" ] || { echo "Datoteka $UPLOADS ne obstaja." >&2; exit 1; }
  # /data/uploads je priklop volumna, zato izbrišemo samo njegovo vsebino.
  docker compose run --rm --no-deps -T --entrypoint sh backend -c 'mkdir -p /data/uploads && find /data/uploads -mindepth 1 -delete && tar -C /data -xzf -' < "$UPLOADS"
fi

docker compose start backend
echo "Obnovitev je končana."
