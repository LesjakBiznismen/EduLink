# Testni primeri

Vsak testni primer ima opis, pričakovani in dejanski rezultat ter status. Odkrite napake se vodijo v GitHub Issues
(predloga »Napaka«, z navedbo ID testnega primera).

- **Avtomatski testi** (`backend/test/api.test.js`): `npm test` v mapi `backend/` (potrebuje `docker compose up -d db`).
  Zadnji zagon (1. 11. 2026): **27 od 27 uspešnih**, proti PostgreSQL 17.
- **Ročni testi**: izvede jih ekipa v brskalniku. Stolpec »Dejanski rezultat« izpolnite pri testiranju; vrstice z oznako
  »ni izvedeno« še niso preizkušene.

Legenda statusa: **Uspešno**, **Neuspešno** (odprite issue), **Ni izvedeno**.

## Prijava in registracija

| ID | Vloga | Opis | Pričakovani rezultat | Dejanski rezultat | Status |
|---|---|---|---|---|---|
| TP-01 | vsi | Prijava z `admin` / `edulink123` | prijava uspe, vrne žeton in vlogo `admin` | avtomatski test »prijava s testnim geslom« | Uspešno |
| TP-02 | vsi | Prijava z napačnim geslom | napaka 401, sporočilo »Napačno uporabniško ime ali geslo« | avtomatski test | Uspešno |
| TP-03 | vsi | Dostop do API-ja brez prijave | 401 | avtomatski test »zaščitene poti zahtevajo žeton« | Uspešno |
| TP-04 | učenec | Registracija novega učenca, nato prijava | račun z vlogo `ucenec`; dvojna registracija vrne 409 | avtomatski test | Uspešno |
| TP-05 | učenec | Registracija s polji, ki vsebujejo vlogo `admin` | vloga ostane `ucenec`; uporabniško ime in e-naslov se ne ločita po velikosti črk | avtomatski test | Uspešno |
| TP-06 | vsi | Gesla v bazi so zgoščena | v tabeli `uporabniki` je samo hash `pbkdf2_sha256$…`, nikoli čisto besedilo | avtomatski test | Uspešno |
| TP-07 | učenec | Prijava prek vmesnika (`jan.novak1`) | preusmeritev na stran Predmeti | prijava uspela, API klici 200 (ročno, 1. 11. 2026) | Uspešno |

## Učenec

| ID | Opis | Pričakovani rezultat | Dejanski rezultat | Status |
|---|---|---|---|---|
| TP-10 | Pregled vpisanih predmetov in nalog | vidi samo naloge svojih predmetov, ocene so prikazane | avtomatski test | Uspešno |
| TP-11 | Zamenjava izbora predmetov; neznan predmet | izbor se shrani; neznan predmet vrne 400 | avtomatski test | Uspešno |
| TP-12 | Oddaja naloge | datoteka se shrani kot »Priimek Ime – Naslov naloge.končnica« (en-pomišljaj) | avtomatski test, ročno: `Novak Jan – Ponavljanje- kvadratna funkcija.pdf` | Uspešno |
| TP-13 | Ponovna oddaja brez potrditve | strežnik vrne 409 (`EXISTS`), stara datoteka ostane | avtomatski test | Uspešno |
| TP-14 | Ponovna oddaja s potrditvijo v vmesniku | vmesnik vpraša, stara datoteka se prepiše šele po »Da, zamenjaj oddajo«; ocena se odstrani | ročno 1. 11. 2026: ob prvem kliku brez zahteve na strežnik, po potrditvi vsebina zamenjana | Uspešno |
| TP-15 | Oddaja v predmet, v katerega učenec ni vpisan | 403 | avtomatski test | Uspešno |
| TP-16 | Oddaja datoteke, večje od 20 MB | 400, sporočilo o prevelikosti | avtomatski test | Uspešno |
| TP-17 | Prenos tuje oddaje | 403; seznam oddaj vsebuje samo lastne | avtomatski test | Uspešno |
| TP-18 | Prenos gradiva predmeta, ki ga učenec ne obiskuje | 403 | avtomatski test | Uspešno |
| TP-19 | Gradiva in koledar svojih predmetov | samo gradiva izbranih predmetov; koledar vsebuje roke in šolske dogodke | avtomatski test | Uspešno |
| TP-20 | Urejanje profila | šola in podatki se shranijo | avtomatski test | Uspešno |
| TP-21 | Dostop do administracije (`/users`) | 403 | avtomatski test | Uspešno |
| TP-22 | Odzivnost (telefon, 375 px) | spodnja navigacija, brez vodoravnega drsenja | | Ni izvedeno |

