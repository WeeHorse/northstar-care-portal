import { useEffect, useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";
import { ResourceTable } from "../components/ResourceTable";
import { AuditLogTable } from "../components/AuditLogTable";

const ASSISTANT_EVENT_OPTIONS = [
  "assistant_query",
  "assistant_prompt_injection_flag",
  "assistant_permission_mismatch",
  "assistant_response_blocked",
  "assistant_mode_changed"
];

export function AdminPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [mode, setMode] = useState("secure");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ eventType: "", result: "", createdFrom: "", createdTo: "", user: "", role: "", search: "" });
  const [assistantMode, setAssistantMode] = useState("safe");
  const [assistantMismatches, setAssistantMismatches] = useState([]);
  const [expandedAuditIds, setExpandedAuditIds] = useState([]);

  async function loadAdminData(activeFilters = filters) {
    setLoading(true);
    const [u, a, m, am, mm] = await Promise.all([
      api.listAdminUsers(token),
      api.listAuditLogs(token, activeFilters),
      api.getSecurityMode(token),
      api.getAssistantMode(token),
      api.listAssistantMismatches(token)
    ]);
    setUsers(u.items || []);
    setAudit(a.items || []);
    setMode(m.mode || "secure");
    setAssistantMode(am.mode || "safe");
    setAssistantMismatches(mm.items || []);
    setLoading(false);
  }

  useEffect(() => {
    if (user?.role !== "Admin") {
      setError("Admin access required");
      setLoading(false);
      return;
    }
    loadAdminData().catch((err) => {
      setError(err.message);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  async function toggleMode() {
    try {
      const next = mode === "secure" ? "misconfigured" : "secure";
      const result = await api.setSecurityMode(token, next);
      setMode(result.mode);
      loadAdminData(filters).catch((err) => setError(err.message));
    } catch (err) {
      setError(err.message);
    }
  }

  async function onRoleChange(userId, role) {
    setError("");
    try {
      await api.changeUserRole(token, userId, role);
      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, role } : item)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function applyAuditFilters(event) {
    event.preventDefault();
    setError("");
    try {
      const response = await api.listAuditLogs(token, filters);
      setAudit(response.items || []);
      setExpandedAuditIds([]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleAssistantMode() {
    setError("");
    try {
      const next = assistantMode === "safe" ? "unsafe" : "safe";
      const response = await api.setAssistantMode(token, next);
      setAssistantMode(response.mode || next);
      loadAdminData(filters).catch((err) => setError(err.message));
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleAuditDetails(id) {
    setExpandedAuditIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  if (loading) {
    return <section className="card skeleton-card"><div className="skeleton-row" /><div className="skeleton-row short" /></section>;
  }

  if (error) {
    return <section className="card"><h2>Admin</h2><p className="error">{error}</p></section>;
  }

  return (
    <div className="admin-stack">
      <section className="card">
        <h2>Security Mode</h2>
        <p>Current mode: {mode}</p>
        <button onClick={toggleMode}>Toggle Mode</button>
      </section>

      <section className="card">
        <h2>Assistant Lab Mode</h2>
        <p>Current mode: {assistantMode}</p>
        <button onClick={toggleAssistantMode}>Switch to {assistantMode === "safe" ? "Unsafe" : "Safe"} Mode</button>
      </section>
      <section className="card">
        <h2>Role Assignment</h2>
        <div className="role-grid">
          {users.map((item) => (
            <div key={item.id} className="role-row">
              <span>{item.username}</span>
              <select value={item.role} onChange={(e) => onRoleChange(item.id, e.target.value)}>
                <option value="SupportAgent">SupportAgent</option>
                <option value="Manager">Manager</option>
                <option value="Clinician">Clinician</option>
                <option value="Admin">Admin</option>
                <option value="ExternalConsultant">ExternalConsultant</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <form className="card inline-form" onSubmit={applyAuditFilters}>
        <h2>Audit Filters</h2>
        <input
          list="assistant-audit-events"
          placeholder="eventType"
          value={filters.eventType}
          onChange={(e) => setFilters((prev) => ({ ...prev, eventType: e.target.value }))}
        />
        <datalist id="assistant-audit-events">
          {ASSISTANT_EVENT_OPTIONS.map((eventType) => (
            <option key={eventType} value={eventType} />
          ))}
        </datalist>
        <select value={filters.result} onChange={(e) => setFilters((prev) => ({ ...prev, result: e.target.value }))}>
          <option value="">all results</option>
          <option value="success">success</option>
          <option value="denied">denied</option>
          <option value="warning">warning</option>
        </select>
        <input
          type="datetime-local"
          value={filters.createdFrom}
          onChange={(e) => setFilters((prev) => ({ ...prev, createdFrom: e.target.value }))}
        />
        <input
          type="datetime-local"
          value={filters.createdTo}
          onChange={(e) => setFilters((prev) => ({ ...prev, createdTo: e.target.value }))}
        />
        <input
          placeholder="user or actor id"
          value={filters.user}
          onChange={(e) => setFilters((prev) => ({ ...prev, user: e.target.value }))}
        />
        <select value={filters.role} onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}>
          <option value="">all roles</option>
          <option value="SupportAgent">SupportAgent</option>
          <option value="Manager">Manager</option>
          <option value="Clinician">Clinician</option>
          <option value="Admin">Admin</option>
          <option value="ExternalConsultant">ExternalConsultant</option>
        </select>
        <input
          placeholder="search question or response preview"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
        />
        <button type="submit">Apply</button>
      </form>

      <AuditLogTable items={audit} expandedIds={expandedAuditIds} onToggle={toggleAuditDetails} />

      <ResourceTable
        title="Assistant Permission Mismatch Events"
        items={assistantMismatches}
        columns={[
          { key: "id", label: "ID" },
          { key: "eventType", label: "Event" },
          { key: "result", label: "Result" },
          { key: "createdAt", label: "Created" }
        ]}
      />
    </div>
  );
}
