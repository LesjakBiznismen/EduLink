import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { db } from '../db.js'
import { HttpError, forbidden } from '../lib/http.js'
import { toUser } from '../lib/mappers.js'

export const USER_SQL = `
  SELECT u.*, s.naziv AS sola FROM uporabniki u
  LEFT JOIN sole s ON s.id_sola = u.id_sola`

export const findUser = id => db.get(`${USER_SQL} WHERE u.id_uporabnik = ?`, [id])

export const signToken = user => jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })

// Prebere žeton iz glave "Authorization: Bearer ..." in v req.user shrani prijavljenega uporabnika.
export async function authenticate(req, _res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ')
  if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'Prijavite se.'))
  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret)
  } catch {
    return next(new HttpError(401, 'Seja je potekla. Prijavite se znova.'))
  }
  try {
    const row = await findUser(Number(payload.sub))
    if (!row || !row.aktiven) return next(new HttpError(401, 'Račun ne obstaja ali je onemogočen.'))
    req.user = toUser(row)
    next()
  } catch (error) {
    next(error)
  }
}

export const requireRole = (...roles) => (req, _res, next) => {
  next(roles.includes(req.user?.role) ? undefined : forbidden())
}
