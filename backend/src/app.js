import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { config } from './config.js'
import { db } from './db.js'
import { HttpError } from './lib/http.js'
import { authenticate, requireRole } from './middleware/auth.js'
import assignments from './routes/assignments.js'
import auth from './routes/auth.js'
import calendar from './routes/calendar.js'
import enrollments from './routes/enrollments.js'
import materials from './routes/materials.js'
import profile from './routes/profile.js'
import stats from './routes/stats.js'
import subjects from './routes/subjects.js'
import submissions from './routes/submissions.js'
import users from './routes/users.js'

export const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

// Javno; preveri samo, da baza odgovarja (podatkov o uporabnikih ne razkriva).
app.get('/api/health', async (_req, res) => {
  try {
    await db.get('SELECT 1')
    res.json({ status: 'ok' })
  } catch {
    res.status(503).json({ status: 'baza ni dosegljiva' })
  }
})

app.use('/api/auth', auth)
app.use('/api/subjects', authenticate, subjects)
app.use('/api/me/subjects', authenticate, enrollments)
app.use('/api/assignments', authenticate, assignments)
app.use('/api/submissions', authenticate, submissions)
app.use('/api/materials', authenticate, materials)
app.use('/api/calendar', authenticate, calendar)
app.use('/api/profile', authenticate, profile)
app.use('/api/users', authenticate, requireRole('admin'), users)
app.use('/api/stats', authenticate, requireRole('admin'), stats)

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Pot API ne obstaja.')))

// Zgrajen odjemalec (edulink-vite/dist), če obstaja: statične datoteke in preusmeritev poti SPA na index.html.
if (fs.existsSync(path.join(config.staticDir, 'index.html'))) {
  app.use(express.static(config.staticDir))
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(config.staticDir, 'index.html')))
}

// Napake vrnemo kot JSON { error }. Kršitve omejitev in sprožilcev v bazi so napake vnosa.
// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message, ...(error.code && { code: error.code }) })
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Neveljaven JSON.' })
  // Kode napak PostgreSQL: 23505 enolična omejitev, 23503/23514/23502 tuji ključ, CHECK, NOT NULL,
  // 22xxx neveljavna vrednost, P0001 pravilo iz sprožilca (sporočilo je namenjeno uporabniku).
  if (error.code === '23505') return res.status(409).json({ error: 'Zapis s temi podatki že obstaja.' })
  if (['23503', '23514', '23502'].includes(error.code) || /^22/.test(error.code ?? '')) return res.status(400).json({ error: 'Podatki niso veljavni.' })
  if (error.code === 'P0001') return res.status(400).json({ error: error.message })
  console.error(error)
  res.status(500).json({ error: 'Napaka na strežniku.' })
})
