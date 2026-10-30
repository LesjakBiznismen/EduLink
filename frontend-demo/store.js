/* Skupna demo "baza" za vloge administrator in učitelj. Vse je v localStorage, nič se ne pošilja na strežnik. */
window.EduStore = (() => {
    'use strict';
    const KEY = 'edulink-staff-v1';
    const firstNames = ['Ana','Luka','Nina','Jan','Eva','Matej','Tina','Žan','Maja','Nejc','Sara','Urban','Lara','Tim','Katja','Gal','Zala','Rok','Pia','Miha','Neža','Anže','Ema','Domen','Lea','Jaka','Mia','Blaž','Klara','Aljaž'];
    const lastNames = ['Novak','Horvat','Kovačič','Krajnc','Zupančič','Potočnik','Kos','Vidmar','Golob','Kralj','Božič','Korošec','Turk','Mlakar','Kovač','Petek','Žagar','Hribar','Oblak','Kavčič','Zajc','Medved','Rozman','Babič','Pirc'];
    const slug = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    const baseSubjects = [
        ['matematika', 'Matematika', 'matematika'],
        ['slovenscina', 'Slovenščina', 'slovenscina'],
        ['anglescina', 'Angleščina', 'anglescina'],
        ['programiranje', 'Programiranje aplikacij', 'programiranje'],
        ['rps', 'Računalniški produkti in storitve (RPS)', 'rps'],
        ['splet', 'Spletne aplikacije', 'splet'],
        ['smv', 'Stroka - moderne vsebine (SMV)', 'smv'],
        ['sociologija', 'Sociologija', 'sociologija'],
        ['baze', 'Podatkovne baze', 'baze'],
        ['zgodovina', 'Zgodovina', 'privzeto.svg']
    ];
    function seed() {
        const subjects = baseSubjects.map(([id, name, image]) => ({id, name, image}));
        const ids = subjects.map(s => s.id), n = ids.length;
        const person = (prefix, i, a, b) => {
            const first = firstNames[(i * a + 3) % firstNames.length], last = lastNames[(i * b + Math.floor(i / 5)) % lastNames.length];
            return {id: `${prefix}${i + 1}`, first, last, email: `${slug(first)}.${slug(last)}${i + 1}@sola.si`};
        };
        // 20 učiteljev: nekateri predmeti imajo dva učitelja, nekateri učitelji poučujejo dva predmeta.
        const teachers = Array.from({length: 20}, (_, i) => {
            const taught = i < 10 ? [ids[i]] : i < 15 ? [ids[i - 10]] : [ids[i - 10], ids[i - 15]];
            return {...person('t', i, 7, 3), subjects: [...new Set(taught)]};
        });
        // 100 učencev: vsak obiskuje od 2 do 4 predmetov.
        const students = Array.from({length: 100}, (_, i) => {
            const count = 2 + (i % 3), start = (i * 3) % n;
            return {...person('s', i, 11, 7), subjects: Array.from({length: count}, (_, k) => ids[(start + k) % n])};
        });
        return {subjects, teachers, students, materials: [], removedMaterials: []};
    }
    let state = null;
    try { state = JSON.parse(localStorage.getItem(KEY)); } catch { /* Shramba ni na voljo. */ }
    if (!state?.subjects?.length) state = seed();
    state.assignments = state.assignments || [];
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Demo še vedno deluje do osvežitve. */ } };
    save();
    return {state, save};
})();
