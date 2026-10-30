function odpri (stran){
    window.location.href = stran;
}

// Skrije izbrano kartico in posodobi pripadajoči checkbox.
function skrijPredmet(gumb) {
    const predmet = gumb.closest(".predmet");
    predmet.hidden = true;

    document.querySelectorAll(`.izbira-predmetov-moznost input[data-predmet-index="${predmet.dataset.predmetIndex}"]`).forEach(function (checkbox) {
        checkbox.checked = false;
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const dobrodoslica = document.querySelector(".ucilnica-dobrodoslica");
    const ucilnicaHeader = document.querySelector(".ucilnica-header");
    const mrezaPredmetov = document.querySelector(".predmeti");
    const izbire = document.querySelectorAll(".izbira-predmetov");
    const predmeti = Array.from(document.querySelectorAll(".predmet"));

    if (!dobrodoslica || !ucilnicaHeader || !mrezaPredmetov || !izbire.length) {
        return;
    }

    function sinhronizirajCheckboxe(index, izbran, izvor) {
        document.querySelectorAll(`.izbira-predmetov-moznost input[data-predmet-index="${index}"]`).forEach(function (checkbox) {
            if (checkbox !== izvor) {
                checkbox.checked = izbran;
            }
        });
    }

    function osveziPotrditev() {
        const potrdi = document.querySelector(".izbira-predmetov-potrdi");
        const jeKajIzbrano = Boolean(document.querySelector(".izbira-predmetov-zacetna input:checked"));

        if (potrdi) {
            potrdi.disabled = !jeKajIzbrano;
        }
    }

    predmeti.forEach(function (predmet, index) {
        const ime = predmet.querySelector(".predmet-ime").textContent.trim();
        predmet.dataset.predmetIndex = index;
        predmet.hidden = true;
        predmet.tabIndex = 0;
        predmet.setAttribute("role", "link");
        predmet.setAttribute("aria-label", `Odpri predmet ${ime}`);

        predmet.addEventListener("click", function (dogodek) {
            if (!dogodek.target.closest(".predmet-odstrani")) {
                window.location.href = `predmet.html?predmet=${encodeURIComponent(ime)}`;
            }
        });

        predmet.addEventListener("keydown", function (dogodek) {
            if (dogodek.key === "Enter") {
                window.location.href = `predmet.html?predmet=${encodeURIComponent(ime)}`;
            }
        });

        izbire.forEach(function (izbira, izbiraIndex) {
            const seznam = izbira.querySelector(".izbira-predmetov-seznam");
            const id = `predmet-${izbiraIndex}-${index}`;
            const oznaka = document.createElement("label");
            const checkbox = document.createElement("input");
            const besedilo = document.createElement("span");

            oznaka.className = "izbira-predmetov-moznost";
            oznaka.htmlFor = id;
            checkbox.type = "checkbox";
            checkbox.id = id;
            checkbox.checked = false;
            checkbox.dataset.predmetIndex = index;
            besedilo.textContent = ime;

            checkbox.addEventListener("change", function () {
                predmet.hidden = !checkbox.checked;
                sinhronizirajCheckboxe(index, checkbox.checked, checkbox);
                osveziPotrditev();
            });

            oznaka.append(checkbox, besedilo);
            seznam.appendChild(oznaka);
        });
    });

    function zapriDropdowne(izjema) {
        izbire.forEach(function (izbira) {
            if (izbira !== izjema) {
                izbira.querySelector(".izbira-predmetov-dropdown").hidden = true;
                izbira.querySelector(".izbira-predmetov-gumb").setAttribute("aria-expanded", "false");
            }
        });
    }

    izbire.forEach(function (izbira) {
        const gumb = izbira.querySelector(".izbira-predmetov-gumb");
        const dropdown = izbira.querySelector(".izbira-predmetov-dropdown");

        gumb.addEventListener("click", function () {
            const odpri = dropdown.hidden;
            zapriDropdowne(odpri ? izbira : null);
            dropdown.hidden = !odpri;
            gumb.setAttribute("aria-expanded", String(odpri));
        });
    });

    document.querySelector(".izbira-predmetov-potrdi").addEventListener("click", function () {
        dobrodoslica.hidden = true;
        ucilnicaHeader.hidden = false;
        mrezaPredmetov.hidden = false;
        zapriDropdowne();
    });

    document.addEventListener("click", function (dogodek) {
        if (!dogodek.target.closest(".izbira-predmetov")) {
            zapriDropdowne();
        }
    });

    document.addEventListener("keydown", function (dogodek) {
        const odprtaIzbira = Array.from(izbire).find(function (izbira) {
            return !izbira.querySelector(".izbira-predmetov-dropdown").hidden;
        });

        if (dogodek.key === "Escape" && odprtaIzbira) {
            const gumb = odprtaIzbira.querySelector(".izbira-predmetov-gumb");
            zapriDropdowne();
            gumb.focus();
        }
    });

    osveziPotrditev();
});
