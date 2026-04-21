import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
const sqlite = openDatabaseSync('trips.db');
sqlite.execSync(`
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  notes TEXT
);
`);
sqlite.execSync(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#2D6A8F',
  icon TEXT NOT NULL DEFAULT 'compass',
  user_id INTEGER
);
`);
sqlite.execSync(`
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  category_id INTEGER,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  duration_mins INTEGER,
  count INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);
`);
sqlite.execSync(`
CREATE TABLE IF NOT EXISTS targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  trip_id INTEGER,
  category_id INTEGER,
  label TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'weekly',
  target_value INTEGER NOT NULL
);
`);
try {
  sqlite.execSync(`ALTER TABLE targets ADD COLUMN user_id INTEGER;`);
} catch (_) {}
try {
  sqlite.execSync(`ALTER TABLE targets ADD COLUMN period TEXT NOT NULL DEFAULT 'weekly';`);
} catch (_) {}
sqlite.execSync(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`);
try {
  sqlite.execSync(`ALTER TABLE trips ADD COLUMN user_id INTEGER;`);
} catch (_) {}
try {
  sqlite.execSync(`ALTER TABLE trips ADD COLUMN accommodation_name TEXT;`);
} catch (_) {}
try {
  sqlite.execSync(`ALTER TABLE trips ADD COLUMN accommodation_cost TEXT;`);
} catch (_) {}
try {
  sqlite.execSync(`ALTER TABLE trips ADD COLUMN notes TEXT;`);
} catch (_) {}
try {
  sqlite.execSync(`ALTER TABLE categories ADD COLUMN color TEXT NOT NULL DEFAULT '#2D6A8F';`);
} catch (_) {}
try {
  sqlite.execSync(`ALTER TABLE categories ADD COLUMN icon TEXT NOT NULL DEFAULT 'compass';`);
} catch (_) {}
try {
  sqlite.execSync(`ALTER TABLE categories ADD COLUMN user_id INTEGER;`);
} catch (_) {}
try {
  sqlite.execSync(`ALTER TABLE activities ADD COLUMN start_time TEXT;`);
} catch (_) {}
try {
  sqlite.execSync(`ALTER TABLE activities ADD COLUMN location TEXT;`);
} catch (_) {}
try {
  sqlite.execSync(`ALTER TABLE activities ADD COLUMN cost TEXT;`);
} catch (_) {}
try {
  sqlite.execSync(`ALTER TABLE activities ADD COLUMN participants TEXT;`);
} catch (_) {}
export const db = drizzle(sqlite);