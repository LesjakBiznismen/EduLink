import { Router } from 'express'
import { db } from '../db.js'
import { assertTeaches, enrolled, subjectByCode, visibleSubjectsSql } from '../lib/access.js'
import { extensionOf, removeFile, safeFilename, stageFile } from '../lib/files.js'
import { HttpError, badRequest, forbidden, id, isDate, notFound, text } from '../lib/http.js'
import { toAssignment, toPerson, toSubmission } from '../lib/mappers.js'
import { requireRole } from '../middleware/auth.js'
import { singleFile } from '../middleware/upload.js'

const router = Router()

const ASSIGNMENT_SQL = 'SELECT n.*, p.koda FROM naloge n JOIN predmeti p USING (id_predmet)'

async function assignmentById(value) {
  const row = await db.get(`${ASSIGNMENT_SQL} WHERE n.id_naloga = ?`, [id(value)])
  if (!row) throw notFound('Naloga ni najdena.')
  return row
}

function readBody(body = {}) {
  const title = text(body.title, { field: 'Naslov', required: true, max: 120 })
  const description = text(body.description, { field: 'Navodila', max: 1000 }) || 'Navodila za nalogo bo dodal učitelj.'
  const due = String(body.due ?? '')
  if (!isDate(due)) throw badRequest('Izberite veljaven rok oddaje.')
  return { title, description, due }
}

// Naloge predmetov, ki jih uporabnik vidi; učenec dobi tudi svojo oddajo in oceno.
router.get('/', async (req, res) => {
  const visible = visibleSubjectsSql(req.user)
  const params = [...visible.params]
  let where = `WHERE n.id_predmet IN (${visible.sql})`
  if (req.query.subject) {
    where += ' AND p.koda = ?'
    params.push(String(req.query.subject))
  }
  const rows = await db.all(`${ASSIGNMENT_SQL} ${where} ORDER BY n.rok_oddaje, n.id_naloga`, params)
  if (req.user.role !== 'ucenec') return res.json(rows.map(toAssignment))
  const mine = new Map((await db.all('SELECT * FROM oddaje WHERE id_ucenec = ?', [req.user.id])).map(o => [o.id_naloga, o]))
  res.json(rows.map(row => {
    const submission = mine.get(row.id_naloga)
    return { ...toAssignment(row), submission: submission ? toSubmission(submission) : null }
  }))
})

router.post('/', requireRole('ucitelj', 'admin'), async (req, res) => {
  const subject = await subjectByCode(req.body?.subject)
  await assertTeaches(req.user, subject.id_predmet)
  const { title, description, due } = readBody(req.body)
  const created = await db.get(
    'INSERT INTO naloge (id_predmet, ustvaril, naslov, navodila, rok_oddaje) VALUES (?, ?, ?, ?, ?) RETURNING id_naloga',
    [subject.id_predmet, req.user.id, title, description, due],
  )
  res.status(201).json(toAssignment(await assignmentById(created.id_naloga)))
})

router.put('/:id', requireRole('ucitelj', 'admin'), async (req, res) => {
  const assignment = await assignmentById(req.params.id)
  await assertTeaches(req.user, assignment.id_predmet)
  const { title, description, due } = readBody(req.body)
  await db.run('UPDATE naloge SET naslov = ?, navodila = ?, rok_oddaje = ? WHERE id_naloga = ?', [title, description, due, assignment.id_naloga])
  res.json(toAssignment(await assignmentById(assignment.id_naloga)))
})

router.delete('/:id', requireRole('ucitelj', 'admin'), async (req, res) => {
  const assignment = await assignmentById(req.params.id)
  await assertTeaches(req.user, assignment.id_predmet)
  const files = await db.all('SELECT datoteka_url FROM oddaje WHERE id_naloga = ?', [assignment.id_naloga])
  await db.run('DELETE FROM naloge WHERE id_naloga = ?', [assignment.id_naloga])
  for (const f of files) removeFile(f.datoteka_url)
  res.status(204).end()
})

