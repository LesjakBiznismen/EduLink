import fs from 'node:fs'
import { config } from '../config.js'
import { db, pool, reset } from '../db.js'

// Izbriše tabele in naložene datoteke; baza se ustvari znova iz PB/schema.sql (in PB/insert.sql).
fs.rmSync(config.uploadDir, { recursive: true, force: true })
await reset()

const { n } = await db.get('SELECT count(*) AS n FROM uporabniki')
console.log(`Baza je ponastavljena (${n} uporabnikov).`)
await pool.end()
