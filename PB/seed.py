"""Ustvari SQLite bazo EduLink iz schema.sql in jo napolni s testnimi podatki.

Podatki sledijo demu (frontend-demo/store.js in data.js): 10 predmetov,
20 učiteljev, 100 učencev, po dve gradivi in dve nalogi na predmet.

Zagon:  python seed.py [pot/do/edulink.db]
"""
import hashlib
import os
import random
import sqlite3
import sys
import unicodedata
from datetime import date, datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
DB_PATH = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "edulink.db"
TEST_PASSWORD = "edulink123"  # testno geslo za vse uporabnike

FIRST_NAMES = ['Ana', 'Luka', 'Nina', 'Jan', 'Eva', 'Matej', 'Tina', 'Žan', 'Maja', 'Nejc', 'Sara', 'Urban', 'Lara', 'Tim', 'Katja',
               'Gal', 'Zala', 'Rok', 'Pia', 'Miha', 'Neža', 'Anže', 'Ema', 'Domen', 'Lea', 'Jaka', 'Mia', 'Blaž', 'Klara', 'Aljaž']
LAST_NAMES = ['Novak', 'Horvat', 'Kovačič', 'Krajnc', 'Zupančič', 'Potočnik', 'Kos', 'Vidmar', 'Golob', 'Kralj', 'Božič', 'Korošec', 'Turk',
              'Mlakar', 'Kovač', 'Petek', 'Žagar', 'Hribar', 'Oblak', 'Kavčič', 'Zajc', 'Medved', 'Rozman', 'Babič', 'Pirc']

# koda, naziv, slika, kratica, barva, tema, naloga, navodila, besedilo gradiva (iz data.js)
SUBJECTS = [
    ('matematika', 'Matematika', 'matematika.png', 'MAT', '#bd8546', 'Kvadratna funkcija', 'Graf kvadratne funkcije',
     'Narišite grafe funkcij f(x) = x², g(x) = x² − 4 in h(x) = (x − 2)². Označite teme in ničle ter priložite postopek.',
     'Kvadratna funkcija ima obliko f(x) = ax² + bx + c. Njen graf je parabola. Če je a pozitiven, je parabola obrnjena navzgor. Teme izračunamo z x = −b / (2a).'),
    ('slovenscina', 'Slovenščina', 'slovenscina.png', 'SLO', '#b3657c', 'Slovenska moderna', 'Interpretacija pesmi',
     'Izberite pesem iz obravnavanega sklopa. V 300 besedah opišite temo, motive in pesniška sredstva. Svoje ugotovitve podprite s primeri.',
     'Slovensko moderno povezujemo z Ivanom Cankarjem, Otonom Župančičem, Dragotinom Kettejem in Josipom Murnom. Pri interpretaciji ločimo temo, motive, zgradbo in pesniška sredstva.'),
    ('anglescina', 'Angleščina', 'anglescina.png', 'ANG', '#518da6', 'Writing an opinion essay', 'An opinion essay',
     'Write a 200-word essay about learning online. Include an introduction, two arguments and a conclusion.',
     'An opinion essay presents a clear viewpoint. Start with your position, support it with examples and acknowledge another perspective. Use linking words such as however, therefore and in addition.'),
    ('programiranje', 'Programiranje aplikacij', 'programiranje.png', 'PRO', '#8571b2', 'Zanke in polja', 'Obdelava seznama števil',
     'Napišite program, ki izračuna najmanjšo, največjo in povprečno vrednost v polju. Oddajte izvorno kodo z opisom preizkusov.',
     'Polje hrani zaporedje vrednosti. Zanka omogoča obdelavo vsakega elementa. Pred računanjem povprečja preverite, ali polje vsebuje vsaj en element.'),
    ('rps', 'Računalniški produkti in storitve (RPS)', 'rps.png', 'RPS', '#48999b', 'Načrtovanje storitve', 'Predlog računalniške storitve',
     'Opišite uporabnike, namen in potek izbrane računalniške storitve. Dodajte primer uporabe.',
     'Pri načrtovanju storitve določimo uporabnike, njihove potrebe in pričakovani rezultat. Zahteve naj bodo konkretne in preverljive.'),
    ('splet', 'Spletne aplikacije', 'splet.png', 'SPA', '#5c8fba', 'Semantični HTML', 'Dostopna spletna stran',
     'Izdelajte stran z navigacijo, glavno vsebino in obrazcem. Uporabite semantične elemente in oznake za vsa vnosna polja.',
     'Elementi header, nav, main in footer opisujejo strukturo strani. Povezave uporabljamo za navigacijo, gumbe za dejanja. Vsako vnosno polje potrebuje oznako label.'),
    ('smv', 'Stroka - moderne vsebine (SMV)', 'smv.png', 'SMV', '#947bbb', 'Razširjena resničnost', 'Primer uporabe novih tehnologij',
     'Predstavite konkreten primer uporabe razširjene resničnosti. Ocenite prednosti in omejitve.',
     'Navidezna resničnost ustvari digitalno okolje. Razširjena resničnost dodaja digitalne elemente v pogled na fizični svet. Pri zasnovi upoštevamo namen, dostopnost in zasebnost.'),
    ('sociologija', 'Sociologija', 'sociologija.png', 'SOC', '#78966b', 'Družbene skupine', 'Opazovanje družbene skupine',
     'Opišite družbeno skupino, njene norme in vloge. Uporabite anonimiziran primer brez osebnih podatkov.',
     'Družbeno skupino povezujejo odnosi, skupni cilji in pravila. Primarne skupine temeljijo na tesnih odnosih, sekundarne pa na bolj formalnih stikih.'),
    ('baze', 'Podatkovne baze', 'baze.png', 'PB', '#459c8c', 'Relacijski podatkovni model', 'Model šolske knjižnice',
     'Načrtujte tabele za knjige, člane in izposoje. Določite primarne in tuje ključe ter odnose.',
     'Relacijska baza hrani podatke v tabelah. Primarni ključ enolično določa zapis, tuji ključ pa povezuje zapise različnih tabel. Normalizacija zmanjša podvajanje podatkov.'),
    # Predmet, ki ga v demu doda administrator: dobi privzete vsebine iz data.js.
    ('zgodovina', 'Zgodovina', 'privzeto.svg', 'ZGO', '#5c8fba', 'Uvod', 'Prva naloga',
     'Navodila za nalogo bo dodal učitelj.', 'Gradivo bo dodal učitelj.'),
]