// Učitelj: vsi vpisani učenci in njihove oddaje za nalogo.
router.get('/:id/submissions', requireRole('ucitelj', 'admin'), async (req, res) => {
  const assignment = await assignmentById(req.params.id)
  await assertTeaches(req.user, assignment.id_predmet)
  const rows = await db.all(`
    SELECT u.id_uporabnik, u.ime, u.priimek, o.* FROM vpisi v
    JOIN uporabniki u ON u.id_uporabnik = v.id_ucenec
    LEFT JOIN oddaje o ON o.id_naloga = ? AND o.id_ucenec = v.id_ucenec
    WHERE v.id_predmet = ?
    ORDER BY o.id_oddaja IS NULL, o.oddano_ob DESC, u.priimek, u.ime`, [assignment.id_naloga, assignment.id_predmet])
  res.json(rows.map(row => ({
    student: toPerson(row),
    submission: row.id_oddaja ? toSubmission(row) : null,
  })))
})

// Učenec odda ali zamenja oddajo (multipart polje "file"); ocena se ob zamenjavi ponastavi.
// Obstoječo oddajo strežnik zamenja šele, ko odjemalec doda ?confirm=1 (učenec je zamenjavo potrdil).
// Datoteka se na strežniku shrani pod imenom »Priimek Ime – Naslov naloge« z ustrezno končnico.
router.post('/:id/submission', requireRole('ucenec'), singleFile('file'), async (req, res) => {
  const assignment = await assignmentById(req.params.id)
  if (!(await enrolled(req.user.id, assignment.id_predmet))) throw forbidden('Niste vpisani v predmet te naloge.')
  if (!req.file?.size) throw badRequest('Priložite datoteko.')
  const existing = await db.get('SELECT * FROM oddaje WHERE id_naloga = ? AND id_ucenec = ?', [assignment.id_naloga, req.user.id])
  if (existing && req.query.confirm !== '1') {
    throw new HttpError(409, 'Oddaja že obstaja. Potrdite zamenjavo obstoječe datoteke.', 'EXISTS')
  }

  const raw = extensionOf(req.file.originalname).replace(/[^a-z0-9]/g, '').slice(0, 12)
  const ext = raw ? `.${raw}` : ''
  const stem = safeFilename(`${req.user.last} ${req.user.first} – ${assignment.naslov}`.slice(0, 140))
  let name = `${stem}${ext}`
  // Učenca z enakim imenom in priimkom ne smeta prepisati datoteke drug drugega.
  const clash = await db.get('SELECT 1 FROM oddaje WHERE id_naloga = ? AND datoteka_url = ? AND id_ucenec <> ?',
    [assignment.id_naloga, `/uploads/oddaje/${assignment.id_naloga}/${name}`, req.user.id])
  if (clash) name = `${stem} (${req.user.id})${ext}`

  // Novo datoteko najprej zapišemo v začasno; stara se zamenja šele, ko je zapis v bazi uspel.
  const staged = stageFile(['oddaje', assignment.id_naloga, name], req.file.buffer)
  const values = [name, req.file.originalname.slice(0, 255), staged.url, req.file.size]
  let row
  try {
    row = existing
      ? await db.get(`
        UPDATE oddaje SET datoteka_ime = ?, izvirno_ime_datoteke = ?, datoteka_url = ?, velikost_bajtov = ?,
          oddano_ob = NOW() AT TIME ZONE 'UTC', ocena = NULL, povratna_informacija = NULL, ocenil = NULL, ocenjeno_ob = NULL
        WHERE id_oddaja = ? RETURNING *`, [...values, existing.id_oddaja])
      : await db.get(`
        INSERT INTO oddaje (datoteka_ime, izvirno_ime_datoteke, datoteka_url, velikost_bajtov, id_naloga, id_ucenec)
        VALUES (?, ?, ?, ?, ?, ?) RETURNING *`, [...values, assignment.id_naloga, req.user.id])
  } catch (error) {
    staged.discard()
    throw error
  }
  staged.commit()
  if (existing && existing.datoteka_url !== staged.url) removeFile(existing.datoteka_url)
  res.status(existing ? 200 : 201).json(toSubmission(row))
})

export default router
