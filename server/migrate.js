import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import { pool } from './db.js'

async function run() {
  const sqlPath = path.resolve('./server/sql/schema.sql')
  const sql = await fs.readFile(sqlPath, 'utf8')
  console.log('Running migrations from', sqlPath)
  // run the SQL; ensure your schema.sql uses IF NOT EXISTS for idempotency
  await pool.query(sql)
  console.log('Migrations applied')
  await pool.end()
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
