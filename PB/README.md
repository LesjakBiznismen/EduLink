# EduLink – podatkovna baza (SQLite)

| Datoteka | Namen |
|---|---|
| `schema.sql` | Shema SQLite baze (tabele, tuji ključi, omejitve, indeksi, sprožilci, pogledi) |
| `seed.py` | Ustvari `edulink.db` iz sheme in jo napolni s testnimi podatki |
| `edulink_initialize.SQL` | Starejša shema za MySQL |

## Zagon

Potreben je samo Python 3 (modul `sqlite3` je že vgrajen).

```bash
cd PB
python seed.py              # ustvari PB/edulink.db
python seed.py drug.db      # ali bazo na drugi poti
```

Skripta vsakič izbriše obstoječo bazo in jo ustvari znova. Roki nalog in dogodki so
določeni glede na današnji datum, zato je baza vedno "sveža". Datoteka `edulink.db` je v
`.gitignore` in se ne shranjuje v repozitorij.

Samo prazno bazo brez podatkov ustvarite z orodjem `sqlite3`:

```bash
sqlite3 edulink.db < schema.sql
```

## Testni podatki

Podatki sledijo demu (`frontend-demo/store.js`, `data.js`):

- 1 administrator, 20 učiteljev, 100 učencev (imena, priimki in e-naslovi kot v demu),
- 10 predmetov; nekateri imajo več učiteljev, vsak učenec obiskuje 2–4 predmete,
- po 3 gradiva (zapiski, vaje, PDF prosojnice) in 3 naloge na predmet (ena s preteklim rokom),
- oddaje učencev; oddaje pretečenih nalog so ocenjene (1–5) s povratno informacijo,
- dogodki v koledarju: testi, ustna spraševanja in šolski dogodki.

Prijava: uporabniško ime `admin`, učitelji npr. `jan.novak.u1`, učenci npr. `jan.novak1`.
Vsi imajo testno geslo `edulink123` (shranjeno kot PBKDF2-SHA256 hash).

## Shema

- `sole`, `uporabniki` (vloga `ucenec` / `ucitelj` / `admin`)
- `predmeti`, `ucitelji_predmeti` (kdo poučuje), `vpisi` (kdo obiskuje)
- `gradiva` (besedilo ali naložena datoteka; mehko brisanje z `izbrisano_ob`)
- `naloge`, `oddaje` (ena oddaja na učenca in nalogo, ocena in povratna informacija)
- `dogodki` (koledar; `id_predmet` je NULL za dogodke cele šole)
- pogled `koledar`: roki nalog in dogodki skupaj
- pogled `pregled_oddaj`: stanje naloge za vsakega učenca (Oddano / Za oddajo / Rok je potekel)

Sprožilci preverijo, da predmet poučuje samo učitelj, da se vpiše samo učenec in da odda
samo učenec, ki je vpisan v predmet. Tuji ključi delujejo le, če povezava vklopi
`PRAGMA foreign_keys = ON;`.

## Primeri poizvedb

```sql
-- Odprte naloge učenca
SELECT n.naslov, n.rok_oddaje, p.stanje
FROM pregled_oddaj p JOIN naloge n USING (id_naloga)
WHERE p.id_ucenec = 22 AND p.stanje <> 'Oddano'
ORDER BY n.rok_oddaje;

-- Koledar za naslednjih 14 dni
SELECT * FROM koledar
WHERE datum BETWEEN date('now') AND date('now', '+14 days')
ORDER BY datum, cas;
```
