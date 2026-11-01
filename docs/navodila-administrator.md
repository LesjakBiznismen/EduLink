# Navodila za administratorja

Administrator upravlja predmete, učitelje in učence. Vse spremembe so mogoče prek vmesnika, neposreden vnos v bazo ni potreben.

## Prijava

Odprite aplikacijo (npr. `https://localhost:8443`; ob opozorilu o samopodpisanem certifikatu nadaljujte), vnesite uporabniško
ime `admin` in geslo ter pritisnite **Vstopi**. Po prijavi so v levem meniju **Predmeti**, **Učitelji**, **Učenci** in **Profil**.
Pregled števila predmetov, učiteljev, učencev, nalog, oddaj in gradiv je na strani **Profil**.

## Predmeti

1. Odprite **Predmeti**. Seznam prikazuje predmete, njihove učitelje in število vpisanih učencev.
2. **Dodaj predmet**: vnesite ime, izberite sliko in označite **enega ali več učiteljev** predmeta, nato **Shrani**.
   Predmet mora imeti vsaj enega učitelja, zato najprej dodajte učitelje.
3. **Uredi**: spremenite ime, sliko ali učitelje predmeta in shranite.
4. **Izbriši**: potrdite brisanje. Izbrišejo se tudi gradiva, naloge, oddaje in vpisi tega predmeta.

## Učitelji

1. Odprite **Učitelji**. Seznam se strani po 20 vnosov; polje **Poišči učitelja** išče po imenu, e-naslovu in uporabniškem imenu.
2. **Dodaj učitelja**: ime, priimek, e-naslov, začetno geslo (vsaj 8 znakov) in **predmeti, ki jih poučuje** (vsaj eden).
   Uporabniško ime se ustvari samo (`ime.priimek`), če ga ne vnesete.
3. **Uredi**: spremenite podatke, predmete ali nastavite novo geslo.
4. **Izbriši**: potrditev; učitelj izgubi dostop, njegove naloge in gradiva ostanejo.

Predmet ima lahko več učiteljev, učitelj pa poučuje več predmetov.

## Učenci

Enako kot pri učiteljih (**Dodaj učenca**, **Uredi**, **Izbriši**, iskanje, strani). Pri učencu označite **predmete, ki jih obiskuje**;
vsak učenec mora obiskovati **vsaj dva** predmeta. Ob izbrisu učenca se izbrišejo tudi njegove oddaje.

## Namigi

- Učenci se lahko registrirajo sami (**Ustvari profil** na prijavni strani); administrator jim predmete dodeli v **Učenci → Uredi**.
- Gesla niso vidna nikomur; pozabljeno geslo uporabnika nastavite z **Uredi**.
- Napake (npr. dvojnik e-naslova) se izpišejo v rdečem v obrazcu.
