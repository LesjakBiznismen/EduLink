import fs from 'node:fs'
import pg from 'pg'
import { config } from './config.js'

// Datum in čas vrnemo kot nize (tako ju pričakujejo mapperji), števila kot Number.
pg.types.setTypeParser(1082, value => value) // DATE
pg.types.setTypeParser(1114, value => value) // TIMESTAMP (v UTC)
pg.types.setTypeParser(20, Number) // BIGINT (npr. count(*))
pg.types.setTypeParser(1700, Number) // NUMERIC

const SCHEMA_NAME = /^[a-z_][a-z0-9_]*$/
if (config.dbSchema && !SCHEMA_NAME.test(config.dbSchema)) throw new Error('DB_SCHEMA ima neveljavno ime.')

// V SQL stavkih pišemo ? kot označbo parametra; pg pričakuje $1, $2, ...
const placeholders = sql => {
  let n = 0
  return sql.replace(/\?/g, () => `$${++n}`)
}

// Pomočniki za poizvedbe: all = vse vrstice, get = prva vrstica, run = število prizadetih vrstic.
function api(client) {
  const query = (sql, params = []) => client.query(placeholders(sql), params)
  return {
    all: async (sql, params) => (await query(sql, params)).rows,
    get: async (sql, params) => (await query(sql, params)).rows[0],
    run: async (sql, params) => (await query(sql, params)).rowCount,
  }
}

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ...(config.dbSchema ? { options: `-c search_path=${config.dbSchema},public` } : {}),
})
export const db = api(pool)

// Izvede fn(tx) v transakciji; ob napaki spremembe razveljavi. tx ima enake metode kot db.
export async function transaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(api(client))
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}

// Ustvari tabele iz PB/schema.sql in (če seed ni izklopljen) vstavi testne podatke iz PB/insert.sql.
export async function initialize({ seed = config.seed } = {}) {
  await pool.query(fs.readFileSync(config.schemaPath, 'utf8'))
  if (seed) await pool.query(fs.readFileSync(config.seedPath, 'utf8'))
}

// Izbriše vse tabele (shemo) in bazo ustvari znova.
export async function reset(options) {
  const schema = config.dbSchema || 'public'
  await pool.query(`DROP SCHEMA ${schema} CASCADE`)
  await pool.query(`CREATE SCHEMA ${schema}`)
  await initialize(options)
}

// Izbriše shemo, ki jo je ustvaril zagon (testi); javne sheme ne briše.
export async function dropSchema() {
  if (config.dbSchema) await pool.query(`DROP SCHEMA IF EXISTS ${config.dbSchema} CASCADE`)
}

// Vsebnik z bazo se lahko zažene počasneje od aplikacije, zato povezavo poskušamo večkrat.
async function waitForDatabase(attempts = 30) {
  for (let attempt = 1; ; attempt++) {
    try {
      await pool.query('SELECT 1')
      return
    } catch (error) {
      if (attempt >= attempts) throw error
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

await waitForDatabase()
if (config.dbSchema) await pool.query(`CREATE SCHEMA IF NOT EXISTS ${config.dbSchema}`)
const { tabela } = await db.get("SELECT to_regclass(quote_ident(current_schema()) || '.uporabniki') AS tabela")
if (!tabela) await initialize()
