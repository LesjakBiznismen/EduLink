# EduLink – podatkovna baza (PostgreSQL)

| Datoteka | Namen |
|---|---|
| `schema.sql` | Shema PostgreSQL (tabele, tuji ključi, omejitve, indeksi, sprožilci, pogledi) |
| `insert.sql` | INSERT stavki s testnimi podatki |

Baza teče v lastnem Docker vsebniku (storitev `db` v `docker-compose.yml`, slika `postgres:17-alpine`),
ločenem od aplikacije; backend se nanjo povezuje prek skupnega Docker omrežja (`DATABASE_URL`).
ER diagram je v [docs/er-diagram.md](../docs/er-diagram.md).

## Zagon

Backend (`backend/`) ob zagonu preveri, ali tabele obstajajo; če ne, ustvari shemo iz `schema.sql` in
(razen pri `SEED=false`) vstavi testne podatke iz `insert.sql`. `npm run db:reset` shemo `public` izbriše
in bazo ustvari znova.

Ročno (na prazni bazi) z orodjem `psql`; v dockerju ni treba nameščati ničesar:

```bash
docker compose up -d db
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < PB/schema.sql
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < PB/insert.sql
```

`schema.sql` ne izbriše obstoječih tabel, zato jo zaženite na prazni bazi (ali najprej
`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`). Spletno orodje za pregled baze:
`docker compose --profile tools up -d adminer` (<http://localhost:8081>, strežnik `db`).

## Testni podatki

Podatki ustrezajo zahtevam navodil projekta:

- 1 administrator, **20 učiteljev** in **100 učencev**,
- **10 predmetov**; vsak predmet ima več učiteljev, nekateri učitelji poučujejo več predmetov,
  vsak učenec obiskuje več kot en predmet (2–4),
- po 3 gradiva (zapiski, vaje, PDF prosojnice) in 3 naloge na predmet (ena s preteklim rokom),
- oddaje učencev; oddaje pretečenih nalog so ocenjene (1–5) s povratno informacijo,
- dogodki v koledarju: testi, ustna spraševanja in šolski dogodki.

Roki in dogodki so postavljeni okoli 30. 10. 2026.

Prijava: uporabniško ime `admin`, učitelji npr. `jan.novak.u1`, učenci npr. `jan.novak1`.
Vsi imajo testno geslo `edulink123` (shranjeno kot PBKDF2-SHA256 hash). Testni računi so samo za razvoj:
pred javno objavo nastavite `SEED=false` ali zamenjajte gesla.

## Shema

- `sole`, `uporabniki` (vloga `ucenec` / `ucitelj` / `admin`; `telefon`, `naziv` in `kabinet` za profil učitelja;
  `e_posta` in `uporabnisko_ime` sta tipa `citext`, torej se ne ločita po velikosti črk)
- `predmeti`, `ucitelji_predmeti` (kdo poučuje), `vpisi` (kdo obiskuje)
- `gradiva` (besedilo ali naložena datoteka; mehko brisanje z `izbrisano_ob`)
- `naloge`, `oddaje` (ena oddaja na učenca in nalogo, ocena in povratna informacija;
  `datoteka_ime` je ime datoteke na strežniku »Priimek Ime – Naslov naloge« s končnico)
- `dogodki` (koledar; `id_predmet` je NULL za dogodke cele šole)
- pogled `koledar`: roki nalog in dogodki skupaj
- pogled `pregled_oddaj`: stanje naloge za vsakega učenca (Oddano / Za oddajo / Rok je potekel)

Časi so shranjeni v UTC (`TIMESTAMP`), roki nalog kot `DATE`. Sprožilci (funkcije `plpgsql`) preverijo,
da predmet poučuje samo učitelj, da se vpiše samo učenec in da odda samo učenec, ki je vpisan v predmet.

## Primeri poizvedb

```sql
-- Odprte naloge učenca
SELECT n.naslov, n.rok_oddaje, p.stanje
FROM pregled_oddaj p JOIN naloge n USING (id_naloga)
WHERE p.id_ucenec = 22 AND p.stanje <> 'Oddano'
ORDER BY n.rok_oddaje;

-- Koledar za naslednjih 14 dni
SELECT * FROM koledar
WHERE datum BETWEEN CURRENT_DATE AND CURRENT_DATE + 14
ORDER BY datum, cas;

-- Učitelji posameznega predmeta
SELECT p.naziv, string_agg(u.priimek || ' ' || u.ime, ', ' ORDER BY u.priimek) AS ucitelji
FROM predmeti p
JOIN ucitelji_predmeti up USING (id_predmet)
JOIN uporabniki u ON u.id_uporabnik = up.id_ucitelj
GROUP BY p.id_predmet, p.naziv ORDER BY p.id_predmet;
```

## Varnostne kopije

`scripts/backup.sh` naredi kopijo baze (`pg_dump`) in naloženih datotek, `scripts/restore.sh` ju obnovi.
Navodila so v [docs/namestitev.md](../docs/namestitev.md).
