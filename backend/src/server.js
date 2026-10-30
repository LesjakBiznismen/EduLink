// EduLink backend: REST API nad SQLite bazo iz mape PB/.
import express from 'express'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const PORT = Number(process.env.PORT ?? 3000)
const DB_PATH = process.env.DB_PATH ?? 'data/edulink.db'
const SQL_DIR = process.env.SQL_DIR ?? '../PB'

// Ob prvem zagonu ustvari bazo iz sheme in jo napolni s testnimi podatki.
const novaBaza = !existsSync(DB_PATH)
mkdirSync(dirname(DB_PATH), { recursive: true })
const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA foreign_keys = ON;')
if (novaBaza) {
  db.exec(readFileSync(join(SQL_DIR, 'schema.sql'), 'utf8'))
  if (process.env.SEED !== 'false') db.exec(readFileSync(join(SQL_DIR, 'insert.sql'), 'utf8'))
  console.log(`Ustvarjena nova baza ${DB_PATH}`)
}

const app = express()
app.use(express.json())

const vse = (sql, ...params) => db.prepare(sql).all(...params)

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.get('/api/uporabniki', (req, res) => {
  const { vloga } = req.query
  const sql = `SELECT id_uporabnik, uporabnisko_ime, e_posta, ime, priimek, vloga, id_sola, aktiven
               FROM uporabniki ${vloga ? 'WHERE vloga = ?' : ''} ORDER BY priimek, ime`
  res.json(vloga ? vse(sql, vloga) : vse(sql))
})

app.get('/api/predmeti', (req, res) => {
  res.json(vse('SELECT * FROM predmeti ORDER BY naziv'))
})

app.get('/api/predmeti/:id', (req, res) => {
  const predmet = db.prepare('SELECT * FROM predmeti WHERE id_predmet = ?').get(req.params.id)
  if (!predmet) return res.status(404).json({ napaka: 'Predmet ne obstaja' })
  predmet.ucitelji = vse(
    `SELECT u.id_uporabnik, u.ime, u.priimek FROM ucitelji_predmeti up
     JOIN uporabniki u ON u.id_uporabnik = up.id_ucitelj WHERE up.id_predmet = ?`,
    req.params.id,
  )
  res.json(predmet)
})

app.get('/api/predmeti/:id/naloge', (req, res) => {
  res.json(vse('SELECT * FROM naloge WHERE id_predmet = ? ORDER BY rok_oddaje', req.params.id))
})

app.get('/api/predmeti/:id/gradiva', (req, res) => {
  res.json(vse(
    'SELECT * FROM gradiva WHERE id_predmet = ? AND izbrisano_ob IS NULL ORDER BY dodano_ob DESC',
    req.params.id,
  ))
})

app.get('/api/koledar', (req, res) => {
  res.json(vse('SELECT * FROM koledar ORDER BY datum, cas'))
})

app.use((req, res) => res.status(404).json({ napaka: 'Ni najdeno' }))

app.listen(PORT, () => console.log(`EduLink API posluša na vratih ${PORT}`))
