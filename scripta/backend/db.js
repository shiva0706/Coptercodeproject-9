// Uses Node's built-in sqlite module (available Node >=22.5, still marked
// experimental by Node itself). If your Node version doesn't have it,
// upgrade Node or swap this for the `better-sqlite3` package instead.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'scripta.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS brand_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tone TEXT DEFAULT '',
  audience TEXT DEFAULT '',
  rules TEXT DEFAULT '',
  sample_posts TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  status TEXT DEFAULT 'connected',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  scheduled_at TEXT,
  published_at TEXT,
  publish_result TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Lightweight migration for columns added after the original release.
// node:sqlite has no "ADD COLUMN IF NOT EXISTS", so we probe pragma
// table_info and only add what's missing - safe to run on every boot,
// and safe against an existing scripta.db with real data in it.
const postsColumns = db.prepare("PRAGMA table_info(posts)").all().map((c) => c.name);
const migrations = [
  ['media_path', "ALTER TABLE posts ADD COLUMN media_path TEXT"],
  ['media_type', "ALTER TABLE posts ADD COLUMN media_type TEXT"],
  ['campaign_id', "ALTER TABLE posts ADD COLUMN campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL"],
];
for (const [column, sql] of migrations) {
  if (!postsColumns.includes(column)) {
    db.exec(sql);
  }
}

const usersColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!usersColumns.includes('default_platforms')) {
  db.exec("ALTER TABLE users ADD COLUMN default_platforms TEXT DEFAULT ''");
}

module.exports = db;

