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

export const api = {
  login: (username, password) => request("/api/auth/login", { method: "POST", body: { username, password } }),
  me: (token) => request("/api/auth/me", { token }),
  listCases: (token) => request("/api/cases", { token }),
  createCase: (token, payload) => request("/api/cases", { method: "POST", token, body: payload }),
  updateCase: (token, id, payload) => request(`/api/cases/${id}`, { method: "PATCH", token, body: payload }),
  listRecords: (token) => request("/api/records", { token }),
  listDocuments: (token) => request("/api/documents", { token }),
  listProcedures: (token) => request("/api/procedures", { token }),
  listMeetings: (token) => request("/api/meetings", { token }),
  createMeeting: (token, payload) => request("/api/meetings", { method: "POST", token, body: payload }),
  updateMeeting: (token, id, payload) => request(`/api/meetings/${id}`, { method: "PATCH", token, body: payload }),
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
