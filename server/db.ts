import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/packa',
});

// Initialize tables
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'officer'
      );

      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        timestamp TIMESTAMPTZ NOT NULL,
        image_name TEXT NOT NULL,
        product_name TEXT,
        brand_name TEXT,
        category TEXT NOT NULL,
        score INTEGER NOT NULL,
        verdict TEXT NOT NULL,
        details_json JSONB NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
      CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC);
    `);
    console.log('[DB] PostgreSQL tables initialized.');
  } finally {
    client.release();
  }
}

initDB().catch((err) => {
  console.error('[DB] Failed to initialize PostgreSQL:', err);
  process.exit(1);
});

export default pool;
