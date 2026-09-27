const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/messages/:contactId
router.get("/:contactId", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM messages WHERE contact_id = ? ORDER BY timestamp ASC")
    .all(req.params.contactId);
  res.json(rows);
});

// POST /api/messages/:contactId  { body }
router.post("/:contactId", async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: "body is required" });

  const client = req.app.locals.waClient;
  if (!client) return res.status(503).json({ error: "WhatsApp client is not ready yet" });

  try {
    const sent = await client.sendMessage(req.params.contactId, body);
    db.prepare(
      `INSERT OR IGNORE INTO messages (id, contact_id, body, from_me, timestamp, ack, has_media)
       VALUES (?, ?, ?, 1, ?, ?, 0)`
    ).run(sent.id._serialized, req.params.contactId, body, sent.timestamp, sent.ack || 0);

    db.prepare("UPDATE contacts SET last_message_at = ? WHERE id = ?").run(
      sent.timestamp,
      req.params.contactId
    );

    req.app.locals.io.emit("wa:message", {
      contact: db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.contactId),
      message: {
        id: sent.id._serialized,
        contactId: req.params.contactId,
        body,
        fromMe: true,
        timestamp: sent.timestamp,
        ack: sent.ack || 0,
        hasMedia: false,
      },
    });

    res.json({ ok: true, id: sent.id._serialized });
  } catch (err) {
    console.error("Failed to send message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
