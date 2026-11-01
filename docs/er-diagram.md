# ER diagram podatkovne baze

Shema je v [PB/schema.sql](../PB/schema.sql) (PostgreSQL). Diagram se izriše na GitHubu in v večini urejevalnikov Markdown.

```mermaid
erDiagram
    sole ||--o{ uporabniki : "obiskuje / dela"
    uporabniki ||--o{ predmeti : "ustvaril (admin)"
    uporabniki ||--o{ ucitelji_predmeti : "poučuje"
    predmeti   ||--o{ ucitelji_predmeti : "ima učitelje"
    uporabniki ||--o{ vpisi : "obiskuje"
    predmeti   ||--o{ vpisi : "ima učence"
    predmeti   ||--o{ gradiva : "vsebuje"
    uporabniki ||--o{ gradiva : "naložil"
    predmeti   ||--o{ naloge : "vsebuje"
    uporabniki ||--o{ naloge : "ustvaril"
    naloge     ||--o{ oddaje : "ima oddaje"
    uporabniki ||--o{ oddaje : "odda (učenec)"
    uporabniki ||--o{ oddaje : "oceni (učitelj)"
    predmeti   ||--o{ dogodki : "ima dogodke"
    uporabniki ||--o{ dogodki : "ustvaril"

    sole {
        int id_sola PK
        text naziv UK
        text kraj
    }
    uporabniki {
        int id_uporabnik PK
        citext e_posta UK
        citext uporabnisko_ime UK
        text geslo_hash "PBKDF2-SHA256"
        text ime
        text priimek
        text vloga "ucenec | ucitelj | admin"
        int id_sola FK
        text telefon
        text naziv
        text kabinet
        smallint aktiven
        timestamp ustvarjeno_ob
    }
    predmeti {
        int id_predmet PK
        text koda UK
        text naziv UK
        text kratica
        text barva
        text slika
        int ustvaril FK
    }
    ucitelji_predmeti {
        int id_ucitelj PK,FK
        int id_predmet PK,FK
        timestamp dodeljeno_ob
    }
    vpisi {
        int id_ucenec PK,FK
        int id_predmet PK,FK
        timestamp vpisano_ob
    }
    gradiva {
        int id_gradivo PK
        int id_predmet FK
        int nalozil FK
        text naslov
        text vrsta "Zapiski | Vaje"
        text vsebina
        text datoteka_ime
        text datoteka_url
        text tip_datoteke
        int velikost_bajtov
        timestamp dodano_ob
        timestamp izbrisano_ob "mehki izbris"
    }
    naloge {
        int id_naloga PK
        int id_predmet FK
        int ustvaril FK
        text naslov
        text navodila
        date rok_oddaje
    }
    oddaje {
        int id_oddaja PK
        int id_naloga FK,UK
        int id_ucenec FK,UK
        text datoteka_ime "Priimek Ime – Naslov naloge.končnica"
        text izvirno_ime_datoteke
        text datoteka_url
        int velikost_bajtov
        timestamp oddano_ob
        smallint ocena "1-5"
        text povratna_informacija
        int ocenil FK
        timestamp ocenjeno_ob
    }
    dogodki {
        int id_dogodek PK
        int id_predmet FK "NULL = vsa šola"
        int ustvaril FK
        text naslov
        text vrsta
        timestamp zacetek
        timestamp konec
        smallint ves_dan
    }
```

## Pojasnila

- **Vloge** (`uporabniki.vloga`): `ucenec`, `ucitelj`, `admin`. Vloge so v eni tabeli, ker imajo skupne atribute
  (prijava, ime, e-naslov); razlike obravnavajo omejitve in sprožilci.
- **Razmerja M:N** so razrešena z vmesnima tabelama `ucitelji_predmeti` (predmet ima lahko več učiteljev, učitelj poučuje
  več predmetov) in `vpisi` (učenec obiskuje več predmetov). Sestavljeni primarni ključ prepreči dvojne vnose.
- **Sprožilci** zagotavljajo pravila, ki jih `CHECK` ne more izraziti: v `ucitelji_predmeti` je lahko samo učitelj,
  v `vpisi` samo učenec, oddajo pa lahko ustvari samo učenec, vpisan v predmet naloge.
- **Ena oddaja na učenca in nalogo** (`UNIQUE (id_naloga, id_ucenec)`); ponovna oddaja zamenja obstoječo (po potrditvi učenca).
- **Brisanje**: ob izbrisu predmeta se kaskadno izbrišejo gradiva, naloge, oddaje, vpisi in dodelitve; pri avtorjih
  (`ustvaril`, `nalozil`, `ocenil`) se ob izbrisu uporabnika vrednost postavi na `NULL` (`ON DELETE SET NULL`).
  Gradiva se brišejo mehko (`izbrisano_ob`).
- Shema je v tretji normalni obliki: vsi neključni atributi so odvisni samo od primarnega ključa svoje tabele
  (šola in predmet imata lastni tabeli, ne ponavljata se v zapisih uporabnikov in nalog).
- **Pogleda**: `koledar` (roki nalog in dogodki) ter `pregled_oddaj` (stanje naloge za vsakega vpisanega učenca).
