import { useEffect, useRef, useState } from "react";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWindow({ contact, messages, quickReplies, onSend }) {
  const [draft, setDraft] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, contact?.id]);

  if (!contact) {
    return (
      <main
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-muted)",
        }}
      >
        Pick a customer on the left to see the conversation
      </main>
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  return (
    <main style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <header
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 500 }}>{contact.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{contact.phone}</div>
        </div>
      </header>

      <div
        className="scroll-y"
        style={{
          flex: 1,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.from_me ? "flex-end" : "flex-start",
              maxWidth: "70%",
              background: m.from_me ? "var(--thread-out)" : "var(--thread-in)",
              color: m.from_me ? "var(--thread-out-ink)" : "var(--thread-in-ink)",
              border: m.from_me ? "none" : "1px solid var(--rule)",
              borderRadius: "var(--radius)",
              padding: "8px 12px",
            }}
          >
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {m.has_media && !m.body ? "[media message]" : m.body}
            </div>
            <div
              style={{
                fontSize: 10,
                opacity: 0.7,
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {formatTime(m.timestamp)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {showQuick && quickReplies.length > 0 && (
        <div
          style={{
            borderTop: "1px solid var(--rule)",
            padding: "10px 20px",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {quickReplies.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                setDraft(q.body);
                setShowQuick(false);
              }}
              style={{
                fontSize: 12,
                padding: "6px 10px",
                border: "1px solid var(--rule)",
                borderRadius: 2,
                background: "var(--panel)",
              }}
            >
              {q.title}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          borderTop: "1px solid var(--rule)",
          padding: "14px 20px",
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={() => setShowQuick((v) => !v)}
          title="Quick replies"
          style={{
            border: "1px solid var(--rule)",
            borderRadius: "var(--radius)",
            background: "var(--panel)",
            padding: "10px 12px",
            flexShrink: 0,
          }}
        >
          ⚡
        </button>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Write a reply…"
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            padding: "10px 12px",
            border: "1px solid var(--rule)",
            borderRadius: "var(--radius)",
            background: "var(--panel)",
            color: "var(--ink)",
          }}
        />
        <button
          type="submit"
          style={{
            background: "var(--pine)",
            color: "var(--thread-out-ink)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "10px 16px",
            flexShrink: 0,
          }}
        >
          Send
        </button>
      </form>
    </main>
  );
}
