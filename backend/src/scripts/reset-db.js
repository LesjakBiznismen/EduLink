import fs from 'node:fs'
import { config } from '../config.js'

// Izbriše bazo in naložene datoteke; ob naslednjem zagonu se baza ustvari znova iz PB/.
for (const file of [config.dbPath, `${config.dbPath}-journal`, `${config.dbPath}-wal`, `${config.dbPath}-shm`]) {
  fs.rmSync(file, { force: true })
}
fs.rmSync(config.uploadDir, { recursive: true, force: true })

const { db } = await import('../db.js')
const count = db.prepare('SELECT count(*) AS n FROM uporabniki').get().n
console.log(`Baza ${config.dbPath} je ponastavljena (${count} uporabnikov).`)
