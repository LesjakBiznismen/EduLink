# Skladnost z navodili projekta

Pregled zahtev iz navodil (6 tednov, 3 člani) in stanja v repozitoriju. Stolpec »Kje« kaže na datoteke ali dokumentacijo.

## Tehnologije in orodja (2. poglavje)

| Zahteva | Stanje | Kje |
|---|---|---|
| Git in GitHub (veje, pull requesti, pregled kode, Issues) | predloge in CI so pripravljeni; **veje, PR-je in Issues mora ekipa uporabljati sama** | `.github/`, [namestitev.md](namestitev.md) |
| Docker in Docker Compose (spletni strežnik, aplikacija, baza v ločenih, povezanih vsebnikih) | izpolnjeno | `docker-compose.yml`, [arhitektura.md](arhitektura.md) |
| Operacijski sistem strežnika Linux | vsebniki so Linux (alpine); **postavitev na strežnik še ni narejena** | [namestitev.md](namestitev.md) |
| Relacijski SUPB (PostgreSQL) v svojem Docker vsebniku | izpolnjeno | storitev `db`, `PB/schema.sql` |
| Razvojno ogrodje (JavaScript/Node.js z Express) | izpolnjeno | `backend/` |
| Obrnjeni posrednik (Nginx) s HTTPS | izpolnjeno (samopodpisan certifikat za razvoj) | `nginx/` |
| Šifrirana povezava za javno domeno (Let's Encrypt, Certbot) | postopek in storitev sta pripravljena; **domena in certifikat še nista nastavljena** | [namestitev.md](namestitev.md), storitev `certbot` |
| Gesla zgoščena | izpolnjeno: PBKDF2-SHA256 (Node `crypto`, 100.000 ponovitev, naključna sol). OWASP danes priporoča več ponovitev; števili se lahko poveča v `backend/src/lib/password.js` (obstoječi hashi ostanejo veljavni, ker zapis vsebuje število ponovitev) | `backend/src/lib/password.js` |

## Zahteve za aplikacijo (4. poglavje)

| Zahteva | Stanje |
|---|---|
| Administrator: vpis, popravljanje in brisanje predmetov (≥10), učiteljev (≥20), učencev (≥100) | vse prek vmesnika; testni podatki: 10 predmetov, 20 učiteljev, 100 učencev |
| Določanje, kateri učitelji poučujejo katere predmete (več učiteljev na predmet, več predmetov na učitelja) | izpolnjeno (dialoga pri predmetu in osebi) |
| Določanje predmetov učenca (vsak več kot en predmet) | izpolnjeno; administrator zahteva vsaj 2 predmeta |
| Učitelj: nalaganje in brisanje gradiv samo za svoje predmete | izpolnjeno; preverja backend |
| Učitelj: pregled nalog, ki so jih učenci oddali pri izbranem predmetu | izpolnjeno |
| Učenec: registracija, urejanje profila | izpolnjeno |
| Učenec: določanje in popravljanje seznama predmetov | izpolnjeno (samostojni izbor zahteva vsaj 1 predmet) |
| Učenec: pogled v gradiva vsakega predmeta | izpolnjeno |
| Učenec: oddaja nalog, datoteka na strežniku »Priimek Ime – Naslov naloge« z ustrezno končnico | izpolnjeno (en-pomišljaj, na disku in v bazi) |
| Ponovna oddaja povozi prejšnjo datoteko šele po potrditvi učenca | izpolnjeno: vmesnik vpraša, strežnik brez `?confirm=1` vrne 409 |
| Vsaj 5 podstrani, 2 vrsti uporabnikov, avtorizacija | izpolnjeno (11 poti, 3 vloge) |
| Podatke je dovoljeno vnesti tudi neposredno v bazo | podprto: Adminer (`--profile tools`) ali `psql` |
| Odzivna in preprosta uporaba (vnos, urejanje, brisanje) | izpolnjeno; **ročno testiranje na telefonu še ni izvedeno** (TP-22) |

## Vloge in časovni načrt (3. in 5. poglavje)

| Naloga | Stanje |
|---|---|
| Repozitorij, struktura map, pravila za veje in PR | struktura in predloge so pripravljene; **dodajanje mentorja kot sodelavca in uporaba vej je naloga ekipe** |
| `docker-compose.yml` in `.env` | `docker-compose.yml`, `.env.example` |
| Struktura baze (≥4 tabele, ER diagram) | 9 tabel, [er-diagram.md](er-diagram.md) |
| Skripta za testne podatke (10 predmetov, 20 učiteljev, 100 učencev) | `PB/insert.sql` |
| Javna domena, obrnjeni posrednik, HTTPS | HTTPS je pripravljen, **domena je naloga vzdrževalca IS** |
| Redne varnostne kopije baze | `scripts/backup.sh`, `scripts/restore.sh`, cron v [namestitev.md](namestitev.md) |
| Dokumentacija namestitve, konfiguracije in arhitekture | [namestitev.md](namestitev.md), [arhitektura.md](arhitektura.md) |
| Specifikacija sistema | **mora napisati ekipa** (razvijalca); [skladnost-z-navodili.md](skladnost-z-navodili.md) je lahko izhodišče |
| Skice / žični modeli (wireframe) za vse tri poglede | **mora narisati ekipa**; delujoč vmesnik je v `edulink-vite/` |
| Uporabniška navodila za vsako vlogo | [administrator](navodila-administrator.md), [učitelj](navodila-ucitelj.md), [učenec](navodila-ucenec.md) |
| Testni primeri in beleženje napak | [testni-primeri.md](testni-primeri.md); napake v GitHub Issues |
| Dnevna in tedenska poročila (mapa `porocila/` ali GitHub Wiki) | **piše ekipa sproti**, ne nastanejo iz kode |
| Zgodovina sprememb vseh treh članov, oznaka končne različice | **odvisno od dela ekipe** (`git tag`) |
| Odstranitev testnih in nepotrebnih delov pred oddajo | `frontend/` in `frontend-demo/` sta še v repozitoriju; **odločitev je ekipe** |
