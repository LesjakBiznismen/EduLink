import { Router } from 'express'
import { db, transaction } from '../db.js'
import { badRequest } from '../lib/http.js'
import { requireRole } from '../middleware/auth.js'

const router = Router()

// Predmeti, ki jih obiskuje prijavljeni učenec oziroma poučuje prijavljeni učitelj (kode predmetov).
router.get('/', (req, res) => {
  const sql = req.user.role === 'ucitelj'
    ? 'SELECT p.koda FROM ucitelji_predmeti x JOIN predmeti p USING (id_predmet) WHERE x.id_ucitelj = ? ORDER BY p.id_predmet'
    : 'SELECT p.koda FROM vpisi x JOIN predmeti p USING (id_predmet) WHERE x.id_ucenec = ? ORDER BY p.id_predmet'
  res.json(db.prepare(sql).all(req.user.id).map(r => r.koda))
})

// Učenec zamenja svoj izbor predmetov (vpisi).
router.put('/', requireRole('ucenec'), (req, res) => {
  const codes = req.body?.subjects
  if (!Array.isArray(codes) || !codes.length) throw badRequest('Izberite vsaj en predmet.')
  const unique = [...new Set(codes.map(String))]
  const rows = db.prepare(`SELECT id_predmet, koda FROM predmeti WHERE koda IN (${unique.map(() => '?').join(',')})`).all(...unique)
  if (rows.length !== unique.length) throw badRequest('Izbran je neznan predmet.')
  transaction(() => {
    const keep = new Set(rows.map(r => r.id_predmet))
    const current = db.prepare('SELECT id_predmet FROM vpisi WHERE id_ucenec = ?').all(req.user.id)
    const remove = db.prepare('DELETE FROM vpisi WHERE id_ucenec = ? AND id_predmet = ?')
    for (const { id_predmet } of current) if (!keep.has(id_predmet)) remove.run(req.user.id, id_predmet)
    const insert = db.prepare('INSERT OR IGNORE INTO vpisi (id_ucenec, id_predmet) VALUES (?, ?)')
    for (const id of keep) insert.run(req.user.id, id)
  })
  res.json(unique)
})

export default router
