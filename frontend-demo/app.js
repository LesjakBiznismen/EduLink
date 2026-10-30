/* EduLink frontend demo — plain HTML, CSS and JavaScript. */
(() => {
    'use strict';
    const {subjects, assignments, materials} = window.EduData;
    const $ = (selector, root = document) => root.querySelector(selector);
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const read = (store, key, fallback) => { try { return JSON.parse(window[store].getItem(key)) ?? fallback; } catch { return fallback; } };
    const write = (store, key, value) => { window[store].setItem(key, JSON.stringify(value)); };
    const defaultProfile = {first:'Ime', last:'Priimek', email:'', school:''};
    let profile = {...defaultProfile, ...read('localStorage', 'edulink-profile', {})};
    let selected = read('sessionStorage', 'edulink-subjects', []).filter(id => subjects.some(s => s.id === id));
    let submissions = {};
    let filter = {query: new URLSearchParams(location.search).get('q') || '', subject:'', status:'all', type:''};
    let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const page = document.body.dataset.page || 'ucilnica';
    const staff = window.EduStaff;
    const role = staff ? staff.role() : 'ucenec';
    const isStaff = role !== 'ucenec';
    const routes = isStaff ? staff.routes(role) : [['ucilnica','domov.html','Predmeti','grid'],['naloge','naloge.html','Naloge','check'],['gradiva','gradiva.html','Gradiva','folder'],['koledar','koledar.html','Koledar','calendar']];
    const imgSrc = s => `slike/predmeti/${s.image}${s.image.includes('.') ? '' : '.png'}`;
    const subject = id => subjects.find(s => s.id === id);
    const currentSubjectId = () => { const key = new URLSearchParams(location.search).get('predmet'); return subjects.find(s => s.id === key || s.name === key)?.id; };
    const dateValue = iso => new Date(`${iso}T12:00:00`);
    const dateLabel = iso => dateValue(iso).toLocaleDateString('sl-SI', {day:'numeric', month:'short'});
    const fullName = () => `${profile.first} ${profile.last}`;
    const initials = () => `${profile.first?.[0] || 'I'}${profile.last?.[0] || 'P'}`.toUpperCase();
    const visibleAssignments = () => assignments.filter(a => selected.includes(a.subject)).sort((a,b) => a.due.localeCompare(b.due));
    const visibleMaterials = () => materials.filter(m => selected.includes(m.subject));
    const openCount = () => visibleAssignments().filter(a => !submissions[a.id]).length;
    const openFor = id => assignments.filter(a => a.subject === id && !submissions[a.id]).length;
    const plural = (n, one, two, few, many) => `${n} ${n % 100 === 1 ? one : n % 100 === 2 ? two : [3,4].includes(n % 100) ? few : many}`;
    const paths = {
        grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
        check:'M9 4H5a2 2 0 0 0-2 2v14h18V6a2 2 0 0 0-2-2h-4 M9 2h6v5H9z M8 14l3 3 5-6',
        tick:'M5 12.5l4.5 4.5L19 7',
        folder:'M3 6h7l2 2h9v12H3z M3 6V4h7l2 2h7v2',
        calendar:'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M8 14h2 M14 14h2',
        user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-3a8 8 0 0 1 16 0v3',
        search:'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',
        plus:'M12 5v14 M5 12h14', close:'M6 6l12 12 M18 6 6 18',
        arrow:'M5 12h14 M14 7l5 5-5 5', down:'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
        file:'M5 3h9l5 5v13H5z M14 3v6h5 M9 13h6 M9 17h6',
        logout:'M10 4H4v16h6 M9 12h12 M17 8l4 4-4 4',
        left:'M15 5l-7 7 7 7', right:'M9 5l7 7-7 7',
        warn:'M12 4l10 17H2z M12 10v5 M12 18v.5',
        trash:'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6',
        users:'M9 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z M2 20v-2a6 6 0 0 1 12 0v2 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14a6 6 0 0 1 4 6'
    };
    const icon = name => `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;
    const button = (text, action, extra = '', cls = '') => `<button class="ui-button ${cls}" type="button" data-action="${action}" ${extra}>${text}</button>`;
    const header = (title, subtitle, action = '') => `<div class="page-heading"><div><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>${action}</div>`;
    const empty = (title, copy, action = '') => `<div class="empty-state">${icon('folder')}<h2>${esc(title)}</h2><p>${esc(copy)}</p>${action}</div>`;
    let toastTimer;
    function toast(message) { const el = $('#toast'); el.textContent = message; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 5000); }

    // Store actual file blobs, not just a success flag. Nothing is sent to a server.
    let dbPromise;
    function database() {
        if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open('edulink-demo', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('submissions', {keyPath:'id'});
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        return dbPromise;
    }
    async function records(mode, callback) {
        const db = await database();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('submissions', mode);
            const request = callback(transaction.objectStore('submissions'));
            transaction.oncomplete = () => resolve(request.result);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error || new Error('Shranjevanje ni uspelo.'));
        });
    }
    function shell() {
        document.body.innerHTML = `<div class="app"><a class="skip-link" href="#main">Preskoči na vsebino</a>
            <header class="topbar"><a class="brand" href="domov.html" aria-label="EduLink – predmeti"><img src="slike/edulink-logo.png" alt="EduLink"></a>
                <form class="topbar-search" id="topbar-search" role="search">${icon('search')}<input id="topbar-query" type="search" placeholder="${isStaff ? staff.placeholder() : 'Poišči naloge'}" aria-label="${isStaff ? staff.placeholder() : 'Poišči naloge'}" value="${esc(isStaff ? staff.query() : page === 'naloge' ? filter.query : '')}"></form>
                ${role === 'admin' ? '<div class="top-profile"></div>' : '<a class="top-profile" href="profil.html"></a>'}</header>
            <div class="frame"><aside class="rail" id="rail"></aside>
                <div class="workspace ${['ucilnica','predmet'].includes(page) && role !== 'admin' && !(role === 'ucitelj' && staff.mySubjects().length === 1) ? '' : 'no-courses'}"><aside class="courses" id="courses" aria-label="Moji predmeti"></aside><main class="app-main" id="main" tabindex="-1"></main></div></div></div>
            <dialog class="app-dialog" id="dialog" aria-labelledby="dialog-title"></dialog><div class="toast" id="toast" role="status" hidden></div>`;
        updateShell();
        $('#dialog').addEventListener('click', e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(); } });
    }
    function updateShell() {
        $('#rail').innerHTML = `<nav class="rail-nav" aria-label="Glavna navigacija">${routes.map(([id,url,label,glyph]) => `<a class="rail-link" href="${url}" ${page === id || (page === 'predmet' && id === 'ucilnica') ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span>${id === 'naloge' && !isStaff && openCount() ? `<span class="rail-badge" aria-label="${plural(openCount(), 'naloga', 'nalogi', 'nalogi', 'nalog')} za oddajo">${openCount()}</span>` : ''}</a>`).join('')}</nav>
            <div class="rail-footer">${role === 'admin' ? '' : `<a class="rail-link" href="profil.html" ${page === 'profil' ? 'aria-current="page"' : ''}>${icon('user')}<span>Profil</span></a>`}<a class="rail-link" href="index.html">${icon('logout')}<span>Odjava</span></a></div>`;
        const active = page === 'predmet' ? new URLSearchParams(location.search).get('predmet') : '';
        const listed = isStaff ? staff.mySubjects() : subjects.filter(s => selected.includes(s.id));
        $('#courses').innerHTML = `<div class="courses-head"><h2>Predmeti</h2>${isStaff ? '' : `<button class="icon-button" type="button" data-action="subjects" aria-label="Izberi predmete" title="Izberi predmete">${icon('plus')}</button>`}</div>
            ${listed.length ? `<nav aria-label="Seznam predmetov">${listed.map(s => `<a class="course-link" href="predmet.html?predmet=${s.id}" ${active === s.id ? 'aria-current="page"' : ''}><span>${esc(s.name)}</span></a>`).join('')}</nav>` : `<p class="courses-empty">${isStaff ? 'Nimate predmetov.' : 'Ni izbranih predmetov.'}</p>`}`;
        const who = isStaff ? staff.identity() : {name: fullName(), initials: initials()};
        $('.top-profile').innerHTML = `<span>${esc(who.name)}</span><span class="avatar" aria-hidden="true">${esc(who.initials)}</span>`;
    }
    function render() {
        updateShell();
        if (isStaff) { $('#main').innerHTML = staff.render(page); return; }
        const renderers = {ucilnica:classroom, naloge:assignmentPage, gradiva:materialsPage, koledar:calendarPage, profil:profilePage, predmet:subjectPage};
        $('#main').innerHTML = (renderers[page] || classroom)();
    }
    function subjectCard(s) {
        return `<article class="predmet"><img class="predmet-slika" src="${imgSrc(s)}" alt=""><div class="predmet-vsebina"><h2 class="predmet-ime"><a class="subject-card-link" href="predmet.html?predmet=${s.id}">${esc(s.name)}</a></h2></div></article>`;
    }
    function classroom() {
        if (!selected.length) return header('Predmeti', '') + empty('Ni izbranih predmetov', 'Izberite predmete, ki jih obiskujete. Pokazali se bodo skupaj z nalogami in gradivi.', button(`${icon('plus')} Izberi predmete`, 'subjects', '', 'primary'));
        const upcoming = visibleAssignments().filter(a => !submissions[a.id]).slice(0, 4);
        return `${header('Predmeti', '')}
            <div class="predmeti">${subjects.filter(s => selected.includes(s.id)).map(subjectCard).join('')}</div>
            ${upcoming.length ? `<div class="section-title"><h2>Prihajajoči roki</h2><a href="naloge.html">Vse naloge</a></div><div class="list-surface">${upcoming.map(assignmentRow).join('')}</div>` : ''}`;
    }
    function noSubjects() { return empty('Najprej izberite predmete', 'Naloge in gradiva se prikažejo za predmete v vaši učilnici.', button('Izberi predmete','subjects','','primary')); }
    function searchToolbar(placeholder, withType = false) {
        return `<div class="toolbar"><label class="search-field">${icon('search')}<input id="search" type="search" aria-label="${placeholder}" placeholder="${placeholder}" value="${esc(filter.query)}"></label><div class="filters"><select id="subject-filter" aria-label="Filtriraj po predmetu"><option value="">Vsi predmeti</option>${subjects.filter(s => selected.includes(s.id)).map(s => `<option value="${s.id}" ${filter.subject === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>${withType ? `<select id="type-filter" aria-label="Vrsta gradiva"><option value="">Vse vrste</option>${['Zapiski','Vaje'].map(t => `<option ${filter.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>` : ''}</div></div>`;
    }
    function status(a) {
        if (submissions[a.id]) return `<span class="badge done">${icon('tick')}Oddano</span>`;
        return dateValue(a.due) < new Date(new Date().setHours(0,0,0,0)) ? `<span class="badge late">${icon('warn')}Rok je potekel</span>` : '<span class="badge">Za oddajo</span>';
    }
    function assignmentRow(a) { const s = subject(a.subject); return `<article class="assignment-row"><img class="row-thumb" src="${imgSrc(s)}" alt=""><div><h3 class="row-title">${esc(a.title)}<span class="row-sep" aria-hidden="true">|</span><time class="row-date" datetime="${a.due}">${dateLabel(a.due)}</time></h3><p class="row-meta">${esc(s.name)}</p></div><div class="due-column">${status(a)}</div>${button(submissions[a.id] ? 'Poglej oddajo' : 'Odpri nalogo','assignment',`data-id="${a.id}"`,'small')}</article>`; }
    function assignmentResults() {
        const query = filter.query.toLocaleLowerCase('sl');
        const items = visibleAssignments().filter(a => (!filter.subject || a.subject === filter.subject) && (filter.status === 'all' || (filter.status === 'done' ? !!submissions[a.id] : !submissions[a.id])) && `${a.title} ${subject(a.subject).name}`.toLocaleLowerCase('sl').includes(query));
        return `${items.length ? `<div class="list-surface">${items.map(assignmentRow).join('')}</div>` : empty('Ni nalog za ta izbor', 'Poskusite drug predmet, status ali iskalni izraz.', button('Počisti filtre','clear-filters','','small'))}`;
    }
    function assignmentPage() {
        return header('Naloge', '') + (!selected.length ? noSubjects() : `${searchToolbar('Poišči nalogo')}<div id="results">${assignmentResults()}</div>`);
    }
    function materialResults() {
        const query = filter.query.toLocaleLowerCase('sl');
        const items = visibleMaterials().filter(m => (!filter.subject || m.subject === filter.subject) && (!filter.type || m.type === filter.type) && `${m.title} ${subject(m.subject).name}`.toLocaleLowerCase('sl').includes(query));
        return `${items.length ? `<div class="list-surface"><table class="file-table"><thead><tr><th scope="col">Ime gradiva</th><th class="optional-column" scope="col">Vrsta</th><th class="optional-column" scope="col">Dodano</th><th scope="col"><span class="sr-only">Prenos</span></th></tr></thead><tbody>${items.map(m => `<tr><td><div class="file-name"><span class="file-symbol">${icon('file')}</span><div><button class="file-title" type="button" data-action="material" data-id="${m.id}">${esc(m.title)}</button><span class="file-subject">${esc(subject(m.subject).name)}</span></div></div></td><td class="optional-column"><span class="badge">${m.type}</span></td><td class="optional-column">${dateLabel(m.added)}</td><td><button class="icon-button" type="button" data-action="download-material" data-id="${m.id}" aria-label="Prenesi ${esc(m.title)}">${icon('down')}</button></td></tr>`).join('')}</tbody></table></div>` : empty('Ni najdenih gradiv', 'Poskusite drug iskalni izraz ali odstranite filtre.', button('Počisti filtre','clear-filters','','small'))}`;
    }
    function materialsPage() { return header('Gradiva', '') + (!selected.length ? noSubjects() : `${searchToolbar('Poišči gradivo', true)}<div id="results">${materialResults()}</div>`); }
    function subjectPage() {
        const s = subject(currentSubjectId());
        if (!s) return empty('Predmet ni najden', 'Vrnite se med predmete in izberite enega od njih.', '<a class="ui-button" href="domov.html">Nazaj na predmete</a>');
        document.title = `${s.name} · EduLink`;
        const list = assignments.filter(a => a.subject === s.id), files = materials.filter(m => m.subject === s.id);
        const assignmentsHtml = `<div class="list-surface">${list.map(assignmentRow).join('')}</div><p class="note">Oddaje so shranjene samo v tem brskalniku.</p>`;
        const filesHtml = `<div class="list-surface">${files.map(m => `<div class="file-row"><span class="file-symbol">${icon('file')}</span><button class="file-title" type="button" data-action="material" data-id="${m.id}">${esc(m.title)}<span class="file-subject">${m.type} · ${dateLabel(m.added)}</span></button><button class="icon-button" type="button" data-action="download-material" data-id="${m.id}" aria-label="Prenesi ${esc(m.title)}">${icon('down')}</button></div>`).join('')}</div>`;
        return `<section class="subject-intro"><img src="${imgSrc(s)}" alt=""><div><h1>${esc(s.name)}</h1><div class="teacher-line"><span class="avatar" aria-hidden="true">IP</span><span>Ime Priimek · učitelj</span></div></div></section>
            ${!selected.includes(s.id) ? `<div class="banner"><span>Ta predmet še ni na vašem seznamu.</span>${button('Dodaj predmet','add-subject',`data-id="${s.id}"`,'small primary')}</div>` : ''}
            <div class="subject-columns"><section class="subject-view" aria-labelledby="naloge-naslov"><div class="section-title"><h2 id="naloge-naslov">Naloge</h2></div>${assignmentsHtml}</section>
            <section aria-labelledby="gradiva-naslov"><div class="section-title"><h2 id="gradiva-naslov">Gradiva</h2></div>${filesHtml}</section></div>`;
    }
    function calendarPage() {
        const first = new Date(month); first.setDate(1 - (first.getDay()+6)%7);
        const today = new Date().toDateString();
        const days = Array.from({length:42}, (_,i) => { const d = new Date(first); d.setDate(d.getDate()+i); const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; return `<div class="calendar-day ${d.getMonth() !== month.getMonth() ? 'outside' : ''} ${d.toDateString() === today ? 'is-today' : ''}"><span class="day-number" ${d.toDateString() === today ? 'aria-current="date"' : ''}>${d.getDate()}</span>${visibleAssignments().filter(a => a.due === iso).map(a => `<button class="calendar-event" type="button" data-action="assignment" data-id="${a.id}" title="${esc(a.title)} · ${esc(subject(a.subject).name)}">${esc(a.title)}${submissions[a.id] ? ' (oddano)' : ''}</button>`).join('')}</div>`; }).join('');
        return header('Koledar', '') + (!selected.length ? noSubjects() : `<div class="toolbar"><div class="calendar-controls">${button(icon('left'),'month','data-step="-1" aria-label="Prejšnji mesec"','small')}<h2 aria-live="polite">${month.toLocaleDateString('sl-SI',{month:'long',year:'numeric'})}</h2>${button(icon('right'),'month','data-step="1" aria-label="Naslednji mesec"','small')}</div>${button('Danes','today','','small')}</div><div class="calendar-scroll"><div class="calendar-grid">${['Pon','Tor','Sre','Čet','Pet','Sob','Ned'].map(d => `<div class="weekday">${d}</div>`).join('')}${days}</div></div>`);
    }
    function profileFields() { return `<div class="profile-fields">${[['first','Ime','text'],['last','Priimek','text'],['email','E-naslov','email'],['school','Šola','text']].map(([name,label,type]) => `<label class="field">${label}<input name="${name}" type="${type}" value="${esc(profile[name])}" ${['first','last'].includes(name) ? 'required' : ''} maxlength="100" autocomplete="${({first:'given-name',last:'family-name',email:'email',school:'organization'})[name]}"></label>`).join('')}</div>`; }
    function profilePage() { return header('Profil', '') + `<form class="profile-panel" id="profile-form"><div class="profile-banner"><span class="avatar" aria-hidden="true">${esc(initials())}</span><div><h2>${esc(fullName())}</h2><span class="badge accent">Učenec</span></div></div>${profileFields()}<p class="form-error" id="profile-error" role="alert"></p><div class="profile-footer"><a class="ui-button" href="index.html">${icon('logout')} Odjava</a><button class="ui-button primary" type="submit">Shrani spremembe</button></div></form>`; }
    let dialogTrigger;
    function showDialog(title, subtitle, content, actions = '') {
        const dialog = $('#dialog');
        if (!dialog.open) dialogTrigger = document.activeElement;
        dialog.innerHTML = `<div class="dialog-head"><div><h2 id="dialog-title">${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div><button class="icon-button" type="button" data-action="close" aria-label="Zapri">${icon('close')}</button></div><div class="dialog-body">${content}</div>${actions ? `<div class="dialog-actions">${actions}</div>` : ''}`;
        if (!dialog.open) dialog.showModal();
    }
    function closeDialog() { $('#dialog').close(); if (dialogTrigger?.isConnected) dialogTrigger.focus(); }
    function chooseSubjects() { showDialog('Izberite predmete', 'Označite predmete, ki jih želite imeti na seznamu.', `<div class="selection-list">${subjects.map(s => `<label class="selection-option"><img src="${imgSrc(s)}" alt=""><span>${esc(s.name)}</span><input type="checkbox" name="subject-choice" value="${s.id}" ${selected.includes(s.id) ? 'checked' : ''}></label>`).join('')}</div><p class="form-error" id="selection-error" role="alert"></p>`, button('Prekliči','close') + button('Shrani izbor','save-subjects','','primary')); }
    function saveSelection(next) { try { write('sessionStorage','edulink-subjects',next); selected = next; render(); return true; } catch { toast('Brskalnik ne dovoli shranjevanja izbora. Omogočite lokalno shrambo.'); return false; } }
    function openAssignment(id) {
        const a = assignments.find(a => a.id === id); if (!a) return;
        const saved = submissions[id];
        showDialog(a.title, `${subject(a.subject).name} · Rok oddaje: ${dateLabel(a.due)}`, `<p class="dialog-copy">${esc(a.description)}</p>${saved ? `<div class="submission-info">${icon('tick')}<div><strong>Oddano</strong><br>${esc(saved.name)}<br><span>${new Date(saved.savedAt).toLocaleString('sl-SI')}</span><br>${button('Prenesi svojo oddajo','download-submission',`data-id="${id}"`,'small quiet')}</div></div>` : ''}<form id="submission-form" data-id="${id}"><label class="upload-field">${icon('file')}<strong>${saved ? 'Izberite novo datoteko za zamenjavo' : 'Priložite svojo nalogo'}</strong><input type="file" id="submission-file" required aria-describedby="file-help"></label><p class="note" id="file-help">Največ 20 MB. Datoteka se shrani samo v tem brskalniku in je ne prejme učitelj. Ime bo »Priimek Ime -- Naslov naloge.ext«.</p><p class="form-error" id="submission-error" role="alert"></p><div class="inline-confirm" id="replace-confirm" hidden><p>Obstoječa oddaja bo zamenjana. Želite nadaljevati?</p>${button('Ne, ohrani obstoječo','cancel-replace','','small')} <button class="ui-button primary small" type="submit" name="replace" value="yes">Da, zamenjaj oddajo</button></div><div class="profile-footer"><span></span><button class="ui-button primary" type="submit" id="submit-file">${saved ? 'Zamenjaj oddajo' : 'Shrani oddajo'}</button></div></form>`);
    }
    function openMaterial(id) { const m = materials.find(m => m.id === id); if (!m) return; showDialog(m.title, `${subject(m.subject).name} · ${m.type}`, `<div class="material-content">${esc(m.content)}</div>`,button('Zapri','close')+button(`${icon('down')} Prenesi gradivo`,'download-material',`data-id="${id}"`,'primary')); }
    function download(blob, name) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    const safeFilename = value => value.replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').replace(/[. ]+$/g,'').slice(0,150);
    async function downloadMaterial(id) { const m = materials.find(m => m.id === id); if (m?.fileName) { const blob = await staff?.fileBlob(id); if (blob) { download(blob, m.fileName); return; } } if (m) download(new Blob([`${m.title}\n${subject(m.subject).name}\n\n${m.content}\n\nEduLink — vzorčno gradivo`], {type:'text/plain;charset=utf-8'}), `${safeFilename(m.title)}.txt`); }
    async function submitFile(e) {
        e.preventDefault();
        const form = e.target, id = form.dataset.id;
        const file = $('#submission-file').files[0]; const error = $('#submission-error');
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) { error.textContent = 'Datoteka je prevelika. Izberite datoteko do 20 MB.'; return; }
        if (submissions[id] && e.submitter?.value !== 'yes') { $('#replace-confirm').hidden = false; $('#submit-file').hidden = true; $('#replace-confirm button').focus(); return; }
        const a = assignments.find(a => a.id === id);
        const extension = file.name.includes('.') ? `.${file.name.split('.').pop().replace(/[^a-zA-Z0-9]/g,'').slice(0,12)}` : '';
        const record = {id, name:`${safeFilename(`${profile.last} ${profile.first} -- ${a.title}`)}${extension}`, savedAt:new Date().toISOString(), blob:file};
        form.querySelectorAll('button').forEach(b => b.disabled = true);
        try { await records('readwrite', store => store.put(record)); submissions[id] = record; closeDialog(); render(); toast('Oddaja je shranjena v tem brskalniku.'); }
        catch { error.textContent = 'Datoteke ni bilo mogoče shraniti. Preverite prostor in dovoljenja brskalnika ter poskusite znova.'; form.querySelectorAll('button').forEach(b => b.disabled = false); }
    }
    function authPage() {
        const registration = page === 'register';
        document.body.innerHTML = `<main class="auth-form-area"><a href="index.html"><img class="auth-logo" src="slike/edulink-logo.png" alt="EduLink"></a><form class="auth-form" id="auth-form"><h1>${registration ? 'Ustvari profil' : 'Prijava'}</h1><p>${registration ? 'Vnesite svoje podatke za predstavitveno učilnico.' : 'Vnesite uporabniško ime za vstop v učilnico.'}</p>${registration ? profileFields() : `<label class="field">Vloga<select name="role" id="role-select"><option value="ucenec">Učenec</option><option value="ucitelj">Učitelj</option><option value="admin">Administrator</option></select></label><label class="field" id="teacher-field" hidden>Učitelj<select name="teacher">${window.EduStaff.teachers().map(t => `<option value="${t.id}">${esc(t.first)} ${esc(t.last)}</option>`).join('')}</select></label><label class="field" id="username-field">Uporabniško ime<input name="username" placeholder="npr. ucenec" autocomplete="username"></label>`}<p class="note">Predstavitvena različica brez gesla. Podatki in oddaje ostanejo v tem brskalniku.</p><p id="auth-error" class="form-error" role="alert"></p><button class="ui-button primary" type="submit">${registration ? 'Ustvari profil in vstopi' : 'Vstopi'}</button><p class="auth-bottom">${registration ? 'Že imate profil? <a href="index.html">Prijava</a>' : 'Prvič tukaj? <a href="register.html">Ustvari profil</a>'}</p></form></main><div class="auth-visual" aria-hidden="true"></div>`;
    }
    document.addEventListener('click', e => {
        const el = e.target.closest('[data-action]'); if (!el) return;
        const id = el.dataset.id;
        switch (el.dataset.action) {
            case 'subjects': chooseSubjects(); break;
            case 'close': closeDialog(); break;
            case 'save-subjects': { const next = [...document.querySelectorAll('[name="subject-choice"]:checked')].map(input => input.value); if (!next.length) { $('#selection-error').textContent = 'Izberite vsaj en predmet.'; break; } if (saveSelection(next)) closeDialog(); break; }
            case 'remove-subject': saveSelection(selected.filter(value => value !== id)); toast('Predmet je skrit. Znova ga dodate z »Izberi predmete«.'); break;
            case 'add-subject': if (!selected.includes(id)) saveSelection([...selected,id]); break;
            case 'status': filter.status = id; render(); document.querySelector(`[data-action="status"][data-id="${id}"]`)?.focus(); break;
            case 'clear-filters': filter = {query:'',subject:'',status:'all',type:''}; render(); $('#search')?.focus(); break;
            case 'assignment': openAssignment(id); break;
            case 'material': openMaterial(id); break;
            case 'download-material': downloadMaterial(id); break;
            case 'download-submission': if (submissions[id]) download(submissions[id].blob,submissions[id].name); break;
            case 'cancel-replace': $('#replace-confirm').hidden = true; $('#submit-file').hidden = false; $('#submit-file').focus(); break;
            case 'month': month.setMonth(month.getMonth()+Number(el.dataset.step)); render(); document.querySelector(`[data-action="month"][data-step="${el.dataset.step}"]`)?.focus(); break;
            case 'today': month = new Date(new Date().getFullYear(),new Date().getMonth(),1); render(); break;
            default: if (isStaff) staff.action(el);
        }
    });
    document.addEventListener('input', e => { if (isStaff) { if (e.target.id === 'search') staff.onInput(e.target.value); return; } if (e.target.id === 'search') { filter.query = e.target.value; $('#results').innerHTML = page === 'naloge' ? assignmentResults() : materialResults(); } });
    document.addEventListener('change', e => {
        if (e.target.id === 'role-select') { $('#teacher-field').hidden = e.target.value !== 'ucitelj'; $('#username-field').hidden = e.target.value !== 'ucenec'; return; }
        if (isStaff) { if (e.target.id === 'subject-filter') staff.onFilter(e.target.value); return; }
        if (['subject-filter','type-filter'].includes(e.target.id)) { filter[e.target.id === 'subject-filter' ? 'subject' : 'type'] = e.target.value; $('#results').innerHTML = page === 'naloge' ? assignmentResults() : materialResults(); }
        if (e.target.id === 'submission-file') { $('#replace-confirm').hidden = true; $('#submit-file').hidden = false; $('#submission-error').textContent = ''; }
    });
    document.addEventListener('submit', e => {
        if (isStaff && staff.submit(e)) return;
        if (e.target.id === 'topbar-search') { e.preventDefault(); const q = $('#topbar-query').value.trim(); if (isStaff) location.href = staff.searchUrl(q); else if (page === 'naloge') { filter.query = q; render(); } else location.href = `naloge.html${q ? `?q=${encodeURIComponent(q)}` : ''}`; return; }
        if (e.target.id === 'submission-form') { submitFile(e); return; }
        if (!['profile-form','auth-form'].includes(e.target.id)) return;
        e.preventDefault();
        const isAuth = e.target.id === 'auth-form';
        try {
            if (!isAuth || page === 'register') {
                const values = Object.fromEntries(new FormData(e.target));
                if (!values.first?.trim() || !values.last?.trim()) throw new Error('Vnesite ime in priimek.');
                const next = Object.fromEntries(Object.entries(values).map(([k,v]) => [k,v.trim()]));
                write('localStorage','edulink-profile',next); profile = next;
            }
            if (isAuth) {
                const chosen = page === 'register' ? 'ucenec' : (new FormData(e.target).get('role') || 'ucenec');
                sessionStorage.setItem('edulink-role', chosen);
                if (chosen === 'ucitelj') sessionStorage.setItem('edulink-teacher', new FormData(e.target).get('teacher'));
                write('sessionStorage','edulink-subjects',[]); location.href = 'domov.html';
            }
            else { render(); toast('Profil je shranjen.'); }
        } catch (error) { $(isAuth ? '#auth-error' : '#profile-error').textContent = error.message === 'Vnesite ime in priimek.' ? error.message : 'Shranjevanje ni na voljo. Omogočite lokalno shrambo brskalnika.'; }
    });
    if (['login','register'].includes(page)) { authPage(); return; }
    if (isStaff && !staff.hasPage(role, page)) { location.replace('domov.html'); return; }
    // Učitelj z enim samim predmetom nima izbire: vedno pristane neposredno na strani predmeta.
    const onlySubject = role === 'ucitelj' && staff.mySubjects().length === 1 ? staff.mySubjects()[0] : null;
    if (onlySubject && page === 'ucilnica') { location.replace(`predmet.html?predmet=${onlySubject.id}`); return; }
    window.EduUI = {$, esc, icon, button, header, empty, toast, showDialog, closeDialog, render, download, safeFilename, plural, fullName, submissions: () => submissions};
    shell(); render();
    records('readonly', store => store.getAll()).then(rows => { submissions = Object.fromEntries(rows.map(row => [row.id,row])); render(); }).catch(() => toast('Lokalna shramba ni na voljo. Oddaj trenutno ni mogoče shraniti.'));
})();
