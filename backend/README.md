# EduLink – strežnik (Node.js + Express)

REST API, ki povezuje odjemalca `edulink-vite/` s podatkovno bazo PostgreSQL (shema in podatki v mapi `PB/`).
Baza teče v svojem Docker vsebniku; strežnik se nanjo povezuje z gonilnikom `pg`. Potreben je **Node.js 22.13 ali novejši**.

## Zagon

```bash
docker compose up -d db      # v korenu repozitorija: zažene samo bazo (vrata 127.0.0.1:5433)
cd backend
cp .env.example .env         # nastavite JWT_SECRET in geslo v DATABASE_URL (enako kot POSTGRES_PASSWORD)
npm install
npm run dev
```

Strežnik posluša na <http://localhost:3000>. Če tabele v bazi še ne obstajajo, jih ob zagonu ustvari iz
`PB/schema.sql` in napolni s testnimi podatki iz `PB/insert.sql`. Odjemalec (`npm run dev` v `edulink-vite/`)
zahteve `/api` samodejno posreduje na ta strežnik.

| Ukaz | Opis |
|---|---|
| `npm run dev` | zagon s samodejnim ponovnim zagonom ob spremembah |
| `npm start` | običajen zagon |
| `npm run db:reset` | izbriše tabele in naložene datoteke ter bazo ustvari znova |
| `npm test` | integracijski testi API; potrebujejo zagnano bazo, vsak zagon dobi svojo shemo, ki se po testih izbriše |

Nastavitve so v `.env` (glej `.env.example`): `PORT`, `DATABASE_URL`, `UPLOAD_DIR`, `JWT_SECRET` (obvezna), `JWT_EXPIRES_IN`.
Z `SQL_DIR` določite mapo s `schema.sql` in `insert.sql`, s `SEED=false` pa se nova baza ustvari brez testnih podatkov.
`DB_SCHEMA` (neobvezno) izbere shemo v bazi; uporabljajo ga testi.

## Prijava

Vsi testni uporabniki imajo geslo `edulink123`: administrator `admin`, učitelji npr. `jan.novak.u1`,
učenci npr. `jan.novak1`. Prijava vrne žeton JWT, ki ga odjemalec pošilja v glavi
`Authorization: Bearer <žeton>`. Gesla so shranjena kot PBKDF2-SHA256 (enak zapis kot v `insert.sql`).

## API

Vse poti razen prijave, registracije in `/api/health` zahtevajo žeton. Napake vrnejo `{ "error": "..." }`.
Predmet je v API določen s kodo (npr. `matematika`).

| Metoda in pot | Kdo | Opis |
|---|---|---|
| `POST /api/auth/login` | vsi | prijava (`username` ali e-naslov, `password`) |
| `POST /api/auth/register` | vsi | registracija učenca |
| `GET /api/auth/me` | prijavljeni | trenutni uporabnik |
| `GET /api/subjects`, `GET /api/subjects/:koda` | prijavljeni | predmeti z učitelji in številom učencev |
| `POST /api/subjects`, `PUT/DELETE /api/subjects/:koda` | admin | upravljanje predmetov in učiteljev predmeta |
| `GET /api/me/subjects` | učenec, učitelj | kode predmetov, ki jih obiskuje / poučuje |
| `PUT /api/me/subjects` | učenec | zamenja izbor predmetov (vpisi) |
| `GET /api/assignments` | prijavljeni | naloge vidnih predmetov; učenec dobi tudi svojo oddajo in oceno |
| `POST /api/assignments`, `PUT/DELETE /api/assignments/:id` | učitelj predmeta | upravljanje nalog |
| `GET /api/assignments/:id/submissions` | učitelj predmeta | vsi vpisani učenci in njihove oddaje |
| `POST /api/assignments/:id/submission` | učenec | oddaja (multipart `file`); datoteka se shrani kot »Priimek Ime – Naslov naloge.končnica«. Če oddaja že obstaja, strežnik vrne `409` s kodo `EXISTS` in jo zamenja šele ob `?confirm=1` (po potrditvi učenca) |
| `GET /api/submissions` | učitelj, učenec | oddaje pri učiteljevih predmetih oziroma lastne oddaje |
| `GET /api/submissions/:id/file` | lastnik, učitelj | prenos oddane datoteke |
| `PATCH /api/submissions/:id/grade` | učitelj predmeta | ocena 1–5 in povratna informacija |
| `GET /api/materials` | prijavljeni | gradiva vidnih predmetov |
| `POST /api/materials` | učitelj predmeta | nalaganje gradiva (multipart `subject`, `type`, `title`, `file`) |
| `GET /api/materials/:id/file` | prijavljeni | prenos datoteke gradiva |
| `DELETE /api/materials/:id` | učitelj predmeta | mehki izbris gradiva |
| `GET /api/calendar?from=&to=` | prijavljeni | roki nalog in dogodki (pogled `koledar`) |
| `POST /api/calendar/events`, `DELETE /api/calendar/events/:id` | učitelj, admin | dogodki v koledarju |
| `GET/PUT /api/profile`, `PUT /api/profile/password` | prijavljeni | profil in sprememba gesla |
| `GET/POST /api/users?role=`, `GET/PUT/DELETE /api/users/:id` | admin | upravljanje učiteljev in učencev |
| `GET /api/stats` | admin | število predmetov, uporabnikov, nalog, oddaj in gradiv |

Naložene datoteke se shranijo v `UPLOAD_DIR` (privzeto `backend/uploads/`), v bazi pa je njihova pot.
Testni podatki se sklicujejo na datoteke, ki jih na disku ni; prenos takih datotek vrne 404.

## Struktura

```
src/
├── server.js, app.js     zagon strežnika in Express aplikacija (poti, obdelava napak)
├── config.js, db.js      nastavitve ter povezava z bazo in njena inicializacija
├── middleware/           avtentikacija (JWT, vloge) in nalaganje datotek (multer)
├── routes/               poti API po področjih
├── lib/                  gesla, preverjanje vnosa, pravice dostopa, datoteke, pretvorba vrstic
└── scripts/reset-db.js   ponastavitev baze
test/api.test.js          integracijski testi
```
