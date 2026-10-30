const podatkiPredmetov = {
    "Matematika": {
        slika: "matematika.png",
        gradiva: [
            ["Kvadratna funkcija", "PDF · 2,4 MB · dodano 24. 9. 2026"],
            ["Zbirka rešenih primerov", "PDF · 1,8 MB · dodano 20. 9. 2026"],
            ["Formule za ponavljanje", "PDF · 640 KB · dodano 18. 9. 2026"]
        ],
        naloge: [
            ["Graf kvadratne funkcije", "Rok: 2. 10. 2026", "Narišite grafe podanih funkcij in priložite postopek reševanja."],
            ["Enačbe in neenačbe", "Rok: 9. 10. 2026", "Rešite naloge 12–18 iz delovnega lista in oddajte sken reševanja."]
        ]
    },
    "Slovenščina": { slika: "slovenscina.png" },
    "Angleščina": { slika: "anglescina.png" },
    "Programiranje aplikacij": { slika: "programiranje.png" },
    "Računalniški produkti in storitve (RPS)": { slika: "rps.png" },
    "Spletne aplikacije": { slika: "splet.png" },
    "Stroka - moderne vsebine (SMV)": { slika: "smv.png" },
    "Sociologija": { slika: "sociologija.png" },
    "Podatkovne baze": { slika: "baze.png" }
};

const privzetaGradiva = [
    ["Uvodno gradivo", "PDF · 1,2 MB · dodano 24. 9. 2026"],
    ["Vaje za utrjevanje", "PDF · 980 KB · dodano 20. 9. 2026"],
    ["Povzetek poglavja", "PDF · 720 KB · dodano 18. 9. 2026"]
];

const privzeteNaloge = [
    ["Samostojna vaja", "Rok: 2. 10. 2026", "Rešite priloženo vajo in oddajte dokument z jasno prikazanim postopkom."],
    ["Ponavljanje snovi", "Rok: 9. 10. 2026", "Pripravite kratek povzetek obravnavane snovi in ga oddajte kot PDF."]
];

document.addEventListener("DOMContentLoaded", function () {
    const parametri = new URLSearchParams(window.location.search);
    const imePredmeta = parametri.get("predmet") || "Matematika";
    const predmet = podatkiPredmetov[imePredmeta] || podatkiPredmetov["Matematika"];
    const gradiva = predmet.gradiva || privzetaGradiva;
    const naloge = predmet.naloge || privzeteNaloge;

    document.title = `${imePredmeta} | EduLink`;
    document.querySelector("#predmet-naslov").textContent = imePredmeta;
    document.querySelector("#predmet-ikona").src = `slike/predmeti/${predmet.slika}`;
    document.querySelector("#gradiva-stevec").textContent = `${gradiva.length} gradiva`;
    document.querySelector("#naloge-stevec").textContent = `${naloge.length} nalogi`;

    prikaziGradiva(gradiva);
    prikaziNaloge(imePredmeta, naloge);
});

function prikaziGradiva(gradiva) {
    const seznam = document.querySelector("#gradiva-seznam");
    const predloga = document.querySelector("#gradivo-predloga");

    gradiva.forEach(function ([naslov, podrobnosti]) {
        const gradivo = predloga.content.cloneNode(true);
        gradivo.querySelector("h3").textContent = naslov;
        gradivo.querySelector("p").textContent = podrobnosti;
        seznam.appendChild(gradivo);
    });
}

function prikaziNaloge(imePredmeta, naloge) {
    const seznam = document.querySelector("#naloge-seznam");
    const predloga = document.querySelector("#naloga-predloga");

    naloge.forEach(function ([naslov, rok, opis], index) {
        const naloga = predloga.content.cloneNode(true);
        const clanek = naloga.querySelector(".naloga");
        const obrazec = naloga.querySelector("form");
        const input = naloga.querySelector("input[type='file']");
        const izbranaDatoteka = naloga.querySelector(".izbrana-datoteka");
        const status = naloga.querySelector(".naloga-status");
        const sporocilo = naloga.querySelector(".naloga-sporocilo");
        const kljuc = `edulink-oddaja-${imePredmeta}-${index}`;

        naloga.querySelector("h3").textContent = naslov;
        naloga.querySelector(".naloga-rok").textContent = rok;
        naloga.querySelector(".naloga-opis").textContent = opis;

        if (sessionStorage.getItem(kljuc)) {
            nastaviOddano(clanek, status, sporocilo, sessionStorage.getItem(kljuc));
        }

        input.addEventListener("change", function () {
            izbranaDatoteka.textContent = input.files.length ? input.files[0].name : "Datoteka še ni izbrana.";
        });

        obrazec.addEventListener("submit", function (dogodek) {
            dogodek.preventDefault();

            if (!input.files.length) {
                input.focus();
                return;
            }

            const prejsnjaOddaja = sessionStorage.getItem(kljuc);
            if (prejsnjaOddaja && !window.confirm("Nalogo ste že oddali. Ali želite prejšnjo datoteko prepisati z novo?")) {
                return;
            }

            const izvirnoIme = input.files[0].name;
            const pika = izvirnoIme.lastIndexOf(".");
            const koncnica = pika >= 0 ? izvirnoIme.slice(pika) : "";
            const strezniskoIme = `Priimek Ime -- ${naslov}${koncnica}`;

            sessionStorage.setItem(kljuc, strezniskoIme);
            nastaviOddano(clanek, status, sporocilo, strezniskoIme);
            obrazec.reset();
            izbranaDatoteka.textContent = "Datoteka še ni izbrana.";
        });

        seznam.appendChild(naloga);
    });
}

function nastaviOddano(clanek, status, sporocilo, imeDatoteke) {
    clanek.classList.add("je-oddano");
    status.textContent = "Oddano";
    sporocilo.textContent = `Shranjeno kot: ${imeDatoteke}`;
}
