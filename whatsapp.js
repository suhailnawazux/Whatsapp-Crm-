const path = require("path");
const qrcode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const db = require("./db");

const SESSION_PATH = process.env.WWEBJS_SESSION_PATH || "./data/wwebjs_auth";

let status = "starting"; // starting | qr | authenticated | ready | disconnected
let lastQr = null;

function upsertContactRow({ id, phone, name, avatarUrl }) {
  const existing = db.prepare("SELECT id FROM contacts WHERE id = ?").get(id);
  if (existing) {
    db.prepare(
      `UPDATE contacts SET
         phone = ?,
         name = COALESCE(NULLIF(?, ''), name),
         avatar_url = COALESCE(?, avatar_url)
       WHERE id = ?`
    ).run(phone, name, avatarUrl, id);
  } else {
    db.prepare(
      `INSERT INTO contacts (id, phone, name, avatar_url, stage)
       VALUES (?, ?, ?, ?, 'new')`
    ).run(id, phone, name || phone, avatarUrl || null);
  }
}

function touchLastMessage(contactId, timestampSeconds, bumpUnread) {
  db.prepare(
    `UPDATE contacts SET
       last_message_at = ?,
       unread_count = unread_count + ?
     WHERE id = ?`
  ).run(timestampSeconds, bumpUnread ? 1 : 0, contactId);
}

function saveMessage(msg, contactId) {
  db.prepare(
    `INSERT OR IGNORE INTO messages (id, contact_id, body, from_me, timestamp, ack, has_media)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    msg.id._serialized,
    contactId,
    msg.body || (msg.hasMedia ? "[media]" : ""),
    msg.fromMe ? 1 : 0,
    msg.timestamp,
    msg.ack || 0,
    msg.hasMedia ? 1 : 0
  );
}

function createWhatsAppClient(io) {
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.resolve(process.cwd(), SESSION_PATH) }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", async (qr) => {
    status = "qr";
    lastQr = await qrcode.toDataURL(qr);
    io.emit("wa:status", { status, qr: lastQr });
  });

  client.on("authenticated", () => {
    status = "authenticated";
    io.emit("wa:status", { status });
  });

  client.on("ready", async () => {
    status = "ready";
    lastQr = null;
    io.emit("wa:status", { status });
    await syncRecentChats(client, io);
  });

  client.on("disconnected", (reason) => {
    status = "disconnected";
    io.emit("wa:status", { status, reason });
  });

  client.on("message", async (msg) => {
    await handleIncomingOrOutgoing(msg, client, io);
  });

  client.on("message_create", async (msg) => {
    // fires for messages sent from THIS client (e.g. from your own phone too)
    if (msg.fromMe) {
      await handleIncomingOrOutgoing(msg, client, io);
    }
  });

  client.on("message_ack", (msg, ack) => {
    db.prepare("UPDATE messages SET ack = ? WHERE id = ?").run(ack, msg.id._serialized);
    io.emit("wa:message_ack", { messageId: msg.id._serialized, ack });
  });

  client.initialize();
  return client;
}

async function handleIncomingOrOutgoing(msg, client, io) {
  try {
    const chat = await msg.getChat();
    if (chat.isGroup) return; // small-business CRM: 1:1 customer chats only, for now

    const contactId = chat.id._serialized;
    const contact = await chat.getContact();
    upsertContactRow({
      id: contactId,
      phone: contact.number || contactId.split("@")[0],
      name: contact.pushname || contact.name || contact.number || contactId,
      avatarUrl: null,
    });

    saveMessage(msg, contactId);
    touchLastMessage(contactId, msg.timestamp, !msg.fromMe);

    const row = db.prepare("SELECT * FROM contacts WHERE id = ?").get(contactId);
    io.emit("wa:message", {
      contact: row,
      message: {
        id: msg.id._serialized,
        contactId,
        body: msg.body,
        fromMe: msg.fromMe,
        timestamp: msg.timestamp,
        ack: msg.ack || 0,
        hasMedia: msg.hasMedia,
      },
    });
  } catch (err) {
    console.error("Failed to process WhatsApp message:", err);
  }
}

async function syncRecentChats(client, io) {
  try {
    const chats = await client.getChats();
    const individual = chats.filter((c) => !c.isGroup).slice(0, 100);
    for (const chat of individual) {
      const contact = await chat.getContact();
      const contactId = chat.id._serialized;
      upsertContactRow({
        id: contactId,
        phone: contact.number || contactId.split("@")[0],
        name: contact.pushname || contact.name || contact.number || contactId,
        avatarUrl: null,
      });
      if (chat.lastMessage) {
        touchLastMessage(contactId, chat.lastMessage.timestamp, false);
      }
    }
    io.emit("wa:synced");
  } catch (err) {
    console.error("Initial chat sync failed:", err);
  }
}

function getStatus() {
  return { status, qr: lastQr };
}

module.exports = { createWhatsAppClient, getStatus };
