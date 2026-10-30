import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { config } from './config.js'

// Stolpci, ki so bili dodani shemi kasneje; starejšim bazam jih dodamo ob zagonu.
const MIGRATIONS = [
  ['uporabniki', 'telefon', 'TEXT'],
  ['uporabniki', 'naziv', 'TEXT'],
  ['uporabniki', 'kabinet', 'TEXT'],
]

// Novo bazo napolni s shemo in testnimi podatki iz mape PB/.
export function initialize(db, { seed = true } = {}) {
  db.exec(fs.readFileSync(config.schemaPath, 'utf8'))
  if (seed) db.exec(fs.readFileSync(config.seedPath, 'utf8'))
}

function migrate(db) {
  for (const [table, column, type] of MIGRATIONS) {
    const exists = db.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = ?`).get(column)
    if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
  }
}

export function openDatabase(file = config.dbPath) {
  const isNew = file === ':memory:' || !fs.existsSync(file)
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;')
  if (isNew) initialize(db)
  migrate(db)
  return db
}

export const db = openDatabase()

// Izvede fn v transakciji; ob napaki spremembe razveljavi.
export function transaction(fn) {
  db.exec('BEGIN')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}
