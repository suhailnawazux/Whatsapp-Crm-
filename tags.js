const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/tags
router.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM tags ORDER BY label ASC").all());
});

// POST /api/tags  { label, color? }
router.post("/", (req, res) => {
  const { label, color } = req.body;
  if (!label) return res.status(400).json({ error: "label is required" });
  try {
    const info = db
      .prepare("INSERT INTO tags (label, color) VALUES (?, ?)")
      .run(label, color || "#3D5C4E");
    res.json({ id: info.lastInsertRowid, label, color: color || "#3D5C4E" });
  } catch (err) {
    res.status(409).json({ error: "Tag already exists" });
  }
});

module.exports = router;
