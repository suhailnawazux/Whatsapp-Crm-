# Ledger — an open-source WhatsApp CRM for small businesses

Most small businesses already run their customer conversations on WhatsApp.
Ledger turns that existing chat history into a lightweight CRM: every customer
gets a pipeline stage, tags, and notes, right next to the conversation itself —
no separate spreadsheet, no per-seat pricing, no Meta Business API approval
process.

It connects to a regular WhatsApp account the same way WhatsApp Web does (scan
a QR code once), so it works with the number a business is already using.

## Features

- **Live chat, in the browser.** Read and send WhatsApp messages from a normal
  web UI, backed by a real WhatsApp session (via [whatsapp-web.js](https://wwebjs.dev/)).
- **Pipeline stages.** Every customer is New lead → Contacted → Negotiating →
  Won / Lost. Click to move them, filter the customer list by stage.
- **Tags.** Freeform labels (`vip`, `wholesale`, `referral`, whatever fits the
  business) with per-tag colors.
- **Notes.** A plain-text notepad per customer for context the chat itself
  won't hold ("wants delivery on Fridays", "always pays late").
- **Quick replies.** Canned responses for the messages you type ten times a
  day, one click to drop into the composer.
- **Unread counts & live updates.** New messages arrive over a websocket and
  update the customer list instantly — no polling, no refresh.
- **Your data stays yours.** Everything is stored in a local SQLite file. No
  message content is sent to any third party.

## Architecture

```
whatsapp-crm/
├── backend/     Express API + Socket.IO + whatsapp-web.js + SQLite
└── frontend/    React (Vite) three-pane UI
```

- **WhatsApp connection** — [`whatsapp-web.js`](https://wwebjs.dev/) drives a
  headless browser session against WhatsApp Web. It's unofficial but free and
  needs no business approval, which is why it's the right fit for a small
  shop rather than the paid, application-gated Meta Cloud API.
- **Database** — SQLite via `better-sqlite3`. Four tables: `contacts`,
  `messages`, `tags` (+ `contact_tags`), and `quick_replies`. See
  `backend/src/db.js` for the schema.
- **Real-time** — Socket.IO pushes `wa:status` (QR code / connection state),
  `wa:message` (new incoming or outgoing message) and `wa:message_ack`
  (delivered/read receipts) to the frontend.
- **Frontend** — plain React + Vite, no UI framework dependency, styled with
  design tokens described in [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md).

## Getting started

Requirements: Node.js 18+, and a WhatsApp account on a phone you can scan a QR
code with.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

The first time you run it, a QR code will also be available in the frontend
(see below) — you don't need to do anything in the terminal beyond starting
the server. The WhatsApp session is saved to `backend/data/wwebjs_auth`, so you
only need to scan once.

> **Note on hosting:** `whatsapp-web.js` runs a real Chromium browser under the
> hood via Puppeteer. On a fresh Linux server you may need to install Chromium's
> system dependencies (`libnss3`, `libatk1.0-0`, etc.) — see the
> [whatsapp-web.js guide](https://wwebjs.dev/guide/) for your platform.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). You'll see a QR
code — scan it from WhatsApp on your phone under **Settings → Linked devices →
Link a device**. Once connected, your recent one-to-one chats load in as
customers automatically.

### Configuration

Both apps read `VITE_API_URL` / `VITE_SOCKET_URL` (frontend, default
`http://localhost:4000`) and `PORT` / `CORS_ORIGIN` (backend, see
`backend/.env.example`) if you need to run them on different hosts or ports.

## Roadmap ideas

These aren't built yet, but are natural next steps for contributors:

- Media messages (images/voice notes) rendered inline, not just "[media message]"
- CSV export of the customer list
- Multi-agent support (more than one teammate replying)
- Group chats (currently filtered out, since the CRM is built around 1:1
  customer relationships)

## License

MIT — see [`LICENSE`](./LICENSE). Contributions welcome.
