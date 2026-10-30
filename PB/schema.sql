-- EduLink – shema podatkovne baze za SQLite.
-- Zgrajena na podlagi podatkov, ki jih uporablja frontend-demo (store.js, data.js,
-- app.js, staff.js), in na podlagi MySQL sheme edulink_initialize.SQL.
-- Zagon: sqlite3 edulink.db < schema.sql, nato sqlite3 edulink.db < insert.sql

PRAGMA foreign_keys = ON;

DROP VIEW IF EXISTS koledar;
DROP VIEW IF EXISTS pregled_oddaj;
DROP TABLE IF EXISTS dogodki;
DROP TABLE IF EXISTS oddaje;
DROP TABLE IF EXISTS naloge;
DROP TABLE IF EXISTS gradiva;
DROP TABLE IF EXISTS vpisi;
DROP TABLE IF EXISTS ucitelji_predmeti;
DROP TABLE IF EXISTS predmeti;
DROP TABLE IF EXISTS uporabniki;
DROP TABLE IF EXISTS sole;

-- Šole (polje "Šola" na profilu učenca).
CREATE TABLE sole (
    id_sola      INTEGER PRIMARY KEY,
    naziv        TEXT    NOT NULL UNIQUE CHECK (length(trim(naziv)) > 0),
    kraj         TEXT
);

