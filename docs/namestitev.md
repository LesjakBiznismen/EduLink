# Namestitev in konfiguracija strežnika

Navodila veljajo za strežnik Linux (Ubuntu Server ali Debian) z Dockerjem; za razvoj zadostuje Docker Desktop.

## 1. Priprava strežnika (Ubuntu / Debian)

```bash
# Docker Engine in Compose (https://docs.docker.com/engine/install/)
sudo apt update && sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"      # nato se odjavite in znova prijavite

# Požarni zid: odprite samo SSH, HTTP in HTTPS (baza in backend ostaneta v Docker omrežju)
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable
```

## 2. Prenos in nastavitev

```bash
git clone <povezava do repozitorija> EduLink && cd EduLink
cp .env.example .env
```

V `.env` nastavite:

| Spremenljivka | Pomen |
|---|---|
| `JWT_SECRET` | skrivnost za podpisovanje žetonov, obvezna (`openssl rand -base64 48`) |
| `POSTGRES_PASSWORD` | geslo baze, obvezno; samo črke in številke |
| `POSTGRES_DB`, `POSTGRES_USER` | ime baze in uporabnika (privzeto `edulink`) |
| `SEED` | `true` = ob prvem zagonu vstavi testne podatke, `false` = prazna baza (za produkcijo) |
| `FRONTEND_PORT`, `HTTPS_PORT` | zunanja vrata HTTP in HTTPS (privzeto 8080 in 8443; na strežniku `80` in `443`) |
| `CERT_SAN` | dodatna imena/naslovi v samopodpisanem certifikatu, npr. `DNS:edulink,DNS:edulink.local,IP:192.168.1.10` |
| `SSL_CERT`, `SSL_KEY` | poti do pravega certifikata (Let's Encrypt), glej 4. razdelek |
| `POSTGRES_PORT` | vrata baze na tem računalniku, samo `127.0.0.1` (privzeto 5433) |

`.env` ni v repozitoriju. Ne objavljajte ga in ne uporabljajte testnih gesel na javnem strežniku.

## 3. Zagon

```bash
docker compose up -d --build
docker compose ps          # db, backend in frontend morajo biti "healthy" / "Up"
docker compose logs -f backend
```

Aplikacija je na `https://<naslov>:<HTTPS_PORT>`. Ob prvem zagonu backend ustvari tabele in (pri `SEED=true`)
testne podatke. Ponastavitev: `docker compose down -v` (izbriše bazo, datoteke in certifikat).

Posodobitev po novi različici kode: `git pull && docker compose up -d --build`.

**Pogosti problemi**

- `ports are not available` na 5432/5433 ali 8080: vrata že uporablja drug program; spremenite `POSTGRES_PORT` / `FRONTEND_PORT`.
- Backend se ne zažene, `JWT_SECRET` ali `POSTGRES_PASSWORD` manjka: dopolnite `.env` (compose izpiše razlog).
- Geslo baze ste spremenili po prvem zagonu: Postgres ga prebere samo ob ustvarjanju; spremenite ga z `ALTER USER` ali pa
  `docker compose down -v` (izbriše podatke).
- Lokalni zagon (`npm run dev`): `DATABASE_URL` v `backend/.env` mora imeti isto geslo kot `POSTGRES_PASSWORD`.

## 4. HTTPS

### Razvoj: samopodpisan certifikat

Nginx ob prvem zagonu sam ustvari samopodpisan certifikat (volumen `certs`). Brskalnik ob prvem obisku opozori,
da certifikatu ne zaupa; opozorilo potrdite ali certifikat dodate med zaupanja vredne. Če je strežnik dostopen tudi pod
imenom ali naslovom v lokalnem omrežju, ga dodajte v `CERT_SAN` in certifikat ustvarite znova:

```bash
docker compose down && docker volume rm edulink_certs && docker compose up -d
```

### Javna domena: Let's Encrypt (Certbot)

Predpogoji: javna domena, katere zapis A kaže na strežnik, ter odprta vrata 80 in 443. V `.env` nastavite
`FRONTEND_PORT=80` in `HTTPS_PORT=443`.

```bash
# 1. zagon z začasnim samopodpisanim certifikatom (nginx postreže izziv na vratih 80)
docker compose up -d --build

# 2. pridobitev certifikata (zamenjajte domeno in e-naslov)
docker compose --profile letsencrypt run --rm certbot certonly --webroot -w /var/www/certbot \
  -d moja-domena.si --email ime@moja-domena.si --agree-tos --no-eff-email

# 3. v .env nastavite pot do certifikata:
#    SSL_CERT=/etc/letsencrypt/live/moja-domena.si/fullchain.pem
#    SSL_KEY=/etc/letsencrypt/live/moja-domena.si/privkey.pem
docker compose up -d frontend
```

Certifikat velja 90 dni. Obnovo avtomatizirate s cronom (npr. vsak dan ob 3:00):

```cron
0 3 * * * cd /pot/do/EduLink && docker compose --profile letsencrypt run --rm certbot renew --quiet && docker compose exec -T frontend nginx -s reload
```

Ko HTTPS deluje z veljavnim certifikatom, v `nginx/default.conf.template` odkomentirajte glavo
`Strict-Transport-Security` in znova zgradite frontend.

## 5. Varnostne kopije

`scripts/backup.sh` naredi kopijo baze (`pg_dump`, stisnjeno) in naloženih datotek v mapo `backups/` (ni v repozitoriju)
ter izbriše kopije, starejše od 14 dni:

```bash
bash scripts/backup.sh                   # mapa backups/, hramba 14 dni
bash scripts/backup.sh /mnt/disk/kopije 30
```

Redno izvajanje (cron, vsak dan ob 2:00):

```cron
0 2 * * * /pot/do/EduLink/scripts/backup.sh >> /var/log/edulink-backup.log 2>&1
```

Obnovitev (prepiše trenutne podatke, backend se med njo ustavi):

```bash
bash scripts/restore.sh backups/edulink-db-<čas>.sql.gz backups/edulink-uploads-<čas>.tar.gz
```

Kopije hranite tudi zunaj strežnika (npr. `rsync` ali `scp` na drug računalnik). Obnovitev je preizkušena: po izbrisu oddaj
sta se baza in datoteke vrnili v stanje kopije.

## 6. Delo v skupini (Git in GitHub)

- Veji `main` (stabilna različica) in `develop` (razvoj); vsaka naloga na veji `feature/<ime>`, združevanje prek pull requestov
  (predloga v `.github/pull_request_template.md`) s pregledom kode drugega člana.
- Napake in naloge spremljajte v GitHub Issues (predlogi v `.github/ISSUE_TEMPLATE/`).
- Delovni tok `.github/workflows/ci.yml` ob vsakem pushu zažene teste backenda (s PostgreSQL), `lint` in `build` odjemalca.
- Končno različico označite z oznako/izdajo (`git tag v1.0.0`).
