const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getWaStatus: () => request("/wa/status"),

  listContacts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/contacts${qs ? `?${qs}` : ""}`);
  },
  getContact: (id) => request(`/contacts/${encodeURIComponent(id)}`),
  updateContact: (id, patch) =>
    request(`/contacts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  markRead: (id) => request(`/contacts/${encodeURIComponent(id)}/read`, { method: "POST" }),
  addTag: (id, label, color) =>
    request(`/contacts/${encodeURIComponent(id)}/tags`, {
      method: "POST",
      body: JSON.stringify({ label, color }),
    }),
  removeTag: (id, tagId) =>
    request(`/contacts/${encodeURIComponent(id)}/tags/${tagId}`, { method: "DELETE" }),

  listMessages: (contactId) => request(`/messages/${encodeURIComponent(contactId)}`),
  sendMessage: (contactId, body) =>
    request(`/messages/${encodeURIComponent(contactId)}`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  listTags: () => request("/tags"),
  createTag: (label, color) =>
    request("/tags", { method: "POST", body: JSON.stringify({ label, color }) }),

  listQuickReplies: () => request("/quick-replies"),
};
