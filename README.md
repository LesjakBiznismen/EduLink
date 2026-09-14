# EduLink

Spletna platforma za povezovanje učiteljev in študentov: predmeti, učna gradiva, naloge in oddaje na enem mestu.

## Funkcionalnosti

- **Uporabniki** s tremi vlogami: študent, učitelj, admin
- **Predmeti**, ki jih ustvarjajo učitelji, študenti pa se vanje vpisujejo
- **Gradiva** (datoteke), ki jih učitelji naložijo k predmetu
- **Naloge** z rokom oddaje in **oddaje** študentov z oceno ter povratno informacijo

## Struktura projekta

```
EduLink/
├── PB/               podatkovna baza (MySQL)
│   ├── edulink_initialize.SQL   ustvari bazo in tabele
│   └── edulink_insert_test.SQL  testni podatki
├── backend/          strežniški del (Node.js)
├── frontend/         odjemalec (React)
├── frontend-demo/    statični prototip prijavne strani
├── nginx/            konfiguracija obratnega posrednika
└── docker-compose.yml
```

## Podatkovna baza

Baza `edulink` (utf8mb4) vsebuje tabele:

| Tabela | Opis |
|---|---|
| `uporabniki` | računi z vlogo `student`, `ucitelj` ali `admin` |
| `predmeti` | predmeti in kdo jih je ustvaril |
| `ucitelji_predmeti` | kateri učitelj poučuje kateri predmet |
| `vpisi` | vpisi uporabnikov v predmete |
| `gradiva` | naložene datoteke pri predmetu |
| `naloge` | naloge z rokom oddaje |
| `oddaje` | oddane naloge, ocena in povratna informacija |

Vsi primarni ključi sledijo vzorcu `id_<tabela>` (npr. `id_uporabnik`), tuji ključi pa nosijo isto ime kot stolpec, na katerega kažejo.

## Zagon

Ustvari bazo in tabele:

```bash
mysql -u root -p < PB/edulink_initialize.SQL
```

Po želji naloži testne podatke:

```bash
mysql -u root -p edulink < PB/edulink_insert_test.SQL
```

Celoten sistem (baza, backend, frontend, nginx) se zažene z:

```bash
docker-compose up
```

Skrivnosti (gesla, ključi) hrani v datoteki `.env`, ki ni v repozitoriju.

## Prototip

Statični osnutek prijavne strani je v mapi `frontend-demo/`. Odpri `index.html` v brskalniku.
