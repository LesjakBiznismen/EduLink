import { Router } from 'express'
import { db } from '../db.js'
import { HttpError, badRequest, conflict, isEmail, text } from '../lib/http.js'
import { toUser } from '../lib/mappers.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { schoolId } from '../lib/schools.js'
import { findUser } from '../middleware/auth.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(req.user)
})

// Uporabnik uredi svoje podatke; telefon, naziv in kabinet so namenjeni učiteljem.
router.put('/', async (req, res) => {
  const body = req.body ?? {}
  const first = text(body.first, { field: 'Ime', required: true, max: 60 })
  const last = text(body.last, { field: 'Priimek', required: true, max: 60 })
  const email = text(body.email, { field: 'E-naslov', max: 120 }) || req.user.email
  if (!isEmail(email)) throw badRequest('Vnesite veljaven e-naslov.')
  if (await db.get('SELECT 1 FROM uporabniki WHERE e_posta = ? AND id_uporabnik <> ?', [email, req.user.id])) throw conflict('E-naslov že uporablja drug račun.')
  const extra = field => text(body[field], { field, max: 100 }) || null
  await db.run(`
    UPDATE uporabniki SET ime = ?, priimek = ?, e_posta = ?, id_sola = ?, telefon = ?, naziv = ?, kabinet = ?
    WHERE id_uporabnik = ?`,
  [first, last, email, await schoolId(body.school), extra('phone'), extra('title'), extra('office'), req.user.id])
  res.json(toUser(await findUser(req.user.id)))
})

router.put('/password', async (req, res) => {
  const current = String(req.body?.current ?? '')
  const next = String(req.body?.next ?? '')
  const row = await findUser(req.user.id)
  if (!verifyPassword(current, row.geslo_hash)) throw new HttpError(400, 'Trenutno geslo ni pravilno.')
  if (next.length < 8) throw badRequest('Novo geslo naj ima vsaj 8 znakov.')
  await db.run('UPDATE uporabniki SET geslo_hash = ? WHERE id_uporabnik = ?', [hashPassword(next), req.user.id])
  res.status(204).end()
})

export default router
