import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Koren mape backend/ (relativne poti iz .env se razrešijo glede nanj).
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const resolve = p => path.resolve(ROOT, p)

// Brez skrivnosti bi lahko kdorkoli podpisal veljaven žeton, zato je obvezna v vseh okoljih.
if (!process.env.JWT_SECRET) {
  throw new Error('Nastavite spremenljivko JWT_SECRET (datoteka .env ali okolje).')
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  // PostgreSQL teče v svojem vsebniku (storitev "db" v docker-compose.yml).
  databaseUrl: process.env.DATABASE_URL || 'postgres://edulink:edulink@localhost:5433/edulink',
  // Neobvezna shema (npr. za teste); povezava uporablja search_path "<shema>, public".
  dbSchema: process.env.DB_SCHEMA || '',
  // SQL_DIR je mapa s schema.sql in insert.sql (v Dockerju /app/sql); SEED=false ustvari prazno bazo.
  schemaPath: resolve(process.env.SCHEMA_PATH || path.join(process.env.SQL_DIR || '../PB', 'schema.sql')),
  seedPath: resolve(process.env.SEED_PATH || path.join(process.env.SQL_DIR || '../PB', 'insert.sql')),
  seed: process.env.SEED !== 'false',
  uploadDir: resolve(process.env.UPLOAD_DIR || './uploads'),
  staticDir: resolve(process.env.STATIC_DIR || '../edulink-vite/dist'),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  maxFileSize: 20 * 1024 * 1024,
}
