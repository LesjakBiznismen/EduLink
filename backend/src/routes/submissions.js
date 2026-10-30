import { Router } from 'express'
import { db } from '../db.js'
import { assertTeaches, visibleSubjectsSql } from '../lib/access.js'
import { sendFile } from '../lib/files.js'
import { badRequest, forbidden, id, notFound, text } from '../lib/http.js'
import { toPerson, toSubmission } from '../lib/mappers.js'
import { requireRole } from '../middleware/auth.js'

const router = Router()

const SUBMISSION_SQL = `
  SELECT o.*, n.naslov, n.id_predmet, p.koda, u.id_uporabnik, u.ime, u.priimek FROM oddaje o
  JOIN naloge n USING (id_naloga)
  JOIN predmeti p ON p.id_predmet = n.id_predmet
  JOIN uporabniki u ON u.id_uporabnik = o.id_ucenec`

function submissionById(value) {
  const row = db.prepare(`${SUBMISSION_SQL} WHERE o.id_oddaja = ?`).get(id(value))
  if (!row) throw notFound('Oddaja ni najdena.')
  return row
}

const toRow = row => ({
  ...toSubmission(row),
  student: toPerson(row),
  assignmentTitle: row.naslov,
  subject: row.koda,
})

// Učitelj: vse oddaje pri njegovih predmetih; učenec: lastne oddaje.
router.get('/', (req, res) => {
  const visible = visibleSubjectsSql(req.user)
  const params = [...visible.params]
  let where = `WHERE n.id_predmet IN (${visible.sql})`
  if (req.user.role === 'ucenec') {
    where += ' AND o.id_ucenec = ?'
    params.push(req.user.id)
  }
  if (req.query.subject) {
    where += ' AND p.koda = ?'
    params.push(String(req.query.subject))
  }
  res.json(db.prepare(`${SUBMISSION_SQL} ${where} ORDER BY o.oddano_ob DESC`).all(...params).map(toRow))
})

router.get('/:id/file', (req, res) => {
  const row = submissionById(req.params.id)
  if (req.user.role === 'ucenec' && row.id_ucenec !== req.user.id) throw forbidden()
  if (req.user.role !== 'ucenec') assertTeaches(req.user, row.id_predmet)
  sendFile(res, row.datoteka_url, row.datoteka_ime)
})

// Učitelj oceni oddajo (1–5) in doda povratno informacijo; ocena null jo odstrani.
router.patch('/:id/grade', requireRole('ucitelj', 'admin'), (req, res) => {
  const row = submissionById(req.params.id)
  assertTeaches(req.user, row.id_predmet)
  const grade = req.body?.grade == null || req.body.grade === '' ? null : Number(req.body.grade)
  if (grade !== null && !(Number.isInteger(grade) && grade >= 1 && grade <= 5)) throw badRequest('Ocena mora biti med 1 in 5.')
  const feedback = text(req.body?.feedback, { field: 'Povratna informacija', max: 1000 }) || null
  db.prepare(`
    UPDATE oddaje SET ocena = ?, povratna_informacija = ?, ocenil = ?, ocenjeno_ob = CASE WHEN ? IS NULL THEN NULL ELSE datetime('now') END
    WHERE id_oddaja = ?`).run(grade, feedback, grade === null ? null : req.user.id, grade, row.id_oddaja)
  res.json(toRow(submissionById(row.id_oddaja)))
})

export default router
