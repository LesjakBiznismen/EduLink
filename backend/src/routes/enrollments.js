import { Router } from 'express'
import { db, transaction } from '../db.js'
import { badRequest } from '../lib/http.js'
import { requireRole } from '../middleware/auth.js'

const router = Router()

// Predmeti, ki jih obiskuje prijavljeni učenec oziroma poučuje prijavljeni učitelj (kode predmetov).
router.get('/', async (req, res) => {
  const sql = req.user.role === 'ucitelj'
    ? 'SELECT p.koda FROM ucitelji_predmeti x JOIN predmeti p USING (id_predmet) WHERE x.id_ucitelj = ? ORDER BY p.id_predmet'
    : 'SELECT p.koda FROM vpisi x JOIN predmeti p USING (id_predmet) WHERE x.id_ucenec = ? ORDER BY p.id_predmet'
  res.json((await db.all(sql, [req.user.id])).map(r => r.koda))
})

// Učenec zamenja svoj izbor predmetov (vpisi).
router.put('/', requireRole('ucenec'), async (req, res) => {
  const codes = req.body?.subjects
  if (!Array.isArray(codes) || !codes.length) throw badRequest('Izberite vsaj en predmet.')
  const unique = [...new Set(codes.map(String))]
  const rows = await db.all(`SELECT id_predmet, koda FROM predmeti WHERE koda IN (${unique.map(() => '?').join(',')})`, unique)
  if (rows.length !== unique.length) throw badRequest('Izbran je neznan predmet.')
  await transaction(async tx => {
    const keep = rows.map(r => r.id_predmet)
    await tx.run('DELETE FROM vpisi WHERE id_ucenec = ? AND NOT (id_predmet = ANY(?::int[]))', [req.user.id, keep])
    for (const id of keep) await tx.run('INSERT INTO vpisi (id_ucenec, id_predmet) VALUES (?, ?) ON CONFLICT DO NOTHING', [req.user.id, id])
  })
  res.json(unique)
})

export default router
