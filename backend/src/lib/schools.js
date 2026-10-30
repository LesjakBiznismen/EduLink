import { db } from '../db.js'

// Vrne id šole z danim imenom; če je še ni, jo ustvari. Prazno ime pomeni brez šole.
export function schoolId(name) {
  const naziv = name == null ? '' : String(name).trim().slice(0, 120)
  if (!naziv) return null
  const row = db.prepare('SELECT id_sola FROM sole WHERE naziv = ?').get(naziv)
  if (row) return row.id_sola
  return Number(db.prepare('INSERT INTO sole (naziv) VALUES (?)').run(naziv).lastInsertRowid)
}
