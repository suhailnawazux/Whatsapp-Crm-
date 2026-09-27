const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/quick-replies
router.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM quick_replies ORDER BY id ASC").all());
});

// POST /api/quick-replies  { title, body }
router.post("/", (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: "title and body are required" });
  const info = db
    .prepare("INSERT INTO quick_replies (title, body) VALUES (?, ?)")
    .run(title, body);
  res.json({ id: info.lastInsertRowid, title, body });
});

// DELETE /api/quick-replies/:id
router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM quick_replies WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
