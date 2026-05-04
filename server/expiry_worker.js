import 'dotenv/config'
import { pool } from './db.js'

async function cleanup() {
  try {
    const res = await pool.query(
      "DELETE FROM secrets WHERE expires_at <= NOW() RETURNING id"
    )
    if (res.rowCount) console.log(`Expired cleanup: deleted ${res.rowCount} secrets`)
  } catch (err) {
    console.error('Expiry cleanup error:', err)
  }
}

async function start() {
  await cleanup()
  setInterval(cleanup, 60_000)
}

process.on('SIGINT', async () => { await pool.end(); process.exit(0) })
process.on('SIGTERM', async () => { await pool.end(); process.exit(0) })

start().catch(err => { console.error(err); process.exit(1) })
