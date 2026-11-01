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
├── PB/               podatkovna baza (PostgreSQL): shema in testni podatki
├── backend/          strežnik REST API (Node.js, Express, PostgreSQL)
├── edulink-vite/     odjemalec: aplikacija React + Vite
├── frontend/         rezervirano za prihodnji produkcijski odjemalec (samo javne slike)
├── frontend-demo/    prvotni statični prototip (HTML, CSS, JS), ohranjen za primerjavo
├── nginx/            obrnjeni posrednik (HTTPS) in samopodpisan certifikat za razvoj
├── scripts/          varnostna kopija in obnovitev baze
├── docs/             dokumentacija: ER diagram, arhitektura, namestitev, navodila, testni primeri
└── docker-compose.yml
```

## Zagon na localhostu

Potrebna sta **Node.js 22.13 ali novejši** in Docker (za bazo PostgreSQL). Bazo zaženite v korenu repozitorija,
nato v dveh terminalih strežnik in odjemalca:

```bash
cp .env.example .env              # nastavite JWT_SECRET in POSTGRES_PASSWORD
docker compose up -d db
```

```bash
cd backend
cp .env.example .env              # JWT_SECRET in geslo v DATABASE_URL (enako kot POSTGRES_PASSWORD)
npm install
npm run dev
```

```bash
cd edulink-vite
npm install
npm run dev
```

Aplikacija se odpre na <http://localhost:5173>, API pa teče na <http://localhost:3000/api>. Ob prvem zagonu
strežnik sam ustvari tabele iz `PB/schema.sql` in jih napolni s testnimi podatki iz `PB/insert.sql`.

Testni računi (geslo za vse je `edulink123`):

| Vloga | Uporabniško ime |
|---|---|
| Administrator | `admin` |
| Učitelj | `jan.novak.u1` (Matematika), `sara.krajnc.u2` (Slovenščina), … |
| Učenec | `jan.novak1`, `katja.vidmar2`, … |

Bazo ponastavite z `npm run db:reset` v mapi `backend/`. Seznam vseh poti API je v [backend/README.md](backend/README.md).

## Docker

Celoten sistem se zažene z enim ukazom (potreben je samo Docker). Pred tem iz `.env.example` ustvarite
datoteko `.env` v korenu repozitorija in nastavite `JWT_SECRET` ter `POSTGRES_PASSWORD`:

```bash
cp .env.example .env
docker compose up --build
```

Aplikacija je nato na <https://localhost:8443> (<http://localhost:8080> preusmeri nanjo), API pa na `/api/`.
Brskalnik ob prvem obisku javi opozorilo, ker je certifikat za razvoj samopodpisan (ustvari ga nginx sam);
za pravi certifikat glej [docs/namestitev.md](docs/namestitev.md).

- **db**: PostgreSQL 17 v svojem vsebniku; podatki so v volumnu `pg-data`. Vsebniki so povezani v omrežje `edulink-net`.
- **backend** (`backend/Dockerfile`): Node.js + Express. Ob prvem zagonu ustvari tabele iz `PB/schema.sql` in jih napolni s `PB/insert.sql` (izklop: `SEED=false`). Naložene datoteke so v volumnu `uploads`.
- **frontend** (`edulink-vite/Dockerfile`): zgradi React aplikacijo in jo postreže z nginx (`nginx/default.conf.template`) prek HTTPS; zahteve na `/api/` posreduje backendu.
- **adminer** (neobvezno): `docker compose --profile tools up -d adminer`, spletno orodje za bazo na <http://localhost:8081>.

Ponastavitev na testne podatke: `docker compose down -v`, nato znova `docker compose up`. Vrata se spremenijo
s spremenljivkami `FRONTEND_PORT` (HTTP) in `HTTPS_PORT`. Varnostne kopije: `bash scripts/backup.sh`.

## Podatkovna baza

Baza PostgreSQL (`PB/schema.sql`, ER diagram v [docs/er-diagram.md](docs/er-diagram.md)) vsebuje tabele:

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

Podrobnosti so v [PB/README.md](PB/README.md).

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