REVIEW_TASK = 'Pripravite kratek povzetek poglavja in tri vprašanja za ponavljanje. Pri vsakem vprašanju napišite tudi odgovor.'
FEEDBACK = {5: 'Odlično, natančno in pregledno.', 4: 'Zelo dobro, manjše pomanjkljivosti pri utemeljitvi.',
            3: 'Dobro, dopolnite postopek in primere.', 2: 'Zadostno, manjka več ključnih delov.', 1: 'Nezadostno, nalogo ponovno oddajte.'}


def slug(text):
    """Enako kot slug() v store.js: brez šumnikov, samo male črke."""
    plain = unicodedata.normalize('NFD', text)
    return ''.join(c for c in plain.lower() if 'a' <= c <= 'z')


def person(i, a, b):
    first = FIRST_NAMES[(i * a + 3) % len(FIRST_NAMES)]
    last = LAST_NAMES[(i * b + i // 5) % len(LAST_NAMES)]
    return first, last


def password_hash(password, salt):
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100_000)
    return f"pbkdf2_sha256$100000${salt.hex()}${digest.hex()}"


def ts(d):
    return d.strftime('%Y-%m-%d %H:%M:%S')


def main():
    rng = random.Random(2026)
    today = date.today()
    now = datetime.now().replace(microsecond=0)
    if DB_PATH.exists():
        DB_PATH.unlink()
    con = sqlite3.connect(DB_PATH)
    con.execute('PRAGMA foreign_keys = ON')
    con.executescript((HERE / 'schema.sql').read_text(encoding='utf-8'))
    # Isto geslo za vse testne uporabnike; hash izračunamo enkrat (pbkdf2 je namenoma počasen).
    pw = password_hash(TEST_PASSWORD, os.urandom(16))
    start_of_year = ts(datetime(today.year if today.month >= 9 else today.year - 1, 9, 1, 8))

    with con:
        school = con.execute("INSERT INTO sole (naziv, kraj) VALUES ('Srednja šola za računalništvo', 'Ljubljana')").lastrowid

        def user(username, email, first, last, role):
            return con.execute(
                'INSERT INTO uporabniki (e_posta, uporabnisko_ime, geslo_hash, ime, priimek, vloga, id_sola, ustvarjeno_ob, posodobljeno_ob) '
                'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', (email, username, pw, first, last, role, school, start_of_year, start_of_year)).lastrowid

        admin = user('admin', 'admin@sola.si', 'Admin', 'Administrator', 'admin')

        subjects = {}
        for code, name, image, short, color, topic, *_ in SUBJECTS:
            subjects[code] = con.execute(
                'INSERT INTO predmeti (koda, naziv, kratica, barva, slika, opis, ustvaril, ustvarjeno_ob) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                (code, name, short, color, image, f'Tekoči sklop: {topic}.', admin, start_of_year)).lastrowid
        codes = [s[0] for s in SUBJECTS]
        n = len(codes)

        # 20 učiteljev: nekateri predmeti imajo dva učitelja, nekateri učitelji poučujejo dva predmeta (kot store.js).
        teachers_of = {code: [] for code in codes}
        for i in range(20):
            first, last = person(i, 7, 3)
            uid = user(f'{slug(first)}.{slug(last)}.u{i + 1}', f'{slug(first)}.{slug(last)}{i + 1}@sola.si', first, last, 'ucitelj')
            taught = [codes[i]] if i < 10 else [codes[i - 10]] if i < 15 else [codes[i - 10], codes[i - 15]]
            for code in dict.fromkeys(taught):
                con.execute('INSERT INTO ucitelji_predmeti (id_ucitelj, id_predmet, dodeljeno_ob) VALUES (?, ?, ?)', (uid, subjects[code], start_of_year))
                teachers_of[code].append(uid)

        # 100 učencev: vsak obiskuje od 2 do 4 predmete.
        students_of = {code: [] for code in codes}
        for i in range(100):
            first, last = person(i, 11, 7)
            uid = user(f'{slug(first)}.{slug(last)}{i + 1}', f'{slug(first)}.{slug(last)}{i + 1}@dijak.sola.si', first, last, 'ucenec')
            start = (i * 3) % n
            for k in range(2 + i % 3):
                code = codes[(start + k) % n]
                con.execute('INSERT INTO vpisi (id_ucenec, id_predmet, vpisano_ob) VALUES (?, ?, ?)', (uid, subjects[code], start_of_year))
                students_of[code].append(uid)

        # Gradiva: zapiski in vaje (data.js) ter ena naložena datoteka na predmet.
        for code, name, _, short, _, topic, _, description, text in SUBJECTS:
            sid, teacher = subjects[code], teachers_of[code][0]
            practice = (f'{description}\n\nZa ponavljanje\n1. S svojimi besedami razložite ključne pojme.\n'
                        '2. Dodajte svoj primer.\n3. Zapišite vprašanje, o katerem bi se želeli pogovoriti pri pouku.')
            rows = [(topic, 'Zapiski', text, None, None, None, today - timedelta(days=2)),
                    (f'Vaje · {topic}', 'Vaje', practice, None, None, None, today - timedelta(days=4))]
            file_name = f'{slug(name)[:12]}-{slug(topic)[:16]}.pdf'
            size = rng.randint(80, 4000) * 1024
            rows.append((f'Prosojnice · {topic}', 'Zapiski', f'Priložena datoteka: {file_name} (PDF, {size // 1024} kB).',
                         file_name, 'PDF', size, today - timedelta(days=9)))
            for title, kind, content, fname, ftype, fsize, added in rows:
                con.execute(
                    'INSERT INTO gradiva (id_predmet, nalozil, naslov, vrsta, vsebina, datoteka_ime, datoteka_url, tip_datoteke, velikost_bajtov, dodano_ob) '
                    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    (sid, teacher, title, kind, content, fname, f'/uploads/gradiva/{code}/{fname}' if fname else None, ftype, fsize,
                     ts(datetime.combine(added, datetime.min.time()).replace(hour=12))))

        # Naloge: dve na predmet (data.js) in ena že pretečena, da so v bazi tudi ocenjene oddaje.
        tasks = []
        for i, (code, _, _, _, _, topic, task, description, _) in enumerate(SUBJECTS):
            sid, teacher = subjects[code], teachers_of[code][0]
            for title, instructions, due in [
                (f'Kviz: {topic.lower()}', REVIEW_TASK, today - timedelta(days=7 + i)),
                (task, description, today + timedelta(days=i + 1)),
                (f'Ponavljanje: {topic.lower()}', REVIEW_TASK, today + timedelta(days=i + 9)),
            ]:
                created = ts(datetime.combine(min(due, today) - timedelta(days=14), datetime.min.time()).replace(hour=9))
                nid = con.execute('INSERT INTO naloge (id_predmet, ustvaril, naslov, navodila, rok_oddaje, ustvarjeno_ob) VALUES (?, ?, ?, ?, ?, ?)',
                                  (sid, teacher, title, instructions, due.isoformat(), created)).lastrowid
                tasks.append((nid, code, title, due))

        # Oddaje: ~60 % učencev odda (kot staff.js); pretečene naloge so ocenjene.
        students = {row[0]: row[1:] for row in con.execute('SELECT id_uporabnik, ime, priimek FROM uporabniki WHERE vloga = ?', ('ucenec',))}
        for nid, code, title, due in tasks:
            past = due < today
            for sid in students_of[code]:
                if rng.random() >= (0.85 if past else 0.45 if due <= today + timedelta(days=3) else 0.15):
                    continue
                submitted = datetime.combine(min(due, today), datetime.min.time()) - timedelta(days=rng.randint(0, 3), hours=-rng.randint(8, 20), minutes=-rng.choice([0, 10, 20, 30, 40, 50]))
                submitted = min(submitted, now)
                first, last = students[sid]
                ext = rng.choice(['.pdf', '.docx', '.pdf', '.png'])
                stored = f'{last} {first} -- {title}{ext}'
                grade = feedback = graded_by = graded_at = None
                if past:
                    grade = rng.choices([5, 4, 3, 2, 1], weights=[25, 35, 25, 10, 5])[0]
                    feedback, graded_by = FEEDBACK[grade], teachers_of[code][0]
                    graded_at = ts(min(now, datetime.combine(due + timedelta(days=3), datetime.min.time()).replace(hour=15)))
                con.execute(
                    'INSERT INTO oddaje (id_naloga, id_ucenec, datoteka_ime, izvirno_ime_datoteke, datoteka_url, velikost_bajtov, oddano_ob, '
                    'ocena, povratna_informacija, ocenil, ocenjeno_ob) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    (nid, sid, stored, f'naloga{ext}', f'/uploads/oddaje/{nid}/{sid}{ext}', rng.randint(20, 3000) * 1024,
                     ts(submitted), grade, feedback, graded_by, graded_at))

        # Koledar: testi in ustna spraševanja po predmetih ter šolski dogodki.
        for i, code in enumerate(codes):
            topic = SUBJECTS[i][5]
            test_day = datetime.combine(today + timedelta(days=5 + 2 * i), datetime.min.time())
            con.execute('INSERT INTO dogodki (id_predmet, ustvaril, naslov, opis, vrsta, zacetek, konec) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        (subjects[code], teachers_of[code][0], f'Test: {topic}', 'Pisno preverjanje znanja, 45 minut.', 'test',
                         ts(test_day.replace(hour=8 + i % 5)), ts(test_day.replace(hour=8 + i % 5, minute=45))))
            if i % 2 == 0:
                oral = test_day + timedelta(days=7)
                con.execute('INSERT INTO dogodki (id_predmet, ustvaril, naslov, vrsta, zacetek, konec) VALUES (?, ?, ?, ?, ?, ?)',
                            (subjects[code], teachers_of[code][-1], 'Ustno spraševanje', 'ustno',
                             ts(oral.replace(hour=10)), ts(oral.replace(hour=10, minute=45))))
        for title, offset, kind, length in [('Roditeljski sestanek', 3, 'dogodek', 0), ('Informativni dan', 12, 'dogodek', 0),
                                            ('Športni dan', 20, 'dogodek', 0), ('Novoletne počitnice', 55, 'pocitnice', 7)]:
            day = datetime.combine(today + timedelta(days=offset), datetime.min.time())
            con.execute('INSERT INTO dogodki (ustvaril, naslov, vrsta, zacetek, konec, ves_dan) VALUES (?, ?, ?, ?, ?, 1)',
                        (admin, title, kind, ts(day), ts(day + timedelta(days=length, hours=23, minutes=59))))

    print(f'Baza ustvarjena: {DB_PATH}')
    for table in ['sole', 'uporabniki', 'predmeti', 'ucitelji_predmeti', 'vpisi', 'gradiva', 'naloge', 'oddaje', 'dogodki']:
        print(f'  {table:<18} {con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]:>5}')
    con.close()


if __name__ == '__main__':
    main()
