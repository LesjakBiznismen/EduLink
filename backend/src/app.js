import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { config } from './config.js'
import { db } from './db.js'
import { HttpError } from './lib/http.js'
import { authenticate, requireRole } from './middleware/auth.js'
import auth from './routes/auth.js'
import enrollments from './routes/enrollments.js'
import subjects from './routes/subjects.js'

export const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  const { n } = db.prepare('SELECT count(*) AS n FROM uporabniki').get()
  res.json({ status: 'ok', users: n })
})

app.use('/api/auth', auth)
app.use('/api/subjects', authenticate, subjects)
app.use('/api/me/subjects', authenticate, enrollments)

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Pot API ne obstaja.')))

// Zgrajen odjemalec (edulink-vite/dist), če obstaja: statične datoteke in preusmeritev poti SPA na index.html.
if (fs.existsSync(path.join(config.staticDir, 'index.html'))) {
  app.use(express.static(config.staticDir))
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(config.staticDir, 'index.html')))
}

// Napake vrnemo kot JSON { error }. Kršitve omejitev in sprožilcev v bazi so napake vnosa.
// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message })
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Neveljaven JSON.' })
  if (error.code === 'ERR_SQLITE_ERROR') {
    const message = String(error.message)
    if (/UNIQUE/.test(message)) return res.status(409).json({ error: 'Zapis s temi podatki že obstaja.' })
    if (/CHECK|FOREIGN KEY|NOT NULL/.test(message)) return res.status(400).json({ error: 'Podatki niso veljavni.' })
    if (!/^SQLITE|no such|syntax/i.test(message)) return res.status(400).json({ error: message })
  }
  console.error(error)
  res.status(500).json({ error: 'Napaka na strežniku.' })
})
