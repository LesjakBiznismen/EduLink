import { Router } from 'express'
import { db } from '../db.js'
import { assertTeaches, canView, subjectByCode, visibleSubjectsSql } from '../lib/access.js'
import { extensionOf, materialKind, saveFile, sendFile } from '../lib/files.js'
import { badRequest, forbidden, id, notFound, text } from '../lib/http.js'
import { toMaterial } from '../lib/mappers.js'
import { requireRole } from '../middleware/auth.js'
import { singleFile } from '../middleware/upload.js'

const router = Router()

const MATERIAL_SQL = 'SELECT g.*, p.koda FROM gradiva g JOIN predmeti p USING (id_predmet)'
const TYPES = ['Zapiski', 'Vaje']

function materialById(value) {
  const row = db.prepare(`${MATERIAL_SQL} WHERE g.id_gradivo = ? AND g.izbrisano_ob IS NULL`).get(id(value))
  if (!row) throw notFound('Gradivo ni najdeno.')
  return row
}

router.get('/', (req, res) => {
  const visible = visibleSubjectsSql(req.user)
  const params = [...visible.params]
  let where = `WHERE g.izbrisano_ob IS NULL AND g.id_predmet IN (${visible.sql})`
  if (req.query.subject) {
    where += ' AND p.koda = ?'
    params.push(String(req.query.subject))
  }
  res.json(db.prepare(`${MATERIAL_SQL} ${where} ORDER BY g.dodano_ob DESC, g.id_gradivo DESC`).all(...params).map(toMaterial))
})

// Učitelj naloži gradivo (multipart: subject, type, title, file) ali doda besedilno gradivo (content).
router.post('/', requireRole('ucitelj', 'admin'), singleFile('file'), (req, res) => {
  const subject = subjectByCode(req.body?.subject)
  assertTeaches(req.user, subject.id_predmet)
  const type = String(req.body?.type || 'Zapiski')
  if (!TYPES.includes(type)) throw badRequest('Vrsta gradiva mora biti Zapiski ali Vaje.')
  const file = req.file?.size ? req.file : null
  let title = text(req.body?.title, { field: 'Naslov', max: 120 })
  let content = text(req.body?.content, { field: 'Vsebina', max: 20000 })
  let kind = null
  if (file) {
    kind = materialKind(file.originalname)
    if (!kind) throw badRequest('Dovoljene so samo datoteke PDF, Word (doc, docx), PowerPoint (ppt, pptx) in slike (png, jpg, gif, webp).')
    title ||= file.originalname.replace(/\.[^.]+$/, '').slice(0, 120)
    content ||= `Priložena datoteka: ${file.originalname} (${kind}, ${Math.max(1, Math.round(file.size / 1024))} kB).`
  } else if (!content) {
    throw badRequest('Izberite datoteko.')
  }
  if (!title) throw badRequest('Vnesite naslov gradiva.')

  const { lastInsertRowid } = db.prepare('INSERT INTO gradiva (id_predmet, nalozil, naslov, vrsta, vsebina) VALUES (?, ?, ?, ?, ?)')
    .run(subject.id_predmet, req.user.id, title, type, content)
  const materialId = Number(lastInsertRowid)
  if (file) {
    const url = saveFile(['gradiva', subject.id_predmet, `${materialId}.${extensionOf(file.originalname)}`], file.buffer)
    db.prepare('UPDATE gradiva SET datoteka_ime = ?, datoteka_url = ?, tip_datoteke = ?, velikost_bajtov = ? WHERE id_gradivo = ?')
      .run(file.originalname.slice(0, 255), url, kind, file.size, materialId)
  }
  res.status(201).json(toMaterial(materialById(materialId)))
})

router.get('/:id/file', (req, res) => {
  const row = materialById(req.params.id)
  if (!canView(req.user, row.id_predmet)) throw forbidden()
  if (!row.datoteka_url) throw notFound('Gradivo nima priložene datoteke.')
  sendFile(res, row.datoteka_url, row.datoteka_ime)
})

// Mehki izbris: gradivo ostane v bazi z oznako izbrisano_ob.
router.delete('/:id', requireRole('ucitelj', 'admin'), (req, res) => {
  const row = materialById(req.params.id)
  assertTeaches(req.user, row.id_predmet)
  db.prepare("UPDATE gradiva SET izbrisano_ob = datetime('now') WHERE id_gradivo = ?").run(row.id_gradivo)
  res.status(204).end()
})

export default router
