import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, test } from 'node:test'

// Vsak zagon testov dobi svežo bazo in mapo za datoteke v začasni mapi.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'edulink-test-'))
process.env.DB_PATH = path.join(tmp, 'test.db')
process.env.UPLOAD_DIR = path.join(tmp, 'uploads')
process.env.STATIC_DIR = path.join(tmp, 'dist')

const { app } = await import('../src/app.js')
const { db } = await import('../src/db.js')

let server
let base
before(async () => {
  server = app.listen(0)
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}/api`
})
after(async () => {
  await new Promise(resolve => server.close(resolve))
  db.close()
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

  test('odda nalogo, jo prenese in zamenja', async () => {
    const list = (await call('GET', '/assignments?subject=baze', { token })).data
    const target = list.find(a => !a.submission) ?? list[0]
    const form = new FormData()
    form.append('file', new Blob(['moja naloga']), 'rešitev.txt')
    const first = await call('POST', `/assignments/${target.id}/submission`, { token, form })
    assert.ok([200, 201].includes(first.status))
    assert.match(first.data.name, /^Novak Jan -- .*\.txt$/)
    const file = await call('GET', `/submissions/${first.data.id}/file`, { token })
    assert.equal(file.data, 'moja naloga')
    const again = new FormData()
    again.append('file', new Blob(['popravek']), 'popravek.pdf')
    const second = await call('POST', `/assignments/${target.id}/submission`, { token, form: again })
    assert.equal(second.status, 200)
    assert.equal(second.data.id, first.data.id)
    assert.equal(second.data.grade, null)
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
  })
})
