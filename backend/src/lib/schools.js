import { db } from '../db.js'

// Vrne id šole z danim imenom; če je še ni, jo ustvari. Prazno ime pomeni brez šole.
export async function schoolId(name) {
  const naziv = name == null ? '' : String(name).trim().slice(0, 120)
  if (!naziv) return null
  const row = await db.get('SELECT id_sola FROM sole WHERE naziv = ?', [naziv])
  if (row) return row.id_sola
  // Če šolo istočasno ustvari drug zahtevek, ON CONFLICT vrne obstoječo vrstico.
  const created = await db.get(
    'INSERT INTO sole (naziv) VALUES (?) ON CONFLICT (naziv) DO UPDATE SET naziv = EXCLUDED.naziv RETURNING id_sola',
    [naziv],
  )
  return created.id_sola
}
