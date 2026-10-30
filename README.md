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
├── frontend/         rezervirano za prihodnji produkcijski odjemalec
├── edulink-vite/     odjemalec: aplikacija React + Vite (deluje brez backenda)
├── frontend-demo/    prvotni statični prototip (HTML, CSS, JS), ohranjen za primerjavo
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

## Docker

Celoten sistem se zažene z enim ukazom (potreben je samo Docker):

```bash
docker compose up --build
```

Aplikacija je nato na <http://localhost:8080>, API pa na <http://localhost:8080/api/>.

- **backend** (`backend/Dockerfile`): Node.js + Express nad SQLite bazo. Ob prvem zagonu ustvari bazo iz `PB/schema.sql` in jo napolni s `PB/insert.sql` (izklop: `SEED=false`). Baza je v volumnu `db-data`.
- **frontend** (`edulink-vite/Dockerfile`): zgradi React aplikacijo in jo postreže z nginx (`nginx/nginx.conf`), ki zahteve na `/api/` posreduje backendu.

API (samo branje): `/api/health`, `/api/uporabniki?vloga=ucitelj`, `/api/predmeti`, `/api/predmeti/:id`, `/api/predmeti/:id/naloge`, `/api/predmeti/:id/gradiva`, `/api/koledar`.

Ponastavitev baze na testne podatke: `docker compose down -v`, nato znova `docker compose up`. Vrata frontenda se spremenijo s spremenljivko `FRONTEND_PORT`.

Skrivnosti (gesla, ključi) hrani v datoteki `.env`, ki ni v repozitoriju.


## Odjemalec (React + Vite)

Celotna aplikacija je v mapi `edulink-vite/` in je narejena z Reactom 19 in Vitom. Za zdaj deluje brez backenda in podatkovne baze: vzorčni podatki so v kodi, spremembe pa se hranijo samo v brskalniku. Zagon na localhostu:

```bash
cd edulink-vite
npm install
npm run dev
```

Aplikacija se odpre na <http://localhost:5173>. Drugi ukazi: `npm run build` (produkcijska gradnja), `npm run preview` (predogled gradnje) in `npm run lint` (preverjanje kode).

Prijava je brez gesla, izbere se vloga:

- **Učenec**: izbira predmetov, naloge z oddajo datotek, gradiva, koledar rokov in profil
- **Učitelj**: svoji predmeti, pregled oddaj, dodajanje nalog ter nalaganje in brisanje gradiv
- **Administrator**: upravljanje predmetov, učiteljev in učencev

Podrobnosti o strukturi kode in poteh so v [edulink-vite/README.md](edulink-vite/README.md).

## Prvotni prototip

Mapa `frontend-demo/` vsebuje prvotni statični prototip (HTML, CSS in JavaScript brez orodij za gradnjo), ki je ohranjen za primerjavo. Odpri `index.html` v brskalniku ali ga postrezi lokalno:

```bash
python -m http.server 5188 --directory frontend-demo
```