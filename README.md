# EduLink

Spletna platforma za povezovanje učiteljev in učencev: predmeti, učna gradiva, naloge, oddaje in ocene na enem mestu.

## Funkcionalnosti

- **Uporabniki** s tremi vlogami: učenec, učitelj, administrator (prijava z uporabniškim imenom in geslom)
- **Predmeti**, ki jih upravlja administrator; učenci se vanje vpisujejo, učitelji jih poučujejo
- **Gradiva** (datoteke), ki jih učitelji naložijo k predmetu
- **Naloge** z rokom oddaje, **oddaje** učencev ter **ocene** (1–5) s povratno informacijo
- **Koledar** z roki nalog, testi in šolskimi dogodki

## Struktura projekta

```
EduLink/
├── PB/               podatkovna baza (SQLite): shema in testni podatki
├── backend/          strežnik REST API (Node.js, Express, SQLite)
├── edulink-vite/     odjemalec: aplikacija React + Vite
├── frontend/         rezervirano za prihodnji produkcijski odjemalec
├── frontend-demo/    prvotni statični prototip (HTML, CSS, JS), ohranjen za primerjavo
├── nginx/            konfiguracija obratnega posrednika
└── docker-compose.yml
```

## Zagon na localhostu

Potreben je **Node.js 22.13 ali novejši**. V dveh terminalih zaženite strežnik in odjemalca:

```bash
cd backend
npm install
npm run dev
```

```bash
cd edulink-vite
npm install
npm run dev
```

Aplikacija se odpre na <http://localhost:5173>, API pa teče na <http://localhost:3000/api>. Ob prvem zagonu
strežnik sam ustvari bazo `PB/edulink.db` iz `PB/schema.sql` in jo napolni s testnimi podatki iz `PB/insert.sql`.

Testni računi (geslo za vse je `edulink123`):

| Vloga | Uporabniško ime |
|---|---|
| Administrator | `admin` |
| Učitelj | `jan.novak.u1` (Matematika), `sara.krajnc.u2` (Slovenščina), … |
| Učenec | `jan.novak1`, `katja.vidmar2`, … |

Bazo ponastavite z `npm run db:reset` v mapi `backend/`. Seznam vseh poti API je v [backend/README.md](backend/README.md).

## Docker

Celoten sistem se zažene z enim ukazom (potreben je samo Docker). Pred tem v datoteki `.env` v korenu
repozitorija nastavite `JWT_SECRET`:

```bash
docker compose up --build
```

Aplikacija je nato na <http://localhost:8080>, API pa na <http://localhost:8080/api/>.

- **backend** (`backend/Dockerfile`): Node.js + Express nad SQLite bazo. Ob prvem zagonu ustvari bazo iz `PB/schema.sql` in jo napolni s `PB/insert.sql` (izklop: `SEED=false`). Baza in naložene datoteke so v volumnu `db-data`.
- **frontend** (`edulink-vite/Dockerfile`): zgradi React aplikacijo in jo postreže z nginx (`nginx/nginx.conf`), ki zahteve na `/api/` posreduje backendu.

Ponastavitev baze na testne podatke: `docker compose down -v`, nato znova `docker compose up`. Vrata frontenda se spremenijo s spremenljivko `FRONTEND_PORT`.

## Podatkovna baza

SQLite baza (`PB/schema.sql`) vsebuje tabele:

| Tabela | Opis |
|---|---|
| `sole` | šole uporabnikov |
| `uporabniki` | računi z vlogo `ucenec`, `ucitelj` ali `admin` |
| `predmeti` | predmeti (koda, ime, slika) |
| `ucitelji_predmeti` | kateri učitelj poučuje kateri predmet |
| `vpisi` | vpisi učencev v predmete |
| `gradiva` | gradiva predmeta (besedilo ali naložena datoteka) |
| `naloge` | naloge z rokom oddaje |
| `oddaje` | oddane naloge, ocena in povratna informacija |
| `dogodki` | testi, ustna spraševanja in šolski dogodki |

Podrobnosti so v [PB/README.md](PB/README.md). Starejša shema za MySQL je ohranjena v `PB/edulink_initialize.SQL`.

Skrivnosti (gesla, ključi) hranite v datotekah `.env`, ki niso v repozitoriju.

## Odjemalec (React + Vite)

Aplikacija v mapi `edulink-vite/` je narejena z Reactom 19 in Vitom in vse podatke bere ter shranjuje prek API:

- **Učenec**: vpis v predmete, naloge z oddajo datotek in ocenami, gradiva, koledar in profil
- **Učitelj**: svoji predmeti, pregled in ocenjevanje oddaj, dodajanje nalog ter nalaganje in brisanje gradiv
- **Administrator**: upravljanje predmetov, učiteljev in učencev ter statistika

Podrobnosti o strukturi kode in poteh so v [edulink-vite/README.md](edulink-vite/README.md).

## Prvotni prototip

Mapa `frontend-demo/` vsebuje prvotni statični prototip (HTML, CSS in JavaScript brez orodij za gradnjo), ki je ohranjen za primerjavo. Odpri `index.html` v brskalniku ali ga postrezi lokalno:

```bash
python -m http.server 5188 --directory frontend-demo
```