-- Uporabniki: učenci, učitelji in administratorji (vloge iz prijavnega obrazca).
CREATE TABLE uporabniki (
    id_uporabnik     INTEGER PRIMARY KEY,
    e_posta          TEXT    NOT NULL UNIQUE COLLATE NOCASE CHECK (e_posta LIKE '_%@_%._%'),
    uporabnisko_ime  TEXT    NOT NULL UNIQUE COLLATE NOCASE CHECK (length(uporabnisko_ime) BETWEEN 3 AND 50),
    geslo_hash       TEXT    NOT NULL,
    ime              TEXT    NOT NULL CHECK (length(trim(ime)) > 0),
    priimek          TEXT    NOT NULL CHECK (length(trim(priimek)) > 0),
    vloga            TEXT    NOT NULL CHECK (vloga IN ('ucenec', 'ucitelj', 'admin')),
    id_sola          INTEGER REFERENCES sole(id_sola) ON DELETE SET NULL,
    telefon          TEXT,   -- telefon, naziv in kabinet izpolni učitelj na profilu
    naziv            TEXT,
    kabinet          TEXT,
    aktiven         INTEGER NOT NULL DEFAULT 1 CHECK (aktiven IN (0, 1)),
    ustvarjeno_ob    TEXT    NOT NULL DEFAULT (datetime('now')),
    posodobljeno_ob  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_uporabniki_vloga ON uporabniki(vloga);
CREATE INDEX idx_uporabniki_priimek_ime ON uporabniki(priimek, ime);
CREATE INDEX idx_uporabniki_sola ON uporabniki(id_sola);

-- Predmeti (id v demu, npr. 'matematika', je tu "koda").
CREATE TABLE predmeti (
    id_predmet     INTEGER PRIMARY KEY,
    koda           TEXT    NOT NULL UNIQUE CHECK (koda GLOB '[a-z]*' AND koda NOT GLOB '*[^a-z0-9-]*'),
    naziv          TEXT    NOT NULL UNIQUE CHECK (length(trim(naziv)) > 0),
    kratica        TEXT    NOT NULL CHECK (length(kratica) BETWEEN 1 AND 5),
    barva          TEXT    NOT NULL DEFAULT '#5c8fba' CHECK (barva GLOB '#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]'),
    slika          TEXT    NOT NULL DEFAULT 'privzeto.svg',
    opis           TEXT,
    ustvaril       INTEGER REFERENCES uporabniki(id_uporabnik) ON DELETE SET NULL,
    ustvarjeno_ob  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Kdo poučuje kateri predmet (predmet ima lahko več učiteljev in obratno).
CREATE TABLE ucitelji_predmeti (
    id_ucitelj  INTEGER NOT NULL REFERENCES uporabniki(id_uporabnik) ON DELETE CASCADE,
    id_predmet  INTEGER NOT NULL REFERENCES predmeti(id_predmet) ON DELETE CASCADE,
    dodeljeno_ob TEXT   NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (id_ucitelj, id_predmet)
) WITHOUT ROWID;
CREATE INDEX idx_ucitelji_predmeti_predmet ON ucitelji_predmeti(id_predmet);

-- Kateri učenec obiskuje kateri predmet.
CREATE TABLE vpisi (
    id_ucenec   INTEGER NOT NULL REFERENCES uporabniki(id_uporabnik) ON DELETE CASCADE,
    id_predmet  INTEGER NOT NULL REFERENCES predmeti(id_predmet) ON DELETE CASCADE,
    vpisano_ob  TEXT    NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (id_ucenec, id_predmet)
) WITHOUT ROWID;
CREATE INDEX idx_vpisi_predmet ON vpisi(id_predmet);

-- Gradiva predmeta: besedilni zapiski/vaje ali naložena datoteka (PDF, Word, PowerPoint, slika do 20 MB).
CREATE TABLE gradiva (
    id_gradivo        INTEGER PRIMARY KEY,
    id_predmet        INTEGER NOT NULL REFERENCES predmeti(id_predmet) ON DELETE CASCADE,
    nalozil           INTEGER REFERENCES uporabniki(id_uporabnik) ON DELETE SET NULL,
    naslov            TEXT    NOT NULL CHECK (length(trim(naslov)) BETWEEN 1 AND 120),
    vrsta             TEXT    NOT NULL CHECK (vrsta IN ('Zapiski', 'Vaje')),
    vsebina           TEXT,
    datoteka_ime      TEXT,
    datoteka_url      TEXT,
    tip_datoteke      TEXT    CHECK (tip_datoteke IN ('PDF', 'Word', 'PowerPoint', 'Slika')),
    velikost_bajtov   INTEGER CHECK (velikost_bajtov BETWEEN 1 AND 20971520),
    dodano_ob         TEXT    NOT NULL DEFAULT (datetime('now')),
    izbrisano_ob      TEXT,
    -- Gradivo ima vsebino ali datoteko; datoteka ima vedno ime, pot in tip.
    CHECK (vsebina IS NOT NULL OR datoteka_url IS NOT NULL),
    CHECK ((datoteka_url IS NULL) = (datoteka_ime IS NULL) AND (datoteka_url IS NULL) = (tip_datoteke IS NULL))
);
CREATE INDEX idx_gradiva_predmet ON gradiva(id_predmet, dodano_ob) WHERE izbrisano_ob IS NULL;
CREATE INDEX idx_gradiva_nalozil ON gradiva(nalozil);

-- Naloge, ki jih učitelj doda predmetu.
CREATE TABLE naloge (
    id_naloga      INTEGER PRIMARY KEY,
    id_predmet     INTEGER NOT NULL REFERENCES predmeti(id_predmet) ON DELETE CASCADE,
    ustvaril       INTEGER REFERENCES uporabniki(id_uporabnik) ON DELETE SET NULL,
    naslov         TEXT    NOT NULL CHECK (length(trim(naslov)) BETWEEN 1 AND 120),
    navodila       TEXT    NOT NULL DEFAULT 'Navodila za nalogo bo dodal učitelj.' CHECK (length(navodila) <= 1000),
    rok_oddaje     TEXT    NOT NULL CHECK (rok_oddaje IS date(rok_oddaje)),
    ustvarjeno_ob  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_naloge_predmet_rok ON naloge(id_predmet, rok_oddaje);
CREATE INDEX idx_naloge_rok ON naloge(rok_oddaje);

-- Oddaje učencev (ena oddaja na nalogo; ponovna oddaja jo zamenja) in ocenjevanje.
CREATE TABLE oddaje (
    id_oddaja             INTEGER PRIMARY KEY,
    id_naloga             INTEGER NOT NULL REFERENCES naloge(id_naloga) ON DELETE CASCADE,
    id_ucenec             INTEGER NOT NULL REFERENCES uporabniki(id_uporabnik) ON DELETE CASCADE,
    datoteka_ime          TEXT    NOT NULL,
    izvirno_ime_datoteke  TEXT,
    datoteka_url          TEXT    NOT NULL,
    velikost_bajtov       INTEGER CHECK (velikost_bajtov BETWEEN 1 AND 20971520),
    oddano_ob             TEXT    NOT NULL DEFAULT (datetime('now')),
    ocena                 INTEGER CHECK (ocena BETWEEN 1 AND 5),
    povratna_informacija  TEXT,
    ocenil                INTEGER REFERENCES uporabniki(id_uporabnik) ON DELETE SET NULL,
    ocenjeno_ob           TEXT,
    UNIQUE (id_naloga, id_ucenec),
    CHECK ((ocena IS NULL) = (ocenjeno_ob IS NULL))
);
CREATE INDEX idx_oddaje_ucenec ON oddaje(id_ucenec);

-- Dodatni dogodki v koledarju (testi, ustna spraševanja, šolski dogodki).
CREATE TABLE dogodki (
    id_dogodek     INTEGER PRIMARY KEY,
    id_predmet     INTEGER REFERENCES predmeti(id_predmet) ON DELETE CASCADE,  -- NULL = dogodek za vso šolo
    ustvaril       INTEGER REFERENCES uporabniki(id_uporabnik) ON DELETE SET NULL,
    naslov         TEXT    NOT NULL CHECK (length(trim(naslov)) > 0),
    opis           TEXT,
    vrsta          TEXT    NOT NULL DEFAULT 'dogodek' CHECK (vrsta IN ('test', 'ustno', 'dogodek', 'pocitnice')),
    zacetek        TEXT    NOT NULL CHECK (zacetek IS datetime(zacetek)),
    konec          TEXT    CHECK (konec IS NULL OR konec IS datetime(konec)),
    ves_dan        INTEGER NOT NULL DEFAULT 0 CHECK (ves_dan IN (0, 1)),
    ustvarjeno_ob  TEXT    NOT NULL DEFAULT (datetime('now')),
    CHECK (konec IS NULL OR konec >= zacetek)
);
CREATE INDEX idx_dogodki_zacetek ON dogodki(zacetek);
CREATE INDEX idx_dogodki_predmet ON dogodki(id_predmet, zacetek);

-- ---------- Pravila, ki jih CHECK ne more izraziti ----------

CREATE TRIGGER trg_uporabniki_posodobljeno AFTER UPDATE ON uporabniki
WHEN NEW.posodobljeno_ob = OLD.posodobljeno_ob
BEGIN
    UPDATE uporabniki SET posodobljeno_ob = datetime('now') WHERE id_uporabnik = NEW.id_uporabnik;
END;

CREATE TRIGGER trg_ucitelji_predmeti_vloga BEFORE INSERT ON ucitelji_predmeti
WHEN (SELECT vloga FROM uporabniki WHERE id_uporabnik = NEW.id_ucitelj) <> 'ucitelj'
BEGIN
    SELECT RAISE(ABORT, 'Predmet lahko poučuje samo uporabnik z vlogo ucitelj.');
END;

CREATE TRIGGER trg_vpisi_vloga BEFORE INSERT ON vpisi
WHEN (SELECT vloga FROM uporabniki WHERE id_uporabnik = NEW.id_ucenec) <> 'ucenec'
BEGIN
    SELECT RAISE(ABORT, 'V predmet se lahko vpiše samo uporabnik z vlogo ucenec.');
END;

CREATE TRIGGER trg_oddaje_vpis BEFORE INSERT ON oddaje
WHEN NOT EXISTS (
    SELECT 1 FROM vpisi v JOIN naloge n ON n.id_predmet = v.id_predmet
    WHERE n.id_naloga = NEW.id_naloga AND v.id_ucenec = NEW.id_ucenec)
BEGIN
    SELECT RAISE(ABORT, 'Učenec ni vpisan v predmet te naloge.');
END;

-- ---------- Pogledi ----------

-- Koledar: roki nalog (kot v demu) in dodatni dogodki.
CREATE VIEW koledar AS
SELECT 'naloga' AS vir, n.id_naloga AS id, n.id_predmet, p.naziv AS predmet,
       n.naslov, 'rok' AS vrsta, n.rok_oddaje AS datum, NULL AS cas
FROM naloge n JOIN predmeti p ON p.id_predmet = n.id_predmet
UNION ALL
SELECT 'dogodek', d.id_dogodek, d.id_predmet, p.naziv,
       d.naslov, d.vrsta, date(d.zacetek), CASE WHEN d.ves_dan THEN NULL ELSE time(d.zacetek) END
FROM dogodki d LEFT JOIN predmeti p ON p.id_predmet = d.id_predmet;

-- Stanje vsake naloge za vsakega vpisanega učenca (Oddano / Za oddajo / Rok je potekel).
CREATE VIEW pregled_oddaj AS
SELECT n.id_naloga, v.id_ucenec, o.id_oddaja, o.oddano_ob, o.ocena,
       CASE WHEN o.id_oddaja IS NOT NULL THEN 'Oddano'
            WHEN n.rok_oddaje < date('now', 'localtime') THEN 'Rok je potekel'
            ELSE 'Za oddajo' END AS stanje
FROM naloge n
JOIN vpisi v ON v.id_predmet = n.id_predmet
LEFT JOIN oddaje o ON o.id_naloga = n.id_naloga AND o.id_ucenec = v.id_ucenec;
