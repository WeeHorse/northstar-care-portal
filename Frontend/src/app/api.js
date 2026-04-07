const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

async function requestForm(path, { method = "POST", token, formData } = {}) {
  const headers = {};
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: formData
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

export const api = {
  login: (username, password) => request("/api/auth/login", { method: "POST", body: { username, password } }),
  me: (token) => request("/api/auth/me", { token }),
  logout: (token) => request("/api/auth/logout", { method: "POST", token }),
  listCases: (token) => request("/api/cases", { token }),
  getCase: (token, id) => request(`/api/cases/${id}`, { token }),
  createCase: (token, payload) => request("/api/cases", { method: "POST", token, body: payload }),
  updateCase: (token, id, payload) => request(`/api/cases/${id}`, { method: "PATCH", token, body: payload }),
  listRecords: (token) => request("/api/records", { token }),
  listDocuments: (token, filters = {}) => {
    const query = new URLSearchParams();
    if (filters.title) query.set("title", filters.title);
    if (filters.tag) query.set("tag", filters.tag);
    if (filters.category) query.set("category", filters.category);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/api/documents${suffix}`, { token });
  },
  searchDocuments: (token, filters = {}) => {
    const query = new URLSearchParams();
    if (filters.title) query.set("title", filters.title);
    if (filters.tag) query.set("tag", filters.tag);
    if (filters.category) query.set("category", filters.category);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/api/documents/search${suffix}`, { token });
  },
  uploadDocument: (token, payload) => {
    const formData = new FormData();
    formData.append("title", payload.title || "");
    if (payload.description) formData.append("description", payload.description);
    if (payload.classification) formData.append("classification", payload.classification);
    if (payload.category) formData.append("category", payload.category);
    if (payload.tags) formData.append("tags", payload.tags);
    if (payload.file) formData.append("file", payload.file);

    return requestForm("/api/documents/upload", { method: "POST", token, formData });
  },
  classifyDocument: (token, id, classification) =>
    request(`/api/documents/${id}/classification`, { method: "PATCH", token, body: { classification } }),
  listProcedures: (token) => request("/api/procedures", { token }),
  listMeetings: (token, filters = {}) => {
    const query = new URLSearchParams();
    if (filters.team) query.set("team", filters.team);
    if (filters.day) query.set("day", filters.day);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/api/meetings${suffix}`, { token });
  },
  createMeeting: (token, payload) => request("/api/meetings", { method: "POST", token, body: payload }),
  updateMeeting: (token, id, payload) => request(`/api/meetings/${id}`, { method: "PATCH", token, body: payload }),
  askAssistant: (token, question) => request("/api/assistant/ask", { method: "POST", token, body: { question } }),
  getAssistantSources: (token, answerId) => request(`/api/assistant/sources/${answerId}`, { token }),
  getAssistantRoleAwareMode: (token) => request("/api/assistant/settings/role-aware-mode", { token }),
  setAssistantRoleAwareMode: (token, mode) =>
    request("/api/assistant/settings/role-aware-mode", { method: "PATCH", token, body: { mode } }),
  listAssistantMismatches: (token) => request("/api/assistant/mismatches", { token }),
  listAdminUsers: (token) => request("/api/admin/users", { token }),
  changeUserRole: (token, id, role) =>
    request(`/api/admin/users/${id}/role`, { method: "PATCH", token, body: { role } }),
  listAuditLogs: (token, filters = {}) => {
    const query = new URLSearchParams();
    if (filters.eventType) query.set("eventType", filters.eventType);
    if (filters.result) query.set("result", filters.result);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/api/admin/audit${suffix}`, { token });
  },
  getSecurityMode: (token) => request("/api/admin/settings/security-mode", { token }),
  setSecurityMode: (token, mode) =>
    request("/api/admin/settings/security-mode", { method: "PATCH", token, body: { mode } })
};
