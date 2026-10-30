import { Router } from 'express'
import { db } from '../db.js'
import { assertTeaches, enrolled, subjectByCode, visibleSubjectsSql } from '../lib/access.js'
import { extensionOf, removeFile, safeFilename, saveFile } from '../lib/files.js'
import { badRequest, forbidden, id, isDate, notFound, text } from '../lib/http.js'
import { toAssignment, toPerson, toSubmission } from '../lib/mappers.js'
import { requireRole } from '../middleware/auth.js'
import { singleFile } from '../middleware/upload.js'

const router = Router()

const ASSIGNMENT_SQL = 'SELECT n.*, p.koda FROM naloge n JOIN predmeti p USING (id_predmet)'

function assignmentById(value) {
  const row = db.prepare(`${ASSIGNMENT_SQL} WHERE n.id_naloga = ?`).get(id(value))
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
router.get('/', (req, res) => {
  const visible = visibleSubjectsSql(req.user)
  const params = [...visible.params]
  let where = `WHERE n.id_predmet IN (${visible.sql})`
  if (req.query.subject) {
    where += ' AND p.koda = ?'
    params.push(String(req.query.subject))
  }
  const rows = db.prepare(`${ASSIGNMENT_SQL} ${where} ORDER BY n.rok_oddaje, n.id_naloga`).all(...params)
  if (req.user.role !== 'ucenec') return res.json(rows.map(toAssignment))
  const mine = new Map(db.prepare('SELECT * FROM oddaje WHERE id_ucenec = ?').all(req.user.id).map(o => [o.id_naloga, o]))
  res.json(rows.map(row => {
    const submission = mine.get(row.id_naloga)
    return { ...toAssignment(row), submission: submission ? toSubmission(submission) : null }
  }))
})

router.post('/', requireRole('ucitelj', 'admin'), (req, res) => {
  const subject = subjectByCode(req.body?.subject)
  assertTeaches(req.user, subject.id_predmet)
  const { title, description, due } = readBody(req.body)
  const { lastInsertRowid } = db.prepare('INSERT INTO naloge (id_predmet, ustvaril, naslov, navodila, rok_oddaje) VALUES (?, ?, ?, ?, ?)')
    .run(subject.id_predmet, req.user.id, title, description, due)
  res.status(201).json(toAssignment(assignmentById(lastInsertRowid)))
})

router.put('/:id', requireRole('ucitelj', 'admin'), (req, res) => {
  const assignment = assignmentById(req.params.id)
  assertTeaches(req.user, assignment.id_predmet)
  const { title, description, due } = readBody(req.body)
  db.prepare('UPDATE naloge SET naslov = ?, navodila = ?, rok_oddaje = ? WHERE id_naloga = ?').run(title, description, due, assignment.id_naloga)
  res.json(toAssignment(assignmentById(assignment.id_naloga)))
})

router.delete('/:id', requireRole('ucitelj', 'admin'), (req, res) => {
  const assignment = assignmentById(req.params.id)
  assertTeaches(req.user, assignment.id_predmet)
  const files = db.prepare('SELECT datoteka_url FROM oddaje WHERE id_naloga = ?').all(assignment.id_naloga)
  db.prepare('DELETE FROM naloge WHERE id_naloga = ?').run(assignment.id_naloga)
  for (const f of files) removeFile(f.datoteka_url)
  res.status(204).end()
})

// Učitelj: vsi vpisani učenci in njihove oddaje za nalogo.
router.get('/:id/submissions', requireRole('ucitelj', 'admin'), (req, res) => {
  const assignment = assignmentById(req.params.id)
  assertTeaches(req.user, assignment.id_predmet)
  const rows = db.prepare(`
    SELECT u.id_uporabnik, u.ime, u.priimek, o.* FROM vpisi v
    JOIN uporabniki u ON u.id_uporabnik = v.id_ucenec
    LEFT JOIN oddaje o ON o.id_naloga = ? AND o.id_ucenec = v.id_ucenec
    WHERE v.id_predmet = ?
    ORDER BY o.id_oddaja IS NULL, o.oddano_ob DESC, u.priimek, u.ime`).all(assignment.id_naloga, assignment.id_predmet)
  res.json(rows.map(row => ({
    student: toPerson(row),
    submission: row.id_oddaja ? toSubmission(row) : null,
  })))
})

// Učenec odda ali zamenja oddajo (multipart polje "file"); ocena se ob zamenjavi ponastavi.
router.post('/:id/submission', requireRole('ucenec'), singleFile('file'), (req, res) => {
  const assignment = assignmentById(req.params.id)
  if (!enrolled(req.user.id, assignment.id_predmet)) throw forbidden('Niste vpisani v predmet te naloge.')
  if (!req.file?.size) throw badRequest('Priložite datoteko.')
  const raw = extensionOf(req.file.originalname).replace(/[^a-z0-9]/g, '').slice(0, 12)
  const ext = raw ? `.${raw}` : ''
  const name = `${safeFilename(`${req.user.last} ${req.user.first} -- ${assignment.naslov}`)}${ext}`
  const existing = db.prepare('SELECT * FROM oddaje WHERE id_naloga = ? AND id_ucenec = ?').get(assignment.id_naloga, req.user.id)
  if (existing) removeFile(existing.datoteka_url)
  const url = saveFile(['oddaje', assignment.id_naloga, `${req.user.id}${ext}`], req.file.buffer)
  const values = [name, req.file.originalname.slice(0, 255), url, req.file.size]
  if (existing) {
    db.prepare(`
      UPDATE oddaje SET datoteka_ime = ?, izvirno_ime_datoteke = ?, datoteka_url = ?, velikost_bajtov = ?,
        oddano_ob = datetime('now'), ocena = NULL, povratna_informacija = NULL, ocenil = NULL, ocenjeno_ob = NULL
      WHERE id_oddaja = ?`).run(...values, existing.id_oddaja)
  } else {
    db.prepare(`
      INSERT INTO oddaje (datoteka_ime, izvirno_ime_datoteke, datoteka_url, velikost_bajtov, id_naloga, id_ucenec)
      VALUES (?, ?, ?, ?, ?, ?)`).run(...values, assignment.id_naloga, req.user.id)
  }
  const row = db.prepare('SELECT * FROM oddaje WHERE id_naloga = ? AND id_ucenec = ?').get(assignment.id_naloga, req.user.id)
  res.status(existing ? 200 : 201).json(toSubmission(row))
})

export default router
