import { Router } from 'express'
import { db, transaction } from '../db.js'
import { removeFile } from '../lib/files.js'
import { badRequest, conflict, id, isEmail, notFound, text } from '../lib/http.js'
import { toUser } from '../lib/mappers.js'
import { hashPassword } from '../lib/password.js'
import { USER_SQL } from '../middleware/auth.js'

// Administrator: upravljanje učiteljev in učencev ter njihovih predmetov.
const router = Router()

const ROLES = {
  ucitelj: { table: 'ucitelji_predmeti', column: 'id_ucitelj', min: 1, minText: 'Izberite vsaj en predmet.' },
  ucenec: { table: 'vpisi', column: 'id_ucenec', min: 2, minText: 'Učenec mora obiskovati vsaj dva predmeta.' },
}

function role(value) {
  if (!ROLES[value]) throw badRequest('Vloga mora biti ucitelj ali ucenec.')
  return value
}

const slug = value => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

async function subjectCodes(userId, r) {
  const { table, column } = ROLES[r]
  return (await db.all(`SELECT p.koda FROM ${table} x JOIN predmeti p USING (id_predmet) WHERE x.${column} = ? ORDER BY p.id_predmet`, [userId]))
    .map(x => x.koda)
}

const withSubjects = async row => ({ ...toUser(row), subjects: await subjectCodes(row.id_uporabnik, row.vloga) })

async function userById(value) {
  const row = await db.get(`${USER_SQL} WHERE u.id_uporabnik = ? AND u.vloga IN ('ucitelj', 'ucenec')`, [id(value)])
  if (!row) throw notFound('Uporabnik ni najden.')
  return row
}

async function setSubjects(tx, userId, r, codes) {
  const { table, column, min, minText } = ROLES[r]
  const unique = [...new Set((Array.isArray(codes) ? codes : []).map(String))]
  if (unique.length < min) throw badRequest(minText)
  const rows = await tx.all(`SELECT id_predmet FROM predmeti WHERE koda IN (${unique.map(() => '?').join(',')})`, unique)
  if (rows.length !== unique.length) throw badRequest('Izbran je neznan predmet.')
  await tx.run(`DELETE FROM ${table} WHERE ${column} = ?`, [userId])
  for (const r2 of rows) await tx.run(`INSERT INTO ${table} (${column}, id_predmet) VALUES (?, ?)`, [userId, r2.id_predmet])
}

function readBody(body = {}) {
  const first = text(body.first, { field: 'Ime', required: true, max: 60 })
  const last = text(body.last, { field: 'Priimek', required: true, max: 60 })
  const email = text(body.email, { field: 'E-naslov', required: true, max: 120 })
  if (!isEmail(email)) throw badRequest('Vnesite veljaven e-naslov.')
  return { first, last, email }
}

async function assertUnique(column, value, label, exceptId = 0) {
  if (await db.get(`SELECT 1 FROM uporabniki WHERE ${column} = ? AND id_uporabnik <> ?`, [value, exceptId])) throw conflict(`${label} je že zaseden.`)
}

router.get('/', async (req, res) => {
  const r = role(req.query.role)
  const rows = await db.all(`${USER_SQL} WHERE u.vloga = ? ORDER BY u.id_uporabnik`, [r])
  // Predmete naložimo z eno poizvedbo za vse uporabnike.
  const { table, column } = ROLES[r]
  const links = await db.all(`SELECT x.${column} AS uid, p.koda FROM ${table} x JOIN predmeti p USING (id_predmet) ORDER BY p.id_predmet`)
  const byUser = Map.groupBy(links, l => l.uid)
  res.json(rows.map(row => ({ ...toUser(row), subjects: (byUser.get(row.id_uporabnik) || []).map(l => l.koda) })))
})

router.get('/:id', async (req, res) => {
  res.json(await withSubjects(await userById(req.params.id)))
})

router.post('/', async (req, res) => {
  const body = req.body ?? {}
  const r = role(body.role)
  const { first, last, email } = readBody(body)
  const password = String(body.password ?? '')
  if (password.length < 8) throw badRequest('Začetno geslo naj ima vsaj 8 znakov.')
  let username = text(body.username, { field: 'Uporabniško ime', max: 50 })
  if (!username) {
    const base = `${slug(first)}.${slug(last)}` || 'uporabnik'
    username = base
    for (let n = 2; await db.get('SELECT 1 FROM uporabniki WHERE uporabnisko_ime = ?', [username]); n++) username = `${base}${n}`
  }
  if (username.length < 3) throw badRequest('Uporabniško ime naj ima vsaj 3 znake.')
  await assertUnique('uporabnisko_ime', username, 'Uporabniško ime')
  await assertUnique('e_posta', email, 'E-naslov')
  const userId = await transaction(async tx => {
    const created = await tx.get(`
      INSERT INTO uporabniki (e_posta, uporabnisko_ime, geslo_hash, ime, priimek, vloga, id_sola)
      VALUES (?, ?, ?, ?, ?, ?, (SELECT id_sola FROM uporabniki WHERE id_uporabnik = ?))
      RETURNING id_uporabnik`, [email, username, hashPassword(password), first, last, r, req.user.id])
    await setSubjects(tx, created.id_uporabnik, r, body.subjects)
    return created.id_uporabnik
  })
  res.status(201).json(await withSubjects(await userById(userId)))
})

router.put('/:id', async (req, res) => {
  const row = await userById(req.params.id)
  const { first, last, email } = readBody(req.body)
  await assertUnique('e_posta', email, 'E-naslov', row.id_uporabnik)
  await transaction(async tx => {
    await tx.run('UPDATE uporabniki SET ime = ?, priimek = ?, e_posta = ? WHERE id_uporabnik = ?', [first, last, email, row.id_uporabnik])
    await setSubjects(tx, row.id_uporabnik, row.vloga, req.body?.subjects)
    if (req.body?.password) {
      if (String(req.body.password).length < 8) throw badRequest('Geslo naj ima vsaj 8 znakov.')
      await tx.run('UPDATE uporabniki SET geslo_hash = ? WHERE id_uporabnik = ?', [hashPassword(String(req.body.password)), row.id_uporabnik])
    }
  })
  res.json(await withSubjects(await userById(row.id_uporabnik)))
})

router.delete('/:id', async (req, res) => {
  const row = await userById(req.params.id)
  const files = await db.all('SELECT datoteka_url FROM oddaje WHERE id_ucenec = ?', [row.id_uporabnik])
  await db.run('DELETE FROM uporabniki WHERE id_uporabnik = ?', [row.id_uporabnik])
  for (const f of files) {
    try { removeFile(f.datoteka_url) } catch { /* Datoteke ni na disku. */ }
  }
  res.status(204).end()
})

export default router
