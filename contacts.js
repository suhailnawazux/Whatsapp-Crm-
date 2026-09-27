const express = require("express");
const db = require("../db");

const router = express.Router();

function attachTags(contact) {
  const tags = db
    .prepare(
      `SELECT t.id, t.label, t.color FROM tags t
       JOIN contact_tags ct ON ct.tag_id = t.id
       WHERE ct.contact_id = ?`
    )
    .all(contact.id);
  return { ...contact, tags };
}

// GET /api/contacts?search=&stage=&tag=
router.get("/", (req, res) => {
  const { search, stage, tag } = req.query;

  let sql = "SELECT DISTINCT c.* FROM contacts c";
  const where = [];
  const params = [];

  if (tag) {
    sql += " JOIN contact_tags ct ON ct.contact_id = c.id JOIN tags t ON t.id = ct.tag_id";
    where.push("t.label = ?");
    params.push(tag);
  }
  if (search) {
    where.push("(c.name LIKE ? OR c.phone LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (stage) {
    where.push("c.stage = ?");
    params.push(stage);
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(attachTags));
});

// GET /api/contacts/:id
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Contact not found" });
  res.json(attachTags(row));
});

// PATCH /api/contacts/:id  { stage?, notes?, name? }
router.patch("/:id", (req, res) => {
  const { stage, notes, name } = req.body;
  const existing = db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Contact not found" });

  db.prepare(
    `UPDATE contacts SET
       stage = COALESCE(?, stage),
       notes = COALESCE(?, notes),
       name  = COALESCE(?, name)
     WHERE id = ?`
  ).run(stage ?? null, notes ?? null, name ?? null, req.params.id);

  const updated = db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id);
  res.json(attachTags(updated));
});

// POST /api/contacts/:id/read  -> clears unread_count
router.post("/:id/read", (req, res) => {
  db.prepare("UPDATE contacts SET unread_count = 0 WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// POST /api/contacts/:id/tags  { label, color? }
router.post("/:id/tags", (req, res) => {
  const { label, color } = req.body;
  if (!label) return res.status(400).json({ error: "label is required" });

  let tag = db.prepare("SELECT * FROM tags WHERE label = ?").get(label);
  if (!tag) {
    const info = db
      .prepare("INSERT INTO tags (label, color) VALUES (?, ?)")
      .run(label, color || "#3D5C4E");
    tag = { id: info.lastInsertRowid, label, color: color || "#3D5C4E" };
  }
  db.prepare(
    "INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)"
  ).run(req.params.id, tag.id);

  const updated = attachTags(db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id));
  res.json(updated);
});

// DELETE /api/contacts/:id/tags/:tagId
router.delete("/:id/tags/:tagId", (req, res) => {
  db.prepare("DELETE FROM contact_tags WHERE contact_id = ? AND tag_id = ?").run(
    req.params.id,
    req.params.tagId
  );
  const updated = attachTags(db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id));
  res.json(updated);
});

module.exports = router;
