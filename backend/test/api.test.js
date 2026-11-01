import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, test } from 'node:test'

// Testi potrebujejo zagnan PostgreSQL (docker compose up -d db) in DATABASE_URL (npm test prebere backend/.env).
// Vsak zagon dobi svojo shemo v bazi (DB_SCHEMA) s svežimi testnimi podatki in mapo za datoteke v začasni mapi;
// po testih se shema izbriše, zato ne posegamo v podatke aplikacije.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'edulink-test-'))
process.env.JWT_SECRET ??= 'testna-skrivnost'
process.env.DB_SCHEMA = `t_${crypto.randomBytes(6).toString('hex')}`
process.env.SEED = 'true'
process.env.UPLOAD_DIR = path.join(tmp, 'uploads')
process.env.STATIC_DIR = path.join(tmp, 'dist')

const { app } = await import('../src/app.js')
const { dropSchema, pool } = await import('../src/db.js')

let server
let base
before(async () => {
  server = app.listen(0)
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}/api`
})
after(async () => {
  await new Promise(resolve => server.close(resolve))
  await dropSchema()
  await pool.end()
  fs.rmSync(tmp, { recursive: true, force: true })
})

async function call(method, url, { token, body, form } = {}) {
  const headers = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (body) headers['content-type'] = 'application/json'
  const res = await fetch(base + url, { method, headers, body: form ?? (body && JSON.stringify(body)) })
  const type = res.headers.get('content-type') || ''
  const data = type.includes('json') ? await res.json() : await res.text()
  return { status: res.status, data }
}

const login = async username => (await call('POST', '/auth/login', { body: { username, password: 'edulink123' } })).data.token

describe('avtentikacija', () => {
  test('prijava s testnim geslom vrne žeton in vlogo', async () => {
    const { status, data } = await call('POST', '/auth/login', { body: { username: 'admin', password: 'edulink123' } })
    assert.equal(status, 200)
    assert.equal(data.user.role, 'admin')
    assert.ok(data.token)
  })

  test('napačno geslo vrne 401', async () => {
    const { status } = await call('POST', '/auth/login', { body: { username: 'admin', password: 'napacno' } })
    assert.equal(status, 401)
  })

  test('zaščitene poti zahtevajo žeton', async () => {
    assert.equal((await call('GET', '/subjects')).status, 401)
  })

  test('registracija ustvari učenca, ki se lahko prijavi', async () => {
    const body = { first: 'Test', last: 'Učenec', email: 'test.ucenec@dijak.sola.si', username: 'test.ucenec', password: 'geslo1234', school: 'Testna šola' }
    const reg = await call('POST', '/auth/register', { body })
    assert.equal(reg.status, 201)
    assert.equal(reg.data.user.role, 'ucenec')
    assert.equal(reg.data.user.school, 'Testna šola')
    assert.equal((await call('POST', '/auth/register', { body })).status, 409)
    const me = await call('GET', '/auth/me', { token: reg.data.token })
    assert.equal(me.data.user.username, 'test.ucenec')
  })

  test('registracija ne dovoli izbire vloge in ne ločuje velikosti črk', async () => {
    const body = { first: 'Zlo', last: 'Namerni', email: 'zlo@dijak.sola.si', username: 'zlo.namerni', password: 'geslo1234', role: 'admin' }
    const reg = await call('POST', '/auth/register', { body })
    assert.equal(reg.status, 201)
    assert.equal(reg.data.user.role, 'ucenec')
    assert.equal((await call('GET', '/users?role=ucenec', { token: reg.data.token })).status, 403)
    // Uporabniško ime in e-naslov sta enolična ne glede na velikost črk, prijava prav tako.
    assert.equal((await call('POST', '/auth/register', { body: { ...body, username: 'ZLO.NAMERNI', email: 'drug@dijak.sola.si' } })).status, 409)
    assert.equal((await call('POST', '/auth/login', { body: { username: 'ADMIN', password: 'edulink123' } })).status, 200)
  })

  test('gesla so v bazi zgoščena', async () => {
    const { rows } = await pool.query("SELECT geslo_hash FROM uporabniki WHERE uporabnisko_ime = 'admin'")
    assert.match(rows[0].geslo_hash, /^pbkdf2_sha256\$\d+\$[0-9a-f]+\$[0-9a-f]+$/)
    assert.ok(!rows[0].geslo_hash.includes('edulink123'))
  })
})

describe('učenec', () => {
  let token
  before(async () => { token = await login('jan.novak1') })

  test('vidi vpisane predmete in njihove naloge z oddajami', async () => {
    const mine = await call('GET', '/me/subjects', { token })
    assert.ok(mine.data.length >= 2)
    const list = await call('GET', '/assignments', { token })
    assert.equal(list.status, 200)
    assert.ok(list.data.every(a => mine.data.includes(a.subject)))
    assert.ok(list.data.some(a => a.submission?.grade))
  })

  test('zamenja izbor predmetov', async () => {
    const res = await call('PUT', '/me/subjects', { token, body: { subjects: ['matematika', 'baze', 'splet'] } })
    assert.deepEqual(res.data, ['matematika', 'baze', 'splet'])
    assert.equal((await call('PUT', '/me/subjects', { token, body: { subjects: ['neobstaja'] } })).status, 400)
  })

  test('odda nalogo, jo prenese in zamenja šele po potrditvi', async () => {
    const list = (await call('GET', '/assignments?subject=baze', { token })).data
    const target = list.find(a => !a.submission) ?? list[0]
    const confirm = target.submission ? '?confirm=1' : ''
    const form = new FormData()
    form.append('file', new Blob(['moja naloga']), 'rešitev.txt')
    const first = await call('POST', `/assignments/${target.id}/submission${confirm}`, { token, form })
    assert.ok([200, 201].includes(first.status))
    // Ime na strežniku je »Priimek Ime – Naslov naloge« z en-pomišljajem in končnico.
    assert.match(first.data.name, /^Novak Jan – .*\.txt$/)
    assert.ok(fs.existsSync(path.join(process.env.UPLOAD_DIR, 'oddaje', String(target.id), first.data.name)))
    const file = await call('GET', `/submissions/${first.data.id}/file`, { token })
    assert.equal(file.data, 'moja naloga')

    // Brez potrditve strežnik oddaje ne zamenja in stara datoteka ostane.
    const again = new FormData()
    again.append('file', new Blob(['popravek']), 'popravek.pdf')
    const refused = await call('POST', `/assignments/${target.id}/submission`, { token, form: again })
    assert.equal(refused.status, 409)
    assert.equal(refused.data.code, 'EXISTS')
    assert.equal((await call('GET', `/submissions/${first.data.id}/file`, { token })).data, 'moja naloga')

    const confirmed = new FormData()
    confirmed.append('file', new Blob(['popravek']), 'popravek.pdf')
    const second = await call('POST', `/assignments/${target.id}/submission?confirm=1`, { token, form: confirmed })
    assert.equal(second.status, 200)
    assert.equal(second.data.id, first.data.id)
    assert.equal(second.data.grade, null)
    assert.match(second.data.name, /\.pdf$/)
    assert.equal((await call('GET', `/submissions/${first.data.id}/file`, { token })).data, 'popravek')
    // Stara datoteka (.txt) je po zamenjavi izbrisana, nova obstaja na disku.
    const dir = path.join(process.env.UPLOAD_DIR, 'oddaje', String(target.id))
    assert.ok(!fs.existsSync(path.join(dir, first.data.name)))
    assert.ok(fs.existsSync(path.join(dir, second.data.name)))
  })

  test('prevelike datoteke ne sprejme', async () => {
    const list = (await call('GET', '/assignments?subject=matematika', { token })).data
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(21 * 1024 * 1024)]), 'velika.pdf')
    const res = await call('POST', `/assignments/${list[0].id}/submission?confirm=1`, { token, form })
    assert.equal(res.status, 400)
  })

  test('tuje oddaje ne more prenesti', async () => {
    const other = await login('katja.vidmar2')
    const mine = (await call('GET', '/submissions', { token })).data
    assert.ok(mine.length > 0)
    assert.equal((await call('GET', `/submissions/${mine[0].id}/file`, { token: other })).status, 403)
    // Seznam oddaj vsebuje samo lastne oddaje.
    const theirs = (await call('GET', '/submissions', { token: other })).data
    assert.ok(theirs.every(s => s.student.id !== mine[0].student.id))
  })

  test('ne more prenesti gradiva predmeta, v katerega ni vpisan', async () => {
    const admin = await login('admin')
    const materials = (await call('GET', '/materials?subject=sociologija', { token: admin })).data
    assert.ok(materials.length > 0)
    assert.equal((await call('GET', `/materials/${materials[0].id}/file`, { token })).status, 403)
  })

  test('ne more oddati naloge predmeta, v katerega ni vpisan', async () => {
    const admin = await login('admin')
    const all = (await call('GET', '/assignments?subject=sociologija', { token: admin })).data
    const form = new FormData()
    form.append('file', new Blob(['x']), 'x.txt')
    assert.equal((await call('POST', `/assignments/${all[0].id}/submission`, { token, form })).status, 403)
  })

  test('vidi gradiva in koledar svojih predmetov', async () => {
    const materials = await call('GET', '/materials', { token })
    assert.ok(materials.data.length > 0)
    assert.ok(materials.data.every(m => ['matematika', 'baze', 'splet'].includes(m.subject)))
    const cal = await call('GET', '/calendar?from=2026-10-01&to=2026-12-31', { token })
    assert.ok(cal.data.some(e => e.source === 'assignment'))
    assert.ok(cal.data.some(e => e.source === 'event' && e.subject === null))
  })

  test('uredi profil', async () => {
    const res = await call('PUT', '/profile', { token, body: { first: 'Jan', last: 'Novak', email: 'jan.novak1@dijak.sola.si', school: 'Gimnazija' } })
    assert.equal(res.data.school, 'Gimnazija')
  })

  test('nima dostopa do administracije', async () => {
    assert.equal((await call('GET', '/users?role=ucenec', { token })).status, 403)
  })
})

describe('učitelj', () => {
  let token
  before(async () => { token = await login('jan.novak.u1') })

  test('doda nalogo, vidi oddaje in jih oceni', async () => {
    const created = await call('POST', '/assignments', { token, body: { subject: 'matematika', title: 'Nova naloga', description: 'Opis', due: '2026-12-01' } })
    assert.equal(created.status, 201)
    assert.equal(created.data.subject, 'matematika')
    const list = (await call('GET', '/assignments', { token })).data
    const graded = list.find(a => a.due < '2026-10-30')
    const rows = (await call('GET', `/assignments/${graded.id}/submissions`, { token })).data
    const submitted = rows.find(r => r.submission)
    const res = await call('PATCH', `/submissions/${submitted.submission.id}/grade`, { token, body: { grade: 5, feedback: 'Odlično' } })
    assert.equal(res.data.grade, 5)
    assert.equal((await call('PATCH', `/submissions/${submitted.submission.id}/grade`, { token, body: { grade: 7 } })).status, 400)
  })

  test('ne more dodati naloge pri predmetu, ki ga ne poučuje', async () => {
    const res = await call('POST', '/assignments', { token, body: { subject: 'sociologija', title: 'X', due: '2026-12-01' } })
    assert.equal(res.status, 403)
  })

  test('ne vidi, ne ocenjuje in ne briše pri tujem predmetu', async () => {
    const admin = await login('admin')
    const submission = (await call('GET', '/submissions?subject=baze', { token: admin })).data[0]
    assert.equal((await call('GET', `/submissions/${submission.id}/file`, { token })).status, 403)
    assert.equal((await call('PATCH', `/submissions/${submission.id}/grade`, { token, body: { grade: 1 } })).status, 403)
    const material = (await call('GET', '/materials?subject=baze', { token: admin })).data[0]
    assert.equal((await call('DELETE', `/materials/${material.id}`, { token })).status, 403)
    // Seznam oddaj in gradiv vsebuje samo predmete, ki jih učitelj poučuje.
    assert.ok((await call('GET', '/submissions', { token })).data.every(s => s.subject === 'matematika'))
    assert.ok((await call('GET', '/materials', { token })).data.every(m => m.subject === 'matematika'))
  })

  test('nima dostopa do upravljanja uporabnikov', async () => {
    assert.equal((await call('GET', '/users?role=ucenec', { token })).status, 403)
    assert.equal((await call('GET', '/stats', { token })).status, 403)
    assert.equal((await call('POST', '/subjects', { token, body: { name: 'Nov', teachers: [2] } })).status, 403)
  })

  test('naloži, prenese in izbriše gradivo', async () => {
    const form = new FormData()
    form.append('subject', 'matematika')
    form.append('type', 'Vaje')
    form.append('file', new Blob(['%PDF-1.4']), 'Vaje za test.pdf')
    const created = await call('POST', '/materials', { token, form })
    assert.equal(created.status, 201)
    assert.equal(created.data.title, 'Vaje za test')
    assert.equal(created.data.fileType, 'PDF')
    assert.equal((await call('GET', `/materials/${created.data.id}/file`, { token })).data, '%PDF-1.4')
    assert.equal((await call('DELETE', `/materials/${created.data.id}`, { token })).status, 204)
    assert.equal((await call('GET', `/materials/${created.data.id}/file`, { token })).status, 404)
  })

  test('zavrne nedovoljeno vrsto datoteke', async () => {
    const form = new FormData()
    form.append('subject', 'matematika')
    form.append('file', new Blob(['x']), 'virus.exe')
    assert.equal((await call('POST', '/materials', { token, form })).status, 400)
  })

  test('shrani podatke profila učitelja', async () => {
    const res = await call('PUT', '/profile', { token, body: { first: 'Jan', last: 'Novak', email: 'jan.novak1@sola.si', phone: '041 000 000', title: 'prof.', office: 'K12' } })
    assert.equal(res.data.office, 'K12')
  })
})

describe('administrator', () => {
  let token
  before(async () => { token = await login('admin') })

  test('ustvari, uredi in izbriše predmet', async () => {
    const created = await call('POST', '/subjects', { token, body: { name: 'Fizika in kemija', image: 'privzeto.svg', teachers: [2, 3] } })
    assert.equal(created.status, 201)
    assert.equal(created.data.id, 'fizika-in-kemija')
    assert.equal(created.data.teachers.length, 2)
    const updated = await call('PUT', '/subjects/fizika-in-kemija', { token, body: { name: 'Fizika', image: 'matematika', teachers: [4] } })
    assert.equal(updated.data.image, 'matematika.png')
    assert.deepEqual(updated.data.teachers.map(t => t.id), [4])
    assert.equal((await call('POST', '/subjects', { token, body: { name: 'Prazen', teachers: [] } })).status, 400)
    assert.equal((await call('DELETE', '/subjects/fizika-in-kemija', { token })).status, 204)
  })

  test('upravlja učence', async () => {
    const created = await call('POST', '/users', { token, body: { role: 'ucenec', first: 'Nova', last: 'Učenka', email: 'nova.ucenka@dijak.sola.si', password: 'zacetno123', subjects: ['matematika', 'baze'] } })
    assert.equal(created.status, 201)
    assert.equal(created.data.username, 'nova.ucenka')
    assert.equal((await call('POST', '/users', { token, body: { role: 'ucenec', first: 'A', last: 'B', email: 'a.b@x.si', password: 'zacetno123', subjects: ['matematika'] } })).status, 400)
    const updated = await call('PUT', `/users/${created.data.id}`, { token, body: { first: 'Nova', last: 'Učenka', email: 'nova@dijak.sola.si', subjects: ['splet', 'baze', 'smv'] } })
    assert.deepEqual(updated.data.subjects, ['splet', 'smv', 'baze'])
    assert.ok((await call('POST', '/auth/login', { body: { username: 'nova.ucenka', password: 'zacetno123' } })).data.token)
    assert.equal((await call('DELETE', `/users/${created.data.id}`, { token })).status, 204)
  })

  test('vidi seznam učiteljev in statistiko', async () => {
    const teachers = await call('GET', '/users?role=ucitelj', { token })
    assert.equal(teachers.data.length, 20)
    assert.ok(teachers.data.every(t => t.subjects.length >= 1))
    const stats = await call('GET', '/stats', { token })
    assert.equal(stats.data.teachers, 20)
    // 100 testnih učencev in učenca, ki ju ustvarita testa registracije.
    assert.equal(stats.data.students, 102)
    assert.equal(stats.data.subjects, 10)
  })

  test('testni podatki imajo več učiteljev na predmet in več predmetov na učitelja', async () => {
    const subjects = (await call('GET', '/subjects', { token })).data
    assert.ok(subjects.length >= 10)
    assert.ok(subjects.every(s => s.teachers.length >= 2))
    const teachers = (await call('GET', '/users?role=ucitelj', { token })).data
    assert.ok(teachers.some(t => t.subjects.length > 1))
    const students = (await call('GET', '/users?role=ucenec', { token })).data
    // Registrirana učenca (brez izbranih predmetov) izločimo; vsak testni učenec obiskuje več predmetov.
    const seeded = students.filter(s => s.email.endsWith('@dijak.sola.si') && !['test.ucenec', 'zlo.namerni'].includes(s.username))
    assert.ok(seeded.length >= 100)
    assert.ok(seeded.every(s => s.subjects.length > 1))
  })
})
