import { Router } from 'express'
import { db, transaction } from '../db.js'
import { subjectByCode } from '../lib/access.js'
import { removeFile } from '../lib/files.js'
import { badRequest, conflict, text } from '../lib/http.js'
import { toPerson, toSubject } from '../lib/mappers.js'
import { requireRole } from '../middleware/auth.js'

const router = Router()

// Slike, ki so na voljo v edulink-vite/public/slike/predmeti.
const IMAGES = ['matematika', 'slovenscina', 'anglescina', 'programiranje', 'rps', 'splet', 'smv', 'sociologija', 'baze']
  .map(name => `${name}.png`).concat('privzeto.svg')

function image(value) {
  const name = String(value || 'privzeto.svg')
  const file = name.includes('.') ? name : `${name}.png`
  if (!IMAGES.includes(file)) throw badRequest('Neznana slika predmeta.')
  return file
}

const slug = value => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

async function uniqueCode(tx, name) {
  let base = slug(name) || 'predmet'
  if (!/^[a-z]/.test(base)) base = `p-${base}`
  let code = base
  for (let n = 2; await tx.get('SELECT 1 FROM predmeti WHERE koda = ?', [code]); n++) code = `${base}-${n}`
  return code
}

// Predmeti z učitelji in številom vpisanih učencev.
export async function listSubjects(where = '', params = []) {
  const rows = await db.all(`
    SELECT p.*, (SELECT count(*) FROM vpisi v WHERE v.id_predmet = p.id_predmet) AS ucencev
    FROM predmeti p ${where} ORDER BY p.id_predmet`, params)
  const teachers = await db.all(`
    SELECT up.id_predmet, u.id_uporabnik, u.ime, u.priimek FROM ucitelji_predmeti up
    JOIN uporabniki u ON u.id_uporabnik = up.id_ucitelj ORDER BY u.priimek, u.ime`)
  return rows.map(row => ({
    ...toSubject(row),
    studentCount: row.ucencev,
    teachers: teachers.filter(t => t.id_predmet === row.id_predmet).map(toPerson),
  }))
}

async function setTeachers(tx, subjectId, ids) {
  if (!Array.isArray(ids) || !ids.length) throw badRequest('Izberite vsaj enega učitelja.')
  const teacherIds = [...new Set(ids.map(Number))]
  if (teacherIds.some(n => !Number.isInteger(n))) throw badRequest('Izbrani so neveljavni učitelji.')
  const { n: valid } = await tx.get(
    `SELECT count(*) AS n FROM uporabniki WHERE vloga = 'ucitelj' AND id_uporabnik IN (${teacherIds.map(() => '?').join(',')})`,
    teacherIds,
  )
  if (valid !== teacherIds.length) throw badRequest('Izbrani so neveljavni učitelji.')
  await tx.run('DELETE FROM ucitelji_predmeti WHERE id_predmet = ?', [subjectId])
  for (const teacherId of teacherIds) await tx.run('INSERT INTO ucitelji_predmeti (id_ucitelj, id_predmet) VALUES (?, ?)', [teacherId, subjectId])
}

function readBody(body = {}) {
  return {
    name: text(body.name, { field: 'Ime predmeta', required: true, max: 80 }),
    image: image(body.image),
    teachers: body.teachers,
  }
}

const one = async id => (await listSubjects('WHERE p.id_predmet = ?', [id]))[0]

router.get('/', async (_req, res) => {
  res.json(await listSubjects())
})

router.get('/:code', async (req, res) => {
  res.json(await one((await subjectByCode(req.params.code)).id_predmet))
})

router.post('/', requireRole('admin'), async (req, res) => {
  const { name, image: slika, teachers } = readBody(req.body)
  if (await db.get('SELECT 1 FROM predmeti WHERE naziv = ?', [name])) throw conflict('Predmet s tem imenom že obstaja.')
  const id = await transaction(async tx => {
    const kratica = slug(name).replace(/-/g, '').slice(0, 3).toUpperCase() || 'PRE'
    const created = await tx.get(
      'INSERT INTO predmeti (koda, naziv, kratica, slika, ustvaril) VALUES (?, ?, ?, ?, ?) RETURNING id_predmet',
      [await uniqueCode(tx, name), name, kratica, slika, req.user.id],
    )
    await setTeachers(tx, created.id_predmet, teachers)
    return created.id_predmet
  })
  res.status(201).json(await one(id))
})

router.put('/:code', requireRole('admin'), async (req, res) => {
  const subject = await subjectByCode(req.params.code)
  const { name, image: slika, teachers } = readBody(req.body)
  if (await db.get('SELECT 1 FROM predmeti WHERE naziv = ? AND id_predmet <> ?', [name, subject.id_predmet])) throw conflict('Predmet s tem imenom že obstaja.')
  await transaction(async tx => {
    await tx.run('UPDATE predmeti SET naziv = ?, slika = ? WHERE id_predmet = ?', [name, slika, subject.id_predmet])
    await setTeachers(tx, subject.id_predmet, teachers)
  })
  res.json(await one(subject.id_predmet))
})

router.delete('/:code', requireRole('admin'), async (req, res) => {
  const subject = await subjectByCode(req.params.code)
  // Datoteke gradiv in oddaj izbrišemo z diska, zapise pa kaskadno izbriše baza.
  const files = await db.all(`
    SELECT datoteka_url FROM gradiva WHERE id_predmet = ? AND datoteka_url IS NOT NULL
    UNION ALL
    SELECT o.datoteka_url FROM oddaje o JOIN naloge n USING (id_naloga) WHERE n.id_predmet = ?`,
  [subject.id_predmet, subject.id_predmet])
  await db.run('DELETE FROM predmeti WHERE id_predmet = ?', [subject.id_predmet])
  for (const f of files) {
    try { removeFile(f.datoteka_url) } catch { /* Datoteke ni na disku. */ }
  }
  res.status(204).end()
})

export default router
