
CREATE DATABASE IF NOT EXISTS edulink
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE edulink;
CREATE TABLE uporabniki (
    id_uporabnik INT AUTO_INCREMENT PRIMARY KEY,
    e_posta VARCHAR(100) NOT NULL UNIQUE,
    geslo_hash VARCHAR(255) NOT NULL,
    ime VARCHAR(50) NOT NULL,
    priimek VARCHAR(50) NOT NULL,
    vloga ENUM('student', 'ucitelj', 'admin') NOT NULL,
    ustvarjeno_ob DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    posodobljeno_ob DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE predmeti (
    id_predmet INT AUTO_INCREMENT PRIMARY KEY,
    naziv VARCHAR(100) NOT NULL,
    opis TEXT,
    ustvaril INT,
    FOREIGN KEY (ustvaril) REFERENCES uporabniki(id_uporabnik) ON DELETE SET NULL,
    ustvarjeno_ob DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ucitelji_predmeti (
    id_ucitelj_predmet INT AUTO_INCREMENT PRIMARY KEY,
    id_ucitelj INT NOT NULL,
    FOREIGN KEY (id_ucitelj) REFERENCES uporabniki(id_uporabnik) ON DELETE CASCADE,
    id_predmet INT NOT NULL,
    FOREIGN KEY (id_predmet) REFERENCES predmeti(id_predmet) ON DELETE CASCADE,
    UNIQUE (id_ucitelj, id_predmet)
);

CREATE TABLE vpisi (
    id_vpis INT AUTO_INCREMENT PRIMARY KEY,
    id_uporabnik INT NOT NULL,
    FOREIGN KEY (id_uporabnik) REFERENCES uporabniki(id_uporabnik) ON DELETE CASCADE,
    id_predmet INT NOT NULL,
    FOREIGN KEY (id_predmet) REFERENCES predmeti(id_predmet) ON DELETE CASCADE,
    vpisano_ob DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_uporabnik, id_predmet)
);

CREATE TABLE gradiva (
    id_gradivo INT AUTO_INCREMENT PRIMARY KEY,
    id_predmet INT NOT NULL,
    FOREIGN KEY (id_predmet) REFERENCES predmeti(id_predmet) ON DELETE CASCADE,
    nalozil INT,
    FOREIGN KEY (nalozil) REFERENCES uporabniki(id_uporabnik) ON DELETE SET NULL,
    naslov VARCHAR(100) NOT NULL,
    datoteka_url VARCHAR(255) NOT NULL,
    tip_datoteke VARCHAR(50),
    ustvarjeno_ob DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE naloge (
    id_naloga INT AUTO_INCREMENT PRIMARY KEY,
    id_predmet INT NOT NULL,
    FOREIGN KEY (id_predmet) REFERENCES predmeti(id_predmet) ON DELETE CASCADE,
    ustvaril INT,
    FOREIGN KEY (ustvaril) REFERENCES uporabniki(id_uporabnik) ON DELETE SET NULL,
    naslov VARCHAR(100) NOT NULL,
    opis TEXT,
    rok_oddaje DATE,
    ustvarjeno_ob DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE oddaje (
    id_oddaja INT AUTO_INCREMENT PRIMARY KEY,
    id_naloga INT NOT NULL,
    FOREIGN KEY (id_naloga) REFERENCES naloge(id_naloga) ON DELETE CASCADE,
    id_uporabnik INT NOT NULL,
    FOREIGN KEY (id_uporabnik) REFERENCES uporabniki(id_uporabnik) ON DELETE CASCADE,
    datoteka_url VARCHAR(255) NOT NULL,
    izvirno_ime_datoteke VARCHAR(255),
    oddano_ob DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ocena INT,
    povratna_informacija TEXT,
    UNIQUE (id_naloga, id_uporabnik)
);
