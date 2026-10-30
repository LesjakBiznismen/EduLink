// Vzorčni podatki prototipa. Vse se hrani samo v brskalniku, nič se ne pošilja na strežnik.

// id, ime, slika, kratica, barva, tema, naloga, navodila, besedilo gradiva
const rows = [
  ['matematika', 'Matematika', 'matematika', 'MAT', '#bd8546', 'Kvadratna funkcija', 'Graf kvadratne funkcije', 'Narišite grafe funkcij f(x) = x², g(x) = x² − 4 in h(x) = (x − 2)². Označite teme in ničle ter priložite postopek.', 'Kvadratna funkcija ima obliko f(x) = ax² + bx + c. Njen graf je parabola. Če je a pozitiven, je parabola obrnjena navzgor. Teme izračunamo z x = −b / (2a).'],
  ['slovenscina', 'Slovenščina', 'slovenscina', 'SLO', '#b3657c', 'Slovenska moderna', 'Interpretacija pesmi', 'Izberite pesem iz obravnavanega sklopa. V 300 besedah opišite temo, motive in pesniška sredstva. Svoje ugotovitve podprite s primeri.', 'Slovensko moderno povezujemo z Ivanom Cankarjem, Otonom Župančičem, Dragotinom Kettejem in Josipom Murnom. Pri interpretaciji ločimo temo, motive, zgradbo in pesniška sredstva.'],
  ['anglescina', 'Angleščina', 'anglescina', 'ANG', '#518da6', 'Writing an opinion essay', 'An opinion essay', 'Write a 200-word essay about learning online. Include an introduction, two arguments and a conclusion.', 'An opinion essay presents a clear viewpoint. Start with your position, support it with examples and acknowledge another perspective. Use linking words such as however, therefore and in addition.'],
  ['programiranje', 'Programiranje aplikacij', 'programiranje', 'PRO', '#8571b2', 'Zanke in polja', 'Obdelava seznama števil', 'Napišite program, ki izračuna najmanjšo, največjo in povprečno vrednost v polju. Oddajte izvorno kodo z opisom preizkusov.', 'Polje hrani zaporedje vrednosti. Zanka omogoča obdelavo vsakega elementa. Pred računanjem povprečja preverite, ali polje vsebuje vsaj en element.'],
  ['rps', 'Računalniški produkti in storitve (RPS)', 'rps', 'RPS', '#48999b', 'Načrtovanje storitve', 'Predlog računalniške storitve', 'Opišite uporabnike, namen in potek izbrane računalniške storitve. Dodajte primer uporabe.', 'Pri načrtovanju storitve določimo uporabnike, njihove potrebe in pričakovani rezultat. Zahteve naj bodo konkretne in preverljive.'],
  ['splet', 'Spletne aplikacije', 'splet', 'SPA', '#5c8fba', 'Semantični HTML', 'Dostopna spletna stran', 'Izdelajte stran z navigacijo, glavno vsebino in obrazcem. Uporabite semantične elemente in oznake za vsa vnosna polja.', 'Elementi header, nav, main in footer opisujejo strukturo strani. Povezave uporabljamo za navigacijo, gumbe za dejanja. Vsako vnosno polje potrebuje oznako label.'],
  ['smv', 'Stroka - moderne vsebine (SMV)', 'smv', 'SMV', '#947bbb', 'Razširjena resničnost', 'Primer uporabe novih tehnologij', 'Predstavite konkreten primer uporabe razširjene resničnosti. Ocenite prednosti in omejitve.', 'Navidezna resničnost ustvari digitalno okolje. Razširjena resničnost dodaja digitalne elemente v pogled na fizični svet. Pri zasnovi upoštevamo namen, dostopnost in zasebnost.'],
  ['sociologija', 'Sociologija', 'sociologija', 'SOC', '#78966b', 'Družbene skupine', 'Opazovanje družbene skupine', 'Opišite družbeno skupino, njene norme in vloge. Uporabite anonimiziran primer brez osebnih podatkov.', 'Družbeno skupino povezujejo odnosi, skupni cilji in pravila. Primarne skupine temeljijo na tesnih odnosih, sekundarne pa na bolj formalnih stikih.'],
  ['baze', 'Podatkovne baze', 'baze', 'PB', '#459c8c', 'Relacijski podatkovni model', 'Model šolske knjižnice', 'Načrtujte tabele za knjige, člane in izposoje. Določite primarne in tuje ključe ter odnose.', 'Relacijska baza hrani podatke v tabelah. Primarni ključ enolično določa zapis, tuji ključ pa povezuje zapise različnih tabel. Normalizacija zmanjša podvajanje podatkov.'],
]

export const baseSubjects = rows.map(([id, name, image, short, color, topic, task, description, text]) => (
  { id, name, image, short, color, topic, task, description, text }
))

// Slike, ki jih lahko administrator izbere pri predmetu.
export const imageOptions = [
  ['matematika', 'Matematika'], ['slovenscina', 'Slovenščina'], ['anglescina', 'Angleščina'],
  ['programiranje', 'Programiranje'], ['rps', 'Računalniški produkti'], ['splet', 'Splet'],
  ['smv', 'Moderne vsebine'], ['sociologija', 'Sociologija'], ['baze', 'Podatkovne baze'],
  ['privzeto.svg', 'Privzeta slika'],
]
