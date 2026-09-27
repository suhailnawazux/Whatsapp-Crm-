require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const { createWhatsAppClient, getStatus } = require("./whatsapp");
const contactsRouter = require("./routes/contacts");
const messagesRouter = require("./routes/messages");
const tagsRouter = require("./routes/tags");
const quickRepliesRouter = require("./routes/quickReplies");

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CORS_ORIGIN } });

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.locals.io = io;

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.get("/api/wa/status", (req, res) => res.json(getStatus()));

app.use("/api/contacts", contactsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/quick-replies", quickRepliesRouter);

io.on("connection", (socket) => {
  socket.emit("wa:status", getStatus());
});

server.listen(PORT, () => {
  console.log(`WhatsApp CRM backend listening on http://localhost:${PORT}`);
  const client = createWhatsAppClient(io);
  app.locals.waClient = client;
});
