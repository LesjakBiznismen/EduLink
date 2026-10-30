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

Celoten sistem (baza, backend, frontend, nginx) se zažene z:

```bash
docker-compose up
```

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