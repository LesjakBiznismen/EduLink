import { db } from '../db.js'
import { forbidden, notFound } from './http.js'

// Predmet po kodi (npr. "matematika"), ki jo odjemalec uporablja kot id.
export function subjectByCode(code) {
  const row = db.prepare('SELECT * FROM predmeti WHERE koda = ?').get(String(code))
  if (!row) throw notFound('Predmet ni najden.')
  return row
}

export const teaches = (userId, subjectId) =>
  Boolean(db.prepare('SELECT 1 FROM ucitelji_predmeti WHERE id_ucitelj = ? AND id_predmet = ?').get(userId, subjectId))

export const enrolled = (userId, subjectId) =>
  Boolean(db.prepare('SELECT 1 FROM vpisi WHERE id_ucenec = ? AND id_predmet = ?').get(userId, subjectId))

// Ali uporabnik sme videti vsebino predmeta (naloge, gradiva)?
export function canView(user, subjectId) {
  if (user.role === 'admin') return true
  if (user.role === 'ucitelj') return teaches(user.id, subjectId)
  return enrolled(user.id, subjectId)
}

export function assertTeaches(user, subjectId) {
  if (user.role === 'admin') return
  if (user.role !== 'ucitelj' || !teaches(user.id, subjectId)) throw forbidden('Tega predmeta ne poučujete.')
}

// SQL pogoj za predmete, ki jih uporabnik vidi (uporablja se kot "p.id_predmet IN (...)").
export function visibleSubjectsSql(user) {
  if (user.role === 'admin') return { sql: 'SELECT id_predmet FROM predmeti', params: [] }
  if (user.role === 'ucitelj') return { sql: 'SELECT id_predmet FROM ucitelji_predmeti WHERE id_ucitelj = ?', params: [user.id] }
  return { sql: 'SELECT id_predmet FROM vpisi WHERE id_ucenec = ?', params: [user.id] }
}
