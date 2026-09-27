const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || "./data/crm.sqlite";
const resolvedPath = path.resolve(process.cwd(), DB_PATH);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id            TEXT PRIMARY KEY,      -- whatsapp-web.js contact id (e.g. 9198xxxxxxx@c.us)
    phone         TEXT NOT NULL,
    name          TEXT NOT NULL,
    avatar_url    TEXT,
    stage         TEXT NOT NULL DEFAULT 'new',   -- new | contacted | negotiating | won | lost
    notes         TEXT NOT NULL DEFAULT '',
    last_message_at INTEGER,
    unread_count  INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS tags (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL DEFAULT '#3D5C4E'
  );

  CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id     INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (contact_id, tag_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY,       -- whatsapp-web.js message id
    contact_id  TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    body        TEXT NOT NULL DEFAULT '',
    from_me     INTEGER NOT NULL,       -- 0 | 1
    timestamp   INTEGER NOT NULL,
    ack         INTEGER NOT NULL DEFAULT 0,
    has_media   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quick_replies (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body  TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id, timestamp);
  CREATE INDEX IF NOT EXISTS idx_contacts_stage ON contacts(stage);
`);

// Seed a couple of default quick replies on first run
const quickReplyCount = db.prepare("SELECT COUNT(*) AS n FROM quick_replies").get().n;
if (quickReplyCount === 0) {
  const insert = db.prepare("INSERT INTO quick_replies (title, body) VALUES (?, ?)");
  insert.run("Greeting", "Hi! Thanks for reaching out — how can I help you today?");
  insert.run("Follow-up", "Just checking in — did you have a chance to look at the details I sent over?");
  insert.run("Pricing", "Here's our current pricing — happy to answer any questions!");
}

module.exports = db;
