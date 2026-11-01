import { Router } from 'express'
import { db } from '../db.js'
import { assertTeaches, subjectByCode, visibleSubjectsSql } from '../lib/access.js'
import { badRequest, forbidden, id, isDate, notFound, text } from '../lib/http.js'
import { requireRole } from '../middleware/auth.js'

const router = Router()
const KINDS = ['test', 'ustno', 'dogodek', 'pocitnice']

// Roki nalog in dogodki (pogled "koledar") za predmete uporabnika ter dogodki za vso šolo.
router.get('/', async (req, res) => {
  const visible = visibleSubjectsSql(req.user)
  const params = [...visible.params]
  let where = `WHERE (k.id_predmet IS NULL OR k.id_predmet IN (${visible.sql}))`
  for (const [key, op] of [['from', '>='], ['to', '<=']]) {
    if (!req.query[key]) continue
    if (!isDate(String(req.query[key]))) throw badRequest(`Neveljaven datum »${key}«.`)
    where += ` AND k.datum ${op} ?`
    params.push(String(req.query[key]))
  }
  const rows = await db.all(`
    SELECT k.*, p.koda FROM koledar k LEFT JOIN predmeti p ON p.id_predmet = k.id_predmet
    ${where} ORDER BY k.datum, k.cas`, params)
  res.json(rows.map(r => ({
    source: r.vir === 'naloga' ? 'assignment' : 'event',
    id: r.id,
    subject: r.koda ?? null,
    subjectName: r.predmet ?? null,
    title: r.naslov,
    kind: r.vrsta,
    date: r.datum,
    time: r.cas ? r.cas.slice(0, 5) : null,
  })))
})

// Učitelj doda dogodek pri svojem predmetu; administrator tudi dogodek za vso šolo (brez predmeta).
router.post('/events', requireRole('ucitelj', 'admin'), async (req, res) => {
  const body = req.body ?? {}
  const title = text(body.title, { field: 'Naslov', required: true, max: 120 })
  const description = text(body.description, { field: 'Opis', max: 1000 }) || null
  const kind = String(body.kind || 'dogodek')
  if (!KINDS.includes(kind)) throw badRequest('Neznana vrsta dogodka.')
  const date = String(body.date ?? '')
  if (!isDate(date)) throw badRequest('Izberite veljaven datum.')
  const time = body.time ? String(body.time) : null
  if (time && !/^\d{2}:\d{2}$/.test(time)) throw badRequest('Čas mora biti v obliki HH:MM.')
  let subjectId = null
  if (body.subject) {
    subjectId = (await subjectByCode(body.subject)).id_predmet
    await assertTeaches(req.user, subjectId)
  } else if (req.user.role !== 'admin') {
    throw forbidden('Dogodek za vso šolo lahko doda samo administrator.')
  }
  const start = `${date} ${time || '00:00'}:00`
  const created = await db.get(
    'INSERT INTO dogodki (id_predmet, ustvaril, naslov, opis, vrsta, zacetek, ves_dan) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id_dogodek',
    [subjectId, req.user.id, title, description, kind, start, time ? 0 : 1],
  )
  res.status(201).json({ id: created.id_dogodek })
})

router.delete('/events/:id', requireRole('ucitelj', 'admin'), async (req, res) => {
  const event = await db.get('SELECT * FROM dogodki WHERE id_dogodek = ?', [id(req.params.id)])
  if (!event) throw notFound('Dogodek ni najden.')
  if (event.id_predmet) await assertTeaches(req.user, event.id_predmet)
  else if (req.user.role !== 'admin') throw forbidden()
  await db.run('DELETE FROM dogodki WHERE id_dogodek = ?', [event.id_dogodek])
  res.status(204).end()
})

export default router
