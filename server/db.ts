import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'packa.sqlite'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'officer'
  );

  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    image_name TEXT NOT NULL,
    product_name TEXT,
    brand_name TEXT,
    category TEXT NOT NULL,
    score INTEGER NOT NULL,
    verdict TEXT NOT NULL,
    details_json TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

export default db;