## Učitelj

| ID | Opis | Pričakovani rezultat | Dejanski rezultat | Status |
|---|---|---|---|---|
| TP-30 | Dodajanje naloge pri svojem predmetu; ocenjevanje oddaje 1–5 | naloga se ustvari, ocena se shrani; ocena 7 vrne 400 | avtomatski test | Uspešno |
| TP-31 | Dodajanje naloge pri tujem predmetu | 403 | avtomatski test | Uspešno |
| TP-32 | Nalaganje, prenos in brisanje gradiva | gradivo se shrani, prenese in po brisanju vrne 404 | avtomatski test | Uspešno |
| TP-33 | Nalaganje nedovoljene vrste datoteke (`.exe`) | 400 | avtomatski test | Uspešno |
| TP-34 | Ogled, ocenjevanje in brisanje pri tujem predmetu | 403; seznami vsebujejo samo lastne predmete | avtomatski test | Uspešno |
| TP-35 | Dostop do upravljanja uporabnikov, statistike in predmetov | 403 | avtomatski test | Uspešno |
| TP-36 | Profil učitelja (telefon, naziv, kabinet) | shrani se | avtomatski test | Uspešno |

## Administrator

| ID | Opis | Pričakovani rezultat | Dejanski rezultat | Status |
|---|---|---|---|---|
| TP-40 | Ustvarjanje, urejanje in brisanje predmeta z več učitelji | predmet z 2 učiteljema; brez učitelja 400 | avtomatski test | Uspešno |
| TP-41 | Ustvarjanje, urejanje in brisanje učenca; učenec z enim predmetom | račun se ustvari in lahko prijavi; z enim predmetom 400 | avtomatski test | Uspešno |
| TP-42 | Seznam učiteljev in statistika | 20 učiteljev, 100 testnih učencev, 10 predmetov | avtomatski test | Uspešno |
| TP-43 | Testni podatki ustrezajo navodilom | vsak predmet ima več učiteljev, učitelji poučujejo več predmetov, vsak učenec obiskuje več predmetov | avtomatski test | Uspešno |
| TP-44 | CRUD predmetov, učiteljev in učencev prek vmesnika | vse operacije delujejo, seznami se strani | | Ni izvedeno |

## Infrastruktura

| ID | Opis | Pričakovani rezultat | Dejanski rezultat | Status |
|---|---|---|---|---|
| TP-50 | `docker compose up --build` na čistem sistemu | vsebniki `db`, `backend`, `frontend` zdravi, baza napolnjena | ročno 1. 11. 2026: vsi trije zagnani, `/api/health` vrne ok | Uspešno |
| TP-51 | Baza v ločenem vsebniku | storitev `db` (PostgreSQL), povezava prek omrežja `edulink-net` | ročno 1. 11. 2026 | Uspešno |
| TP-52 | HTTP preusmeritev na HTTPS | 301 na `https://…` | ročno 1. 11. 2026 (curl) | Uspešno |
| TP-53 | HTTPS s samopodpisanim certifikatom | odgovor 200 prek TLS; brskalnik opozori na certifikat | ročno 1. 11. 2026 (curl -k; brskalnik zavrne neznanega izdajatelja, kot se pričakuje) | Uspešno |
| TP-54 | Varnostna kopija in obnovitev | po izbrisu vseh oddaj sta baza (381 oddaj) in datoteke vrnjeni | ročno 1. 11. 2026 | Uspešno |
| TP-55 | Let's Encrypt na javni domeni | veljaven certifikat brez opozorila | | Ni izvedeno |
| TP-56 | Dostop iz drugega računalnika v omrežju | aplikacija je dosegljiva prek naslova strežnika | | Ni izvedeno |
