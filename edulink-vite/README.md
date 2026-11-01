# EduLink – odjemalec (React + Vite)

Spletna učilnica EduLink, narejena z Reactom 19 in Vitom. Vsi podatki (uporabniki, predmeti, naloge, oddaje,
gradiva, koledar) se berejo in shranjujejo prek strežnika v mapi [`backend/`](../backend/README.md), ki jih hrani
v bazi PostgreSQL.

## Zagon

Najprej zaženite strežnik (`npm run dev` v mapi `backend/`), nato odjemalca:

```bash
npm install
npm run dev
```

Aplikacija se odpre na <http://localhost:5173>. Razvojni strežnik Vite zahteve `/api` posreduje na
<http://localhost:3000> (drug naslov nastavite s spremenljivko `VITE_API_TARGET`).

| Ukaz | Opis |
|---|---|
| `npm run dev` | razvojni strežnik na localhostu |
| `npm run build` | produkcijska gradnja v mapo `dist/` |
| `npm run preview` | lokalni predogled produkcijske gradnje |
| `npm run lint` | preverjanje kode z ESLint |

## Vloge

Prijava je z uporabniškim imenom in geslom; vlogo določi strežnik. Testni računi imajo geslo `edulink123`
(`admin`, učitelj `jan.novak.u1`, učenec `jan.novak1`).

- **Učenec** – se vpiše v predmete, vidi naloge, gradiva in koledar, odda nalogo (datoteka se naloži na strežnik), vidi oceno in ureja profil. Lahko tudi ustvari nov račun (`/registracija`).
- **Učitelj** – vidi svoje predmete in oddaje učencev, jih prenese in oceni, dodaja naloge ter nalaga in briše gradiva.
- **Administrator** – dodaja, ureja in briše predmete, učitelje in učence ter vidi statistiko.

## Zemljevid strani

| Pot | Stran |
|---|---|
| `/prijava`, `/registracija` | prijava in ustvarjanje računa |
| `/predmeti`, `/predmeti/:id` | seznam predmetov in stran predmeta |
| `/naloge` | naloge (učenec) oziroma oddaje (učitelj) |
| `/gradiva` | gradiva |
| `/koledar` | koledar rokov in dogodkov (učenec) |
| `/profil` | profil in sprememba gesla |
| `/ucitelji`, `/ucenci` | upravljanje oseb (administrator) |

## Struktura

```
src/
├── main.jsx, App.jsx         vstopna točka in poti (react-router-dom)
├── context/                  stanje aplikacije (AppProvider, useApp) in nalaganje podatkov s strežnika
├── components/               skupne sestavine (Layout, Dialog, ...)
├── pages/                    strani za učence, pages/staff za učitelje in administratorja
├── data/                     seznam slik predmetov
├── lib/                      odjemalec API (api.js) in pomožne funkcije
└── styles/style.css          skupni videz
public/slike/                 logotip in slike predmetov
```

Žeton prijave se hrani v `sessionStorage` in velja do odjave, zaprtja zavihka ali poteka seje.
