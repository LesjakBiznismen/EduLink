/* Shared, intentionally small demo dataset. No framework or server required. */
window.EduData = (() => {
    const rows = [
        ['matematika', 'Matematika', 'matematika', 'MAT', '#bd8546', 'Kvadratna funkcija', 'Graf kvadratne funkcije', 'Narišite grafe funkcij f(x) = x², g(x) = x² − 4 in h(x) = (x − 2)². Označite teme in ničle ter priložite postopek.', 'Kvadratna funkcija ima obliko f(x) = ax² + bx + c. Njen graf je parabola. Če je a pozitiven, je parabola obrnjena navzgor. Teme izračunamo z x = −b / (2a).'],
        ['slovenscina', 'Slovenščina', 'slovenscina', 'SLO', '#b3657c', 'Slovenska moderna', 'Interpretacija pesmi', 'Izberite pesem iz obravnavanega sklopa. V 300 besedah opišite temo, motive in pesniška sredstva. Svoje ugotovitve podprite s primeri.', 'Slovensko moderno povezujemo z Ivanom Cankarjem, Otonom Župančičem, Dragotinom Kettejem in Josipom Murnom. Pri interpretaciji ločimo temo, motive, zgradbo in pesniška sredstva.'],
        ['anglescina', 'Angleščina', 'anglescina', 'ANG', '#518da6', 'Writing an opinion essay', 'An opinion essay', 'Write a 200-word essay about learning online. Include an introduction, two arguments and a conclusion.', 'An opinion essay presents a clear viewpoint. Start with your position, support it with examples and acknowledge another perspective. Use linking words such as however, therefore and in addition.'],
        ['programiranje', 'Programiranje aplikacij', 'programiranje', 'PRO', '#8571b2', 'Zanke in polja', 'Obdelava seznama števil', 'Napišite program, ki izračuna najmanjšo, največjo in povprečno vrednost v polju. Oddajte izvorno kodo z opisom preizkusov.', 'Polje hrani zaporedje vrednosti. Zanka omogoča obdelavo vsakega elementa. Pred računanjem povprečja preverite, ali polje vsebuje vsaj en element.'],
        ['rps', 'Računalniški produkti in storitve (RPS)', 'rps', 'RPS', '#48999b', 'Načrtovanje storitve', 'Predlog računalniške storitve', 'Opišite uporabnike, namen in potek izbrane računalniške storitve. Dodajte primer uporabe.', 'Pri načrtovanju storitve določimo uporabnike, njihove potrebe in pričakovani rezultat. Zahteve naj bodo konkretne in preverljive.'],
        ['splet', 'Spletne aplikacije', 'splet', 'SPA', '#5c8fba', 'Semantični HTML', 'Dostopna spletna stran', 'Izdelajte stran z navigacijo, glavno vsebino in obrazcem. Uporabite semantične elemente in oznake za vsa vnosna polja.', 'Elementi header, nav, main in footer opisujejo strukturo strani. Povezave uporabljamo za navigacijo, gumbe za dejanja. Vsako vnosno polje potrebuje oznako label.'],
        ['smv', 'Stroka - moderne vsebine (SMV)', 'smv', 'SMV', '#947bbb', 'Razširjena resničnost', 'Primer uporabe novih tehnologij', 'Predstavite konkreten primer uporabe razširjene resničnosti. Ocenite prednosti in omejitve.', 'Navidezna resničnost ustvari digitalno okolje. Razširjena resničnost dodaja digitalne elemente v pogled na fizični svet. Pri zasnovi upoštevamo namen, dostopnost in zasebnost.'],
        ['sociologija', 'Sociologija', 'sociologija', 'SOC', '#78966b', 'Družbene skupine', 'Opazovanje družbene skupine', 'Opišite družbeno skupino, njene norme in vloge. Uporabite anonimiziran primer brez osebnih podatkov.', 'Družbeno skupino povezujejo odnosi, skupni cilji in pravila. Primarne skupine temeljijo na tesnih odnosih, sekundarne pa na bolj formalnih stikih.'],
        ['baze', 'Podatkovne baze', 'baze', 'PB', '#459c8c', 'Relacijski podatkovni model', 'Model šolske knjižnice', 'Načrtujte tabele za knjige, člane in izposoje. Določite primarne in tuje ključe ter odnose.', 'Relacijska baza hrani podatke v tabelah. Primarni ključ enolično določa zapis, tuji ključ pa povezuje zapise različnih tabel. Normalizacija zmanjša podvajanje podatkov.']
    ];
    const baseSubjects = rows.map(([id, name, image, short, color, topic, task, description, text]) => ({id, name, image, short, color, topic, task, description, text}));
    // Administrator lahko predmete dodaja, preimenuje in briše (store.js); novi predmeti dobijo privzete vsebine.
    const store = window.EduStore?.state;
    const subjects = store?.subjects?.length ? store.subjects.map(s => ({short: s.name.slice(0, 3).toUpperCase(), color: '#5c8fba', topic: 'Uvod', task: 'Prva naloga', description: 'Navodila za nalogo bo dodal učitelj.', text: 'Gradivo bo dodal učitelj.', ...baseSubjects.find(b => b.id === s.id), ...s})) : baseSubjects;
    // Keep demo deadlines stable across reloads and navigation, even on a later day.
    let anchor;
    try { anchor = localStorage.getItem('edulink-schedule'); } catch { /* Storage may be disabled. */ }
    const base = anchor && !Number.isNaN(Date.parse(anchor)) ? new Date(anchor) : new Date();
    base.setHours(12, 0, 0, 0);
    try { localStorage.setItem('edulink-schedule', base.toISOString()); } catch { /* The demo still renders. */ }
    const date = offset => { const d = new Date(base); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    const assignments = subjects.flatMap((s, i) => [
        {id: `${s.id}-1`, subject: s.id, title: s.task, description: s.description, due: date(i + 1)},
        {id: `${s.id}-2`, subject: s.id, title: `Ponavljanje: ${s.topic.toLowerCase()}`, description: 'Pripravite kratek povzetek poglavja in tri vprašanja za ponavljanje. Pri vsakem vprašanju napišite tudi odgovor.', due: date(i + 9)}
    ]);
    const materials = subjects.flatMap(s => [
        {id: `${s.id}-notes`, subject: s.id, title: s.topic, type: 'Zapiski', content: s.text, added: date(-2)},
        {id: `${s.id}-practice`, subject: s.id, title: `Vaje · ${s.topic}`, type: 'Vaje', content: `${s.description}\n\nZa ponavljanje\n1. S svojimi besedami razložite ključne pojme.\n2. Dodajte svoj primer.\n3. Zapišite vprašanje, o katerem bi se želeli pogovoriti pri pouku.`, added: date(-4)}
    ]);
    // Učitelji lahko gradiva nalagajo in brišejo; sprememba velja tudi za učenca.
    const removed = new Set(store?.removedMaterials || []);
    const baseIds = new Set(baseSubjects.map(b => b.id));
    const allMaterials = [
        ...materials.filter(m => baseIds.has(m.subject) && !removed.has(m.id)),
        ...(store?.materials || []).filter(m => subjects.some(s => s.id === m.subject))
    ];
    // Učitelji lahko dodajajo naloge; učenec jih vidi takoj.
    assignments.push(...(store?.assignments || []).filter(a => subjects.some(s => s.id === a.subject)));
    return {subjects, assignments, materials: allMaterials};
})();
