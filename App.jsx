import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { socket } from "./socket.js";
import QRLogin from "./components/QRLogin.jsx";
import ContactList from "./components/Sidebar/ContactList.jsx";
import ChatWindow from "./components/ChatPane/ChatWindow.jsx";
import DetailsPanel from "./components/CustomerFile/DetailsPanel.jsx";

export default function App() {
  const [waStatus, setWaStatus] = useState("starting");
  const [qr, setQr] = useState(null);

  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState(null);

  // --- WhatsApp connection status ---
  useEffect(() => {
    api.getWaStatus().then((s) => {
      setWaStatus(s.status);
      setQr(s.qr);
    });

    function handleStatus(s) {
      setWaStatus(s.status);
      if (s.qr) setQr(s.qr);
      if (s.status === "ready") refreshContacts();
    }
    socket.on("wa:status", handleStatus);
    socket.on("wa:synced", refreshContacts);
    return () => {
      socket.off("wa:status", handleStatus);
      socket.off("wa:synced", refreshContacts);
    };
  }, []);

  function refreshContacts() {
    api.listContacts({ search, ...(stageFilter ? { stage: stageFilter } : {}) }).then(setContacts);
  }

  useEffect(() => {
    if (waStatus === "ready") refreshContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waStatus, search, stageFilter]);

  useEffect(() => {
    api.listQuickReplies().then(setQuickReplies);
  }, []);

  // --- Incoming/outgoing message events ---
  useEffect(() => {
    function handleMessage({ contact, message }) {
      setContacts((prev) => {
        const others = prev.filter((c) => c.id !== contact.id);
        return [{ ...contact, tags: prev.find((c) => c.id === contact.id)?.tags || [] }, ...others].sort(
          (a, b) => (b.last_message_at || 0) - (a.last_message_at || 0)
        );
      });
      if (message.contactId === activeId) {
        setMessages((prev) => [...prev, message]);
      }
    }
    socket.on("wa:message", handleMessage);
    return () => socket.off("wa:message", handleMessage);
  }, [activeId]);

  // --- Selecting a contact ---
  function selectContact(id) {
    setActiveId(id);
    api.listMessages(id).then(setMessages);
    api.markRead(id).then(() => {
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)));
    });
  }

  const activeContact = useMemo(() => contacts.find((c) => c.id === activeId) || null, [
    contacts,
    activeId,
  ]);

  async function handleSend(text) {
    await api.sendMessage(activeId, text);
  }

  async function handleUpdateStage(stage) {
    const updated = await api.updateContact(activeId, { stage });
    setContacts((prev) => prev.map((c) => (c.id === activeId ? updated : c)));
  }

  async function handleUpdateNotes(notes) {
    const updated = await api.updateContact(activeId, { notes });
    setContacts((prev) => prev.map((c) => (c.id === activeId ? updated : c)));
  }

  async function handleAddTag(label) {
    const updated = await api.addTag(activeId, label);
    setContacts((prev) => prev.map((c) => (c.id === activeId ? updated : c)));
  }

  async function handleRemoveTag(tagId) {
    const updated = await api.removeTag(activeId, tagId);
    setContacts((prev) => prev.map((c) => (c.id === activeId ? updated : c)));
  }

  if (waStatus !== "ready") {
    return (
      <div className="app-shell">
        <QRLogin status={waStatus} qr={qr} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <ContactList
        contacts={contacts}
        activeId={activeId}
        onSelect={selectContact}
        search={search}
        onSearchChange={setSearch}
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
      />
      <ChatWindow
        contact={activeContact}
        messages={messages}
        quickReplies={quickReplies}
        onSend={handleSend}
      />
      <DetailsPanel
        contact={activeContact}
        onUpdateStage={handleUpdateStage}
        onUpdateNotes={handleUpdateNotes}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />
    </div>
  );
}
