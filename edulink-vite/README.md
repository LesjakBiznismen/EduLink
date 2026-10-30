# EduLink – odjemalec (React + Vite)

Spletna učilnica EduLink, narejena z Reactom 19 in Vitom. Aplikacija trenutno deluje brez strežnika in podatkovne baze: vzorčni podatki so v kodi, spremembe pa se hranijo samo v brskalniku (`localStorage`, `sessionStorage` in IndexedDB).

## Zagon

```bash
npm install
npm run dev
```

Aplikacija se odpre na <http://localhost:5173>.

| Ukaz | Opis |
|---|---|
| `npm run dev` | razvojni strežnik na localhostu |
| `npm run build` | produkcijska gradnja v mapo `dist/` |
| `npm run preview` | lokalni predogled produkcijske gradnje |
| `npm run lint` | preverjanje kode z ESLint |

## Vloge

Prijava je brez gesla, izbere se vloga:

- **Učenec** – izbere predmete, vidi naloge, gradiva in koledar, odda nalogo (datoteka ostane v brskalniku) in ureja profil. Lahko tudi ustvari nov profil (`/registracija`).
- **Učitelj** – vidi svoje predmete, oddaje učencev, dodaja naloge ter nalaga in briše gradiva.
- **Administrator** – dodaja, ureja in briše predmete, učitelje in učence.

## Zemljevid strani

| Pot | Stran |
|---|---|
| `/prijava`, `/registracija` | prijava in ustvarjanje profila |
| `/predmeti`, `/predmeti/:id` | seznam predmetov in stran predmeta |
| `/naloge` | naloge (učenec) oziroma oddaje (učitelj) |
| `/gradiva` | gradiva |
| `/koledar` | koledar rokov (učenec) |
| `/profil` | profil (učenec, učitelj) |
| `/ucitelji`, `/ucenci` | upravljanje oseb (administrator) |

## Struktura

```
src/
├── main.jsx, App.jsx         vstopna točka in poti (react-router-dom)
├── context/                  stanje aplikacije (AppProvider, useApp)
├── components/               skupne sestavine (Layout, Dialog, ...)
├── pages/                    strani za učence, pages/staff za učitelje in administratorja
├── data/                     vzorčni predmeti in začetni podatki
├── lib/                      pomožne funkcije in dostop do shrambe brskalnika
└── styles/style.css          skupni videz
public/slike/                 logotip in slike predmetov
```

Podatke lahko ponastavite tako, da v orodjih brskalnika izbrišete shrambo spletnega mesta (`localhost:5173`).
