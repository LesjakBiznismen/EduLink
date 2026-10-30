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
├── edulink-vite/     predloga React + Vite za prihodnji odjemalec
├── frontend-demo/    statični interaktivni prototip (HTML, CSS, JS)
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

Interaktivni prototip je v mapi `frontend-demo/` in je narejen samo s HTML, CSS in JavaScriptom, zato ne potrebuje strežnika ali orodij za gradnjo. Odpri `index.html` v brskalniku ali mapo postrezi lokalno:

```bash
python -m http.server 5188 --directory frontend-demo
```

Prototip vsebuje:

- **Prijavo in registracijo** (`index.html`, `register.html`) z izbiro vloge: učenec, učitelj ali administrator
- **Strani za učence**: predmeti (`domov.html`, `predmet.html`), naloge (`naloge.html`), gradiva (`gradiva.html`), koledar (`koledar.html`) in profil (`profil.html`)
- **Strani za osebje**: seznama učencev (`ucenci.html`) in učiteljev (`ucitelji.html`) ter upravljanje predmetov za učitelje in administratorja
- Slike predmetov v `slike/predmeti/`

Podatki so vzorčni (`data.js`, `store.js`) in se hranijo samo v brskalniku (`localStorage` in `sessionStorage`), nič se ne pošilja na strežnik. Skupen videz določa `style.css`, logika pa je v `app.js`, `staff.js`, `predmet.js` in `script.js`.

## Odjemalec React + Vite

Mapa `edulink-vite/` vsebuje predlogo, ustvarjeno z `npm create vite@latest` (React 19, Vite, ESLint). Zagon:

```bash
cd edulink-vite
npm install
npm run dev
```

Drugi ukazi: `npm run build` (produkcijska gradnja), `npm run lint` (preverjanje kode) in `npm run preview` (predogled gradnje).
