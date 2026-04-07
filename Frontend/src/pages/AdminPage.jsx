import { useEffect, useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";
import { ResourceTable } from "../components/ResourceTable";

export function AdminPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [mode, setMode] = useState("secure");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ eventType: "", result: "" });
  const [assistantMode, setAssistantMode] = useState("disabled");
  const [assistantMismatches, setAssistantMismatches] = useState([]);

  async function loadAdminData(activeFilters = filters) {
    setLoading(true);
    const [u, a, m, am, mm] = await Promise.all([
      api.listAdminUsers(token),
      api.listAuditLogs(token, activeFilters),
      api.getSecurityMode(token),
      api.getAssistantRoleAwareMode(token),
      api.listAssistantMismatches(token)
    ]);
    setUsers(u.items || []);
    setAudit(a.items || []);
    setMode(m.mode || "secure");
    setAssistantMode(am.mode || "disabled");
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
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleAssistantMode() {
    setError("");
    try {
      const next = assistantMode === "enabled" ? "disabled" : "enabled";
      const response = await api.setAssistantRoleAwareMode(token, next);
      setAssistantMode(response.mode || next);
    } catch (err) {
      setError(err.message);
    }
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
        <h2>Assistant Guard Mode</h2>
        <p>Current mode: {assistantMode}</p>
        <button onClick={toggleAssistantMode}>Toggle Assistant Mode</button>
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
          placeholder="eventType"
          value={filters.eventType}
          onChange={(e) => setFilters((prev) => ({ ...prev, eventType: e.target.value }))}
        />
        <select value={filters.result} onChange={(e) => setFilters((prev) => ({ ...prev, result: e.target.value }))}>
          <option value="">all results</option>
          <option value="success">success</option>
          <option value="denied">denied</option>
        </select>
        <button type="submit">Apply</button>
      </form>

      <ResourceTable title="Audit Logs" items={audit} columns={[{ key: "id", label: "ID" }, { key: "eventType", label: "Event" }, { key: "result", label: "Result" }, { key: "createdAt", label: "Created" }]} />

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
