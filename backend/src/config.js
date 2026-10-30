import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Koren mape backend/ (relativne poti iz .env se razrešijo glede nanj).
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const resolve = p => path.resolve(ROOT, p)

const isProduction = process.env.NODE_ENV === 'production'
if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('V produkciji mora biti nastavljena spremenljivka JWT_SECRET.')
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  dbPath: resolve(process.env.DB_PATH || '../PB/edulink.db'),
  // SQL_DIR je mapa s schema.sql in insert.sql (v Dockerju /app/sql); SEED=false ustvari prazno bazo.
  schemaPath: resolve(process.env.SCHEMA_PATH || path.join(process.env.SQL_DIR || '../PB', 'schema.sql')),
  seedPath: resolve(process.env.SEED_PATH || path.join(process.env.SQL_DIR || '../PB', 'insert.sql')),
  seed: process.env.SEED !== 'false',
  uploadDir: resolve(process.env.UPLOAD_DIR || './uploads'),
  staticDir: resolve(process.env.STATIC_DIR || '../edulink-vite/dist'),
  jwtSecret: process.env.JWT_SECRET || 'edulink-razvojna-skrivnost',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  maxFileSize: 20 * 1024 * 1024,
}
