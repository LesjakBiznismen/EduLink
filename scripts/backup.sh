#!/usr/bin/env bash
# Varnostna kopija podatkovne baze (pg_dump) in naloženih datotek (gradiva, oddaje).
#   bash scripts/backup.sh [mapa_za_kopije] [dni_hrambe]
# Privzeto: mapa backups/, hramba 14 dni. Zaženite iz katere koli mape; vsebniki morajo teči.
# Redno izvajanje (cron, vsak dan ob 2:00):  0 2 * * * /pot/do/EduLink/scripts/backup.sh >> /var/log/edulink-backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."
DIR="${1:-backups}"
KEEP_DAYS="${2:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DIR"

# Uporabnik in ime baze sta v okolju vsebnika db (POSTGRES_USER, POSTGRES_DB), zato gesla ne potrebujemo.
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip > "$DIR/edulink-db-$STAMP.sql.gz"
docker compose exec -T backend sh -c 'mkdir -p /data/uploads && tar -C /data -czf - uploads' > "$DIR/edulink-uploads-$STAMP.tar.gz"

# Prazna ali okrnjena kopija je slabša od nobene: preverimo, da datoteki nista prazni.
for file in "$DIR/edulink-db-$STAMP.sql.gz" "$DIR/edulink-uploads-$STAMP.tar.gz"; do
  [ -s "$file" ] || { echo "NAPAKA: $file je prazna." >&2; exit 1; }
done

# Odstranimo kopije, starejše od KEEP_DAYS dni.
find "$DIR" -maxdepth 1 -name 'edulink-*' -mtime "+$KEEP_DAYS" -delete

echo "Varnostna kopija je shranjena: $DIR/edulink-db-$STAMP.sql.gz in $DIR/edulink-uploads-$STAMP.tar.gz"
