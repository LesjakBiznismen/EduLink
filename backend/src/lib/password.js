import crypto from 'node:crypto'

// Enak zapis kot v PB/insert.sql: pbkdf2_sha256$<ponovitve>$<sol v hex>$<hash v hex>
const ALGORITHM = 'pbkdf2_sha256'
const ITERATIONS = 100000
const KEY_LENGTH = 32

export function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256')
  return `${ALGORITHM}$${ITERATIONS}$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password, stored) {
  const [algorithm, iterations, salt, hash] = String(stored).split('$')
  if (algorithm !== ALGORITHM || !salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  const actual = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), Number(iterations), expected.length, 'sha256')
  return crypto.timingSafeEqual(actual, expected)
}
