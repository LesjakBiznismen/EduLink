/* Pogleda za administratorja in učitelja. Podatki so v localStorage (store.js), nič se ne pošilja na strežnik. */
(() => {
    'use strict';
    const store = window.EduStore, st = store.state, D = window.EduData;
    const ui = () => window.EduUI;
    const esc = value => ui().esc(value);
    const PER_PAGE = 20;
    const safeGet = key => { try { return sessionStorage.getItem(key); } catch { return null; } };
    const role = () => ['ucitelj', 'admin'].includes(safeGet('edulink-role')) ? safeGet('edulink-role') : 'ucenec';
    const me = () => st.teachers.find(t => t.id === safeGet('edulink-teacher')) || st.teachers[0];
    const full = p => `${p.first} ${p.last}`;
    const initials = p => `${p.first?.[0] || ''}${p.last?.[0] || ''}`.toUpperCase();
    const imgSrc = s => `slike/predmeti/${s.image}${s.image.includes('.') ? '' : '.png'}`;
    const sub = id => st.subjects.find(s => s.id === id);
    const subjectNames = ids => ids.map(id => sub(id)?.name).filter(Boolean).join(', ');
    const dateLabel = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('sl-SI', {day: 'numeric', month: 'short'});
    const dateTime = iso => new Date(iso).toLocaleString('sl-SI', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
    const localIso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hash = text => { let h = 0; for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
    const pageName = () => document.body.dataset.page || 'ucilnica';
    let view = {q: new URLSearchParams(location.search).get('q') || '', page: 1, subject: ''};

    const routes = r => r === 'admin'
        ? [['ucilnica', 'domov.html', 'Predmeti', 'grid'], ['ucitelji', 'ucitelji.html', 'Učitelji', 'user'], ['ucenci', 'ucenci.html', 'Učenci', 'users']]
        : [['ucilnica', 'domov.html', 'Predmeti', 'grid'], ['naloge', 'naloge.html', 'Oddaje', 'check'], ['gradiva', 'gradiva.html', 'Gradiva', 'folder']];
    const pagesFor = r => r === 'admin' ? ['ucilnica', 'ucitelji', 'ucenci'] :['ucilnica', 'predmet', 'naloge', 'gradiva', 'profil'];
    const hasPage = (r, page) => pagesFor(r).includes(page);
    const identity = () => role() === 'admin' ? {name: 'Administrator', initials: 'AD', label: 'Administrator'} : {name: full(me()), initials: initials(me()), label: 'Učitelj'};
    const mySubjects = () => st.subjects.filter(s => me().subjects.includes(s.id));
    const myIds = () => mySubjects().map(s => s.id);
    const placeholder = () => role() === 'admin' ? 'Poišči učenca' : 'Poišči oddajo';
    const searchUrl = q => `${role() === 'admin' ? 'ucenci' : 'naloge'}.html${q ? `?q=${encodeURIComponent(q)}` : ''}`;

    // ---------- Skupne sestavine ----------
    const btn = (text, action, extra = '', cls = '') => ui().button(text, action, extra, cls);
    const checkList = (items, checkedIds, name = 'rel') => `<div class="check-grid">${items.map(i => `<label class="selection-option"><span>${esc(i.label)}</span><input type="checkbox" name="${name}" value="${i.id}" ${checkedIds.includes(i.id) ? 'checked' : ''}></label>`).join('')}</div>`;
    function paged(items) {
        const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
        view.page = Math.min(Math.max(1, view.page), pages);
        return {slice: items.slice((view.page - 1) * PER_PAGE, view.page * PER_PAGE), pages, total: items.length};
    }
    const pager = p => p.total > PER_PAGE ? `<div class="pager"><span>${(view.page - 1) * PER_PAGE + 1}–${Math.min(view.page * PER_PAGE, p.total)} od ${p.total}</span><div class="row-actions">${btn('Prejšnja', 'st-page', `data-step="-1" ${view.page <= 1 ? 'disabled' : ''}`, 'small')}${btn('Naslednja', 'st-page', `data-step="1" ${view.page >= p.pages ? 'disabled' : ''}`, 'small')}</div></div>` : '';
    const searchBox = label => `<div class="toolbar"><label class="search-field">${ui().icon('search')}<input id="search" type="search" aria-label="${label}" placeholder="${label}" value="${esc(view.q)}"></label></div>`;
    const emptyList = (title, copy) => ui().empty(title, copy);

    // ---------- Administrator: predmeti ----------
    function adminSubjects() {
        const rows = st.subjects.map(s => {
            const teachers = st.teachers.filter(t => t.subjects.includes(s.id));
            const students = st.students.filter(x => x.subjects.includes(s.id)).length;
            return `<tr><td><div class="file-name"><img class="table-thumb" src="${imgSrc(s)}" alt=""><strong>${esc(s.name)}</strong></div></td><td class="optional-column">${esc(teachers.map(full).join(', ')) || '—'}</td><td class="optional-column">${students}</td><td><div class="row-actions">${btn('Uredi', 'st-subject-edit', `data-id="${s.id}"`, 'small')}${btn('Izbriši', 'st-delete', `data-kind="subjects" data-id="${s.id}"`, 'small')}</div></td></tr>`;
        }).join('');
        return ui().header('Predmeti', '', btn(`${ui().icon('plus')} Dodaj predmet`, 'st-subject-new', '', 'primary'))
            + `<div class="list-surface"><table class="file-table"><thead><tr><th scope="col">Predmet</th><th class="optional-column" scope="col">Učitelji</th><th class="optional-column" scope="col">Učenci</th><th scope="col"><span class="sr-only">Dejanja</span></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    const imageOptions = [['matematika', 'Matematika'], ['slovenscina', 'Slovenščina'], ['anglescina', 'Angleščina'], ['programiranje', 'Programiranje'], ['rps', 'Računalniški produkti'], ['splet', 'Splet'], ['smv', 'Moderne vsebine'], ['sociologija', 'Sociologija'], ['baze', 'Podatkovne baze'], ['privzeto.svg', 'Privzeta slika']];
    function subjectDialog(id) {
        const s = id ? sub(id) : null;
        const teacherIds = s ? st.teachers.filter(t => t.subjects.includes(s.id)).map(t => t.id) : [];
        ui().showDialog(s ? 'Uredi predmet' : 'Nov predmet', '', `<form id="st-subject-form" data-id="${s?.id || ''}"><div class="form-grid"><label class="field">Ime predmeta<input name="name" required maxlength="80" value="${esc(s?.name || '')}"></label><label class="field">Slika<select name="image">${imageOptions.map(([v, l]) => `<option value="${v}" ${(s?.image || 'privzeto.svg') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label><fieldset class="field-set"><legend>Učitelji, ki poučujejo predmet</legend>${checkList(st.teachers.map(t => ({id: t.id, label: full(t)})), teacherIds)}</fieldset><p class="form-error" id="st-error" role="alert"></p></div></form>`,
            btn('Prekliči', 'close') + '<button class="ui-button primary" type="submit" form="st-subject-form">Shrani</button>');
    }
    function saveSubject(form) {
        const values = new FormData(form), name = String(values.get('name')).trim(), checked = values.getAll('rel');
        const error = ui().$('#st-error');
        if (!name) { error.textContent = 'Vnesite ime predmeta.'; return; }
        if (!checked.length) { error.textContent = 'Izberite vsaj enega učitelja.'; return; }
        let id = form.dataset.id;
        if (id) Object.assign(sub(id), {name, image: values.get('image')});
        else {
            const base = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'predmet';
            id = base; let n = 2; while (sub(id)) id = `${base}-${n++}`;
            st.subjects.push({id, name, image: values.get('image')});
        }
        st.teachers.forEach(t => { t.subjects = t.subjects.filter(x => x !== id); if (checked.includes(t.id)) t.subjects.push(id); });
        store.save(); ui().closeDialog(); ui().render(); ui().toast('Predmet je shranjen.');
    }

    // ---------- Administrator: učitelji in učenci ----------
    const kindInfo = {
        teachers: {title: 'Učitelji', add: 'Dodaj učitelja', search: 'Poišči učitelja', one: 'učitelja', min: 1, minText: 'Izberite vsaj en predmet.'},
        students: {title: 'Učenci', add: 'Dodaj učenca', search: 'Poišči učenca', one: 'učenca', min: 2, minText: 'Učenec mora obiskovati vsaj dva predmeta.'}
    };
    function peopleResults(kind) {
        const q = view.q.toLocaleLowerCase('sl');
        const items = st[kind].filter(p => `${full(p)} ${p.email}`.toLocaleLowerCase('sl').includes(q));
        if (!items.length) return emptyList('Ni zadetkov', 'Poskusite drug iskalni izraz.');
        const pg = paged(items);
        return `<div class="list-surface"><table class="file-table"><thead><tr><th scope="col">Ime in priimek</th><th class="optional-column" scope="col">E-naslov</th><th class="optional-column" scope="col">Predmeti</th><th scope="col"><span class="sr-only">Dejanja</span></th></tr></thead><tbody>${pg.slice.map(p => `<tr><td><div class="file-name"><span class="avatar" aria-hidden="true">${esc(initials(p))}</span><strong>${esc(full(p))}</strong></div></td><td class="optional-column">${esc(p.email)}</td><td class="optional-column">${esc(subjectNames(p.subjects))}</td><td><div class="row-actions">${btn('Uredi', 'st-person-edit', `data-kind="${kind}" data-id="${p.id}"`, 'small')}${btn('Izbriši', 'st-delete', `data-kind="${kind}" data-id="${p.id}"`, 'small')}</div></td></tr>`).join('')}</tbody></table></div>${pager(pg)}`;
    }
    const adminPeople = kind => ui().header(kindInfo[kind].title, '', btn(`${ui().icon('plus')} ${kindInfo[kind].add}`, 'st-person-new', `data-kind="${kind}"`, 'primary')) + searchBox(kindInfo[kind].search) + `<div id="results">${peopleResults(kind)}</div>`;
    function personDialog(kind, id) {
        const p = id ? st[kind].find(x => x.id === id) : null, info = kindInfo[kind];
        ui().showDialog(p ? `Uredi ${info.one}` : info.add, '', `<form id="st-person-form" data-kind="${kind}" data-id="${p?.id || ''}"><div class="form-grid"><div class="profile-fields"><label class="field">Ime<input name="first" required maxlength="60" value="${esc(p?.first || '')}"></label><label class="field">Priimek<input name="last" required maxlength="60" value="${esc(p?.last || '')}"></label></div><label class="field">E-naslov<input name="email" type="email" maxlength="120" value="${esc(p?.email || '')}"></label><fieldset class="field-set"><legend>${kind === 'teachers' ? 'Predmeti, ki jih poučuje' : 'Predmeti, ki jih obiskuje'}</legend>${checkList(st.subjects.map(s => ({id: s.id, label: s.name})), p?.subjects || [])}</fieldset><p class="form-error" id="st-error" role="alert"></p></div></form>`,
            btn('Prekliči', 'close') + '<button class="ui-button primary" type="submit" form="st-person-form">Shrani</button>');
    }
    function savePerson(form) {
        const kind = form.dataset.kind, info = kindInfo[kind], values = new FormData(form), error = ui().$('#st-error');
        const first = String(values.get('first')).trim(), last = String(values.get('last')).trim(), subjects = values.getAll('rel');
        if (!first || !last) { error.textContent = 'Vnesite ime in priimek.'; return; }
        if (subjects.length < info.min) { error.textContent = info.minText; return; }
        const email = String(values.get('email')).trim();
        if (form.dataset.id) Object.assign(st[kind].find(x => x.id === form.dataset.id), {first, last, email, subjects});
        else {
            const prefix = kind === 'teachers' ? 't' : 's';
            let n = st[kind].length + 1; while (st[kind].some(x => x.id === `${prefix}${n}`)) n++;
            st[kind].push({id: `${prefix}${n}`, first, last, email, subjects});
        }
        store.save(); ui().closeDialog(); ui().render(); ui().toast('Shranjeno.');
    }
    function confirmDelete(kind, id) {
        const item = kind === 'subjects' ? sub(id) : st[kind].find(x => x.id === id);
        if (!item) return;
        const name = kind === 'subjects' ? item.name : full(item);
        ui().showDialog('Izbris', '', `<p class="dialog-copy">Želite izbrisati »${esc(name)}«?${kind === 'subjects' ? ' Predmet bo odstranjen tudi pri učiteljih in učencih.' : ''} Tega ni mogoče razveljaviti.</p>`,
            btn('Prekliči', 'close') + btn('Izbriši', 'st-delete-do', `data-kind="${kind}" data-id="${id}"`, 'primary'));
    }
    function doDelete(kind, id) {
        if (kind === 'subjects') {
            st.subjects = st.subjects.filter(s => s.id !== id);
            [...st.teachers, ...st.students].forEach(p => { p.subjects = p.subjects.filter(x => x !== id); });
        } else st[kind] = st[kind].filter(x => x.id !== id);
        store.save(); ui().closeDialog(); ui().render(); ui().toast('Izbrisano.');
    }

    // ---------- Učitelj: oddaje ----------
    function submissionsFor(a) {
        const rows = st.students.filter(s => s.subjects.includes(a.subject)).map(s => {
            const h = hash(s.id + a.id), d = new Date(`${a.due}T12:00:00`);
            d.setDate(d.getDate() - 1 - (h % 4)); d.setHours(8 + (h % 10), (h % 6) * 10);
            return {key: `${s.id}|${a.id}`, who: full(s), submitted: h % 10 < 6, savedAt: d.toISOString(), name: `${s.last} ${s.first} -- ${a.title}`, assignment: a, demo: false};
        });
        const real = ui().submissions()[a.id];
        if (real) rows.unshift({key: `demo|${a.id}`, who: `${ui().fullName()} (demo učenec)`, submitted: true, savedAt: real.savedAt, name: real.name, blob: real.blob, assignment: a, demo: true});
        return rows.sort((x, y) => Number(y.submitted) - Number(x.submitted) || y.savedAt.localeCompare(x.savedAt));
    }
    const mySubmissions = () => D.assignments.filter(a => myIds().includes(a.subject)).flatMap(a => submissionsFor(a).filter(r => r.submitted));
    function findSubmission(key) { const [, aid] = key.split('|'), a = D.assignments.find(x => x.id === aid); return a && submissionsFor(a).find(r => r.key === key); }
    function downloadSubmission(key) {
        const r = findSubmission(key); if (!r) return;
        ui().download(r.blob || new Blob([`Oddaja učenca: ${r.who}\nNaloga: ${r.assignment.title}\nOddano: ${dateTime(r.savedAt)}\n\nVzorčna oddaja za predstavitev.`], {type: 'text/plain;charset=utf-8'}), `${ui().safeFilename(r.name)}${r.blob ? '' : '.txt'}`);
    }
    const downloadButton = r => `<button class="icon-button" type="button" data-action="st-download" data-key="${r.key}" aria-label="Prenesi oddajo: ${esc(r.who)}">${ui().icon('down')}</button>`;
    function submissionGroup(a, open) {
        const rows = submissionsFor(a), done = rows.filter(r => r.submitted).length;
        return `<details class="submission-group" ${open ? 'open' : ''}><summary><span class="row-title">${esc(a.title)}<span class="row-sep" aria-hidden="true">|</span><time class="row-date" datetime="${a.due}">${dateLabel(a.due)}</time><span class="row-sep" aria-hidden="true">|</span><span class="row-status">${done} / ${rows.length} oddanih</span></span></summary><div class="list-surface"><table class="file-table"><thead><tr><th scope="col">Učenec</th><th scope="col">Status</th><th class="optional-column" scope="col">Oddano</th><th scope="col"><span class="sr-only">Prenos</span></th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.who)}</td><td>${r.submitted ? `<span class="badge done">${ui().icon('tick')}Oddano</span>` : '<span class="badge">Ni oddano</span>'}</td><td class="optional-column">${r.submitted ? dateTime(r.savedAt) : '—'}</td><td>${r.submitted ? downloadButton(r) : ''}</td></tr>`).join('')}</tbody></table></div></details>`;
    }
    function submissionsResults() {
        const q = view.q.toLocaleLowerCase('sl');
        const items = mySubmissions().filter(r => (!view.subject || r.assignment.subject === view.subject) && `${r.who} ${r.assignment.title}`.toLocaleLowerCase('sl').includes(q)).sort((x, y) => y.savedAt.localeCompare(x.savedAt));
        if (!items.length) return emptyList('Ni oddaj', 'Za izbrani predmet ali iskalni izraz ni oddanih nalog.');
        const pg = paged(items);
        return `<div class="list-surface"><table class="file-table"><thead><tr><th scope="col">Učenec</th><th scope="col">Naloga</th><th class="optional-column" scope="col">Predmet</th><th class="optional-column" scope="col">Oddano</th><th scope="col"><span class="sr-only">Prenos</span></th></tr></thead><tbody>${pg.slice.map(r => `<tr><td>${esc(r.who)}</td><td>${esc(r.assignment.title)}</td><td class="optional-column">${esc(sub(r.assignment.subject)?.name || '')}</td><td class="optional-column">${dateTime(r.savedAt)}</td><td>${downloadButton(r)}</td></tr>`).join('')}</tbody></table></div>${pager(pg)}`;
    }
    const subjectFilter = () => `<div class="filters"><select id="subject-filter" aria-label="Filtriraj po predmetu"><option value="">Vsi moji predmeti</option>${mySubjects().map(s => `<option value="${s.id}" ${view.subject === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>`;
    const teacherSubmissions = () => ui().header('Oddaje', '') + (mySubjects().length ? `<div class="toolbar"><label class="search-field">${ui().icon('search')}<input id="search" type="search" aria-label="Poišči oddajo" placeholder="Poišči oddajo" value="${esc(view.q)}"></label>${subjectFilter()}</div><div id="results">${submissionsResults()}</div>` : emptyList('Nimate predmetov', 'Administrator vam še ni dodelil predmeta.'));

    // ---------- Učitelj: predmeti in gradiva ----------
    const subjectCard = s => `<article class="predmet"><img class="predmet-slika" src="${imgSrc(s)}" alt=""><div class="predmet-vsebina"><h2 class="predmet-ime"><a class="subject-card-link" href="predmet.html?predmet=${s.id}">${esc(s.name)}</a></h2></div></article>`;
    const teacherHome = () => ui().header('Predmeti', '') + (mySubjects().length ? `<div class="predmeti">${mySubjects().map(subjectCard).join('')}</div>` : emptyList('Nimate predmetov', 'Administrator vam še ni dodelil predmeta.'));
    const materialRow = m => `<div class="file-row"><span class="file-symbol">${ui().icon('file')}</span><button class="file-title" type="button" data-action="material" data-id="${m.id}">${esc(m.title)}<span class="file-subject">${m.type} · ${dateLabel(m.added)}</span></button><button class="icon-button" type="button" data-action="download-material" data-id="${m.id}" aria-label="Prenesi ${esc(m.title)}">${ui().icon('down')}</button><button class="icon-button" type="button" data-action="st-material-delete" data-id="${m.id}" aria-label="Izbriši ${esc(m.title)}">${ui().icon('trash')}</button></div>`;
    function teacherSubject() {
        const id = new URLSearchParams(location.search).get('predmet'), s = sub(id);
        if (!s || !myIds().includes(id)) return emptyList('Predmeta ne poučujete', 'Odprite enega od svojih predmetov.');
        document.title = `${s.name} · EduLink`;
        const students = st.students.filter(x => x.subjects.includes(id)).length;
        const assignments = D.assignments.filter(a => a.subject === id).sort((a, b) => a.due.localeCompare(b.due));
        const mats = D.materials.filter(m => m.subject === id);
        return `<section class="subject-intro"><img src="${imgSrc(s)}" alt=""><div><h1>${esc(s.name)}</h1><div class="teacher-line"><span>${ui().plural(students, 'učenec', 'učenca', 'učenci', 'učencev')}</span></div></div></section>
            <div class="subject-columns"><section><div class="section-title"><h2>Naloge</h2>${btn(`${ui().icon('plus')} Dodaj nalogo`, 'st-assignment-new', `data-subject="${id}"`, 'small primary')}</div>${assignments.map((a, i) => submissionGroup(a, i === 0)).join('')}</section>
            <section><div class="section-title"><h2>Gradiva</h2>${btn(`${ui().icon('plus')} Naloži`, 'st-material-new', `data-subject="${id}"`, 'small primary')}</div>${mats.length ? `<div class="list-surface">${mats.map(materialRow).join('')}</div>` : emptyList('Ni gradiv', 'Naložite prvo gradivo za ta predmet.')}</section></div>`;
    }
    function materialsResults() {
        const items = D.materials.filter(m => myIds().includes(m.subject) && (!view.subject || m.subject === view.subject));
        if (!items.length) return emptyList('Ni gradiv', 'Naložite gradivo za enega od svojih predmetov.');
        return `<div class="list-surface"><table class="file-table"><thead><tr><th scope="col">Ime gradiva</th><th class="optional-column" scope="col">Predmet</th><th class="optional-column" scope="col">Vrsta</th><th class="optional-column" scope="col">Dodano</th><th scope="col"><span class="sr-only">Dejanja</span></th></tr></thead><tbody>${items.map(m => `<tr><td><div class="file-name"><span class="file-symbol">${ui().icon('file')}</span><button class="file-title" type="button" data-action="material" data-id="${m.id}">${esc(m.title)}</button></div></td><td class="optional-column">${esc(sub(m.subject)?.name || '')}</td><td class="optional-column"><span class="badge">${m.type}</span></td><td class="optional-column">${dateLabel(m.added)}</td><td><div class="row-actions"><button class="icon-button" type="button" data-action="download-material" data-id="${m.id}" aria-label="Prenesi ${esc(m.title)}">${ui().icon('down')}</button>${btn('Izbriši', 'st-material-delete', `data-id="${m.id}"`, 'small')}</div></td></tr>`).join('')}</tbody></table></div>`;
    }
    const teacherMaterials = () => ui().header('Gradiva', '', mySubjects().length ? btn(`${ui().icon('plus')} Naloži gradivo`, 'st-material-new', '', 'primary') : '') + (mySubjects().length ? `<div class="toolbar">${subjectFilter()}</div><div id="results">${materialsResults()}</div>` : emptyList('Nimate predmetov', 'Administrator vam še ni dodelil predmeta.'));
    function materialDialog(subjectId) {
        ui().showDialog('Naloži gradivo', 'Gradivo bo takoj vidno učencem.', `<form id="st-material-form"><div class="form-grid"><label class="field">Predmet<select name="subject" required>${mySubjects().map(s => `<option value="${s.id}" ${s.id === subjectId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label><label class="field">Vrsta<select name="type"><option>Zapiski</option><option>Vaje</option></select></label><label class="field">Naslov (neobvezno)<input name="title" maxlength="120" placeholder="Če ostane prazno, se uporabi ime datoteke"></label><label class="upload-field">${ui().icon('file')}<strong>Izberite datoteko</strong><input type="file" name="file" id="material-file" accept="${ACCEPT}" required></label><p class="note">Dovoljeni formati: PDF, Word (doc, docx), PowerPoint (ppt, pptx) in slike (png, jpg, gif, webp). Največ 20 MB.</p><p class="form-error" id="st-error" role="alert"></p></div></form>`,
            btn('Prekliči', 'close') + '<button class="ui-button primary" type="submit" form="st-material-form">Naloži</button>');
    }
    // Dovoljene so samo predstavitve, dokumenti in slike v osnovnih formatih.
    const ALLOWED = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
    const ACCEPT = ALLOWED.map(e => `.${e}`).join(',');
    const extensionOf = name => (name.includes('.') ? name.split('.').pop() : '').toLowerCase();
    // Datoteke so v IndexedDB (localStorage je premajhen); v localStorage ostanejo samo podatki o gradivu.
    let filesDb;
    const files = () => filesDb || (filesDb = new Promise((resolve, reject) => {
        const request = indexedDB.open('edulink-files', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('files');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    }));
    const filesTx = async (mode, run) => {
        const db = await files();
        return new Promise((resolve, reject) => { const tx = db.transaction('files', mode), req = run(tx.objectStore('files')); tx.oncomplete = () => resolve(req.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });
    };
    const fileBlob = id => filesTx('readonly', s => s.get(id)).catch(() => null);
    async function saveMaterial(form) {
        const values = new FormData(form), file = values.get('file'), error = ui().$('#st-error');
        if (!file?.size && !file?.name) { error.textContent = 'Izberite datoteko.'; return; }
        const ext = extensionOf(file.name);
        if (!ALLOWED.includes(ext)) { error.textContent = 'Dovoljene so samo datoteke PDF, Word (doc, docx), PowerPoint (ppt, pptx) in slike (png, jpg, gif, webp).'; return; }
        if (file.size > 20 * 1024 * 1024) { error.textContent = 'Datoteka je prevelika. Izberite datoteko do 20 MB.'; return; }
        const id = `m-${Date.now()}`;
        try { await filesTx('readwrite', s => s.put(file, id)); } catch { error.textContent = 'Datoteke ni bilo mogoče shraniti. Preverite prostor in dovoljenja brskalnika.'; return; }
        const kind = ext === 'pdf' ? 'PDF' : ['doc', 'docx'].includes(ext) ? 'Word' : ['ppt', 'pptx'].includes(ext) ? 'PowerPoint' : 'Slika';
        const material = {id, subject: values.get('subject'), title: String(values.get('title')).trim() || file.name.replace(/\.[^.]+$/, ''), type: values.get('type'), content: `Priložena datoteka: ${file.name} (${kind}, ${Math.max(1, Math.round(file.size / 1024))} kB).`, added: localIso(), by: me().id, fileName: file.name};
        st.materials.push(material); D.materials.push(material);
        store.save(); ui().closeDialog(); ui().render(); ui().toast('Gradivo je naloženo.');
    }
    function assignmentDialog(subjectId) {
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 7);
        ui().showDialog('Nova naloga', sub(subjectId)?.name || '', `<form id="st-assignment-form" data-subject="${subjectId}"><div class="form-grid"><label class="field">Naslov<input name="title" required maxlength="120"></label><label class="field">Navodila<textarea name="description" rows="4" maxlength="1000"></textarea></label><label class="field">Rok oddaje<input name="due" type="date" required value="${localIso(tomorrow)}" min="${localIso()}"></label><p class="form-error" id="st-error" role="alert"></p></div></form>`,
            btn('Prekliči', 'close') + '<button class="ui-button primary" type="submit" form="st-assignment-form">Dodaj nalogo</button>');
    }
    function saveAssignment(form) {
        const values = new FormData(form), title = String(values.get('title')).trim(), due = String(values.get('due')), error = ui().$('#st-error');
        if (!title) { error.textContent = 'Vnesite naslov naloge.'; return; }
        if (!due) { error.textContent = 'Izberite rok oddaje.'; return; }
        const assignment = {id: `a-${Date.now()}`, subject: form.dataset.subject, title, description: String(values.get('description')).trim() || 'Navodila za nalogo bo dodal učitelj.', due};
        st.assignments.push(assignment); D.assignments.push(assignment);
        store.save(); ui().closeDialog(); ui().render(); ui().toast('Naloga je dodana.');
    }
    function confirmMaterialDelete(id) {
        const m = D.materials.find(x => x.id === id); if (!m) return;
        ui().showDialog('Izbris gradiva', '', `<p class="dialog-copy">Želite izbrisati gradivo »${esc(m.title)}«? Učenci ga ne bodo več videli.</p>`, btn('Prekliči', 'close') + btn('Izbriši', 'st-material-delete-do', `data-id="${id}"`, 'primary'));
    }
    function deleteMaterial(id) {
        const i = D.materials.findIndex(x => x.id === id); if (i >= 0) D.materials.splice(i, 1);
        filesTx('readwrite', s => s.delete(id)).catch(() => {});
        if (st.materials.some(m => m.id === id)) st.materials = st.materials.filter(m => m.id !== id);
        else if (!st.removedMaterials.includes(id)) st.removedMaterials.push(id);
        store.save(); ui().closeDialog(); ui().render(); ui().toast('Gradivo je izbrisano.');
    }

    // ---------- Profil ----------
    function profile() {
        const who = identity(), t = role() === 'ucitelj' ? me() : null;
        const banner = `<div class="profile-banner"><span class="avatar" aria-hidden="true">${esc(who.initials)}</span><div><h2>${esc(who.name)}</h2><span class="badge accent">${who.label}</span></div></div>`;
        const logout = `<a class="ui-button" href="index.html">${ui().icon('logout')} Odjava</a>`;
        if (!t) return ui().header('Profil', '') + `<div class="profile-panel">${banner}<p class="note">${st.subjects.length} predmetov · ${st.teachers.length} učiteljev · ${st.students.length} učencev</p><div class="profile-footer">${logout}</div></div>`;
        const fields = [['first', 'Ime', 'text', true, 'given-name'], ['last', 'Priimek', 'text', true, 'family-name'], ['email', 'E-naslov', 'email', false, 'email'], ['phone', 'Telefon', 'tel', false, 'tel'], ['title', 'Naziv', 'text', false, 'honorific-prefix'], ['office', 'Kabinet', 'text', false, 'off'], ['school', 'Šola', 'text', false, 'organization']];
        return ui().header('Profil', '') + `<form class="profile-panel" id="st-profile-form">${banner}<div class="profile-fields">${fields.map(([name, label, type, req, ac]) => `<label class="field">${label}<input name="${name}" type="${type}" value="${esc(t[name] || '')}" maxlength="100" autocomplete="${ac}" ${req ? 'required' : ''}></label>`).join('')}<div class="field">Predmeti, ki jih poučujete<span class="field-value">${esc(subjectNames(t.subjects)) || '—'}</span></div></div><p class="form-error" id="st-error" role="alert"></p><div class="profile-footer">${logout}<button class="ui-button primary" type="submit">Shrani spremembe</button></div></form>`;
    }
    function saveProfile(form) {
        const v = Object.fromEntries([...new FormData(form)].map(([k, x]) => [k, String(x).trim()]));
        if (!v.first || !v.last) { ui().$('#st-error').textContent = 'Vnesite ime in priimek.'; return; }
        Object.assign(me(), v); store.save(); ui().render(); ui().toast('Profil je shranjen.');
    }

    // ---------- Vstopne točke za app.js ----------
    const renderers = {
        admin: {ucilnica: adminSubjects, ucitelji: () => adminPeople('teachers'), ucenci: () => adminPeople('students'), profil: profile},
        ucitelj: {ucilnica: teacherHome, predmet: teacherSubject, naloge: teacherSubmissions, gradiva: teacherMaterials, profil: profile}
    };
    const render = page => (renderers[role()][page] || renderers[role()].ucilnica)();
    function resultsHtml() {
        const page = pageName();
        if (page === 'ucitelji') return peopleResults('teachers');
        if (page === 'ucenci') return peopleResults('students');
        if (page === 'naloge') return submissionsResults();
        return materialsResults();
    }
    const refreshResults = () => { const el = ui().$('#results'); if (el) el.innerHTML = resultsHtml(); };
    function action(el) {
        const d = el.dataset;
        switch (d.action) {
            case 'st-subject-new': subjectDialog(); return true;
            case 'st-subject-edit': subjectDialog(d.id); return true;
            case 'st-person-new': personDialog(d.kind); return true;
            case 'st-person-edit': personDialog(d.kind, d.id); return true;
            case 'st-delete': confirmDelete(d.kind, d.id); return true;
            case 'st-delete-do': doDelete(d.kind, d.id); return true;
            case 'st-page': view.page += Number(d.step); refreshResults(); return true;
            case 'st-material-new': materialDialog(d.subject); return true;
            case 'st-assignment-new': assignmentDialog(d.subject); return true;
            case 'st-material-delete': confirmMaterialDelete(d.id); return true;
            case 'st-material-delete-do': deleteMaterial(d.id); return true;
            case 'st-download': downloadSubmission(d.key); return true;
            default: return false;
        }
    }
    function submit(e) {
        const id = e.target.id;
        if (!['st-subject-form', 'st-person-form', 'st-material-form', 'st-assignment-form', 'st-profile-form'].includes(id)) return false;
        e.preventDefault();
        if (id === 'st-profile-form') saveProfile(e.target);
        else if (id === 'st-assignment-form') saveAssignment(e.target);
        else if (id === 'st-subject-form') saveSubject(e.target);
        else if (id === 'st-person-form') savePerson(e.target);
        else saveMaterial(e.target);
        return true;
    }
    function onInput(value) { view.q = value; view.page = 1; refreshResults(); }
    function onFilter(value) { view.subject = value; view.page = 1; refreshResults(); }
    window.EduStaff = {fileBlob, role, identity, routes, hasPage, render, action, submit, onInput, onFilter, placeholder, searchUrl, mySubjects, teachers: () => st.teachers, query: () => view.q};
})();
