import { Router } from 'express'
import { db } from '../db.js'
import { HttpError, badRequest, conflict, isEmail, text } from '../lib/http.js'
import { toUser } from '../lib/mappers.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { schoolId } from '../lib/schools.js'
import { USER_SQL, authenticate, findUser, signToken } from '../middleware/auth.js'

const router = Router()

// Prijava z uporabniškim imenom ali e-naslovom in geslom.
router.post('/login', async (req, res) => {
  const login = text(req.body?.username, { field: 'Uporabniško ime', required: true, max: 120 })
  const password = String(req.body?.password ?? '')
  const row = await db.get(`${USER_SQL} WHERE u.uporabnisko_ime = ? OR u.e_posta = ?`, [login, login])
  if (!row || !verifyPassword(password, row.geslo_hash)) throw new HttpError(401, 'Napačno uporabniško ime ali geslo.')
  if (!row.aktiven) throw new HttpError(403, 'Račun je onemogočen.')
  const user = toUser(row)
  res.json({ token: signToken(user), user })
})

// Registracija novega učenca.
router.post('/register', async (req, res) => {
  const body = req.body ?? {}
  const first = text(body.first, { field: 'Ime', required: true, max: 60 })
  const last = text(body.last, { field: 'Priimek', required: true, max: 60 })
  const email = text(body.email, { field: 'E-naslov', required: true, max: 120 })
  const username = text(body.username, { field: 'Uporabniško ime', required: true, max: 50 })
  const password = String(body.password ?? '')
  if (!isEmail(email)) throw badRequest('Vnesite veljaven e-naslov.')
  if (username.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(username)) throw badRequest('Uporabniško ime naj ima vsaj 3 znake (črke, številke, pika, vezaj).')
  if (password.length < 8) throw badRequest('Geslo naj ima vsaj 8 znakov.')
  if (await db.get('SELECT 1 FROM uporabniki WHERE uporabnisko_ime = ?', [username])) throw conflict('Uporabniško ime je že zasedeno.')
  if (await db.get('SELECT 1 FROM uporabniki WHERE e_posta = ?', [email])) throw conflict('E-naslov je že registriran.')

  const created = await db.get(`
    INSERT INTO uporabniki (e_posta, uporabnisko_ime, geslo_hash, ime, priimek, vloga, id_sola)
    VALUES (?, ?, ?, ?, ?, 'ucenec', ?) RETURNING id_uporabnik`,
  [email, username, hashPassword(password), first, last, await schoolId(body.school)])
  const user = toUser(await findUser(created.id_uporabnik))
  res.status(201).json({ token: signToken(user), user })
})

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user })
})

export default router
