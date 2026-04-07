import { useEffect, useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";
import { ResourceTable } from "../components/ResourceTable";

export function CasesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ title: "", description: "", priority: "medium" });
  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState({ title: "", status: "open", priority: "medium" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .listCases(token)
      .then((res) => {
        if (!active) return;
        setItems(res.items || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function onCreateCase(event) {
    event.preventDefault();
    setError("");
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      title: draft.title,
      description: draft.description,
      status: "open",
      priority: draft.priority
    };
    setItems((prev) => [optimistic, ...prev]);

    try {
      const created = await api.createCase(token, draft);
      setItems((prev) => prev.map((item) => (item.id === tempId ? created : item)));
      setDraft({ title: "", description: "", priority: "medium" });
    } catch (err) {
      setItems((prev) => prev.filter((item) => item.id !== tempId));
      setError(err.message);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditingDraft({
      title: item.title || "",
      status: item.status || "open",
      priority: item.priority || "medium"
    });
  }

  async function onSaveEdit() {
    if (!editingId) return;
    setError("");
    const previous = items;
    setItems((prev) =>
      prev.map((item) => (item.id === editingId ? { ...item, ...editingDraft } : item))
    );
    try {
      const updated = await api.updateCase(token, editingId, editingDraft);
      setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      setEditingId(null);
    } catch (err) {
      setItems(previous);
      setError(err.message);
    }
  }

  if (loading) {
    return <section className="card skeleton-card"><div className="skeleton-row" /><div className="skeleton-row short" /></section>;
  }

  return (
    <div className="admin-stack">
      <section className="card">
        <h2>Create Case</h2>
        <form className="inline-form" onSubmit={onCreateCase}>
          <input placeholder="Title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} required />
          <input placeholder="Description" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} required />
          <select value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
          <button type="submit">Create Case</button>
        </form>
      </section>

      {editingId ? (
        <section className="card">
          <h2>Edit Case #{editingId}</h2>
          <form className="inline-form" onSubmit={(e) => { e.preventDefault(); onSaveEdit(); }}>
            <input value={editingDraft.title} onChange={(e) => setEditingDraft((d) => ({ ...d, title: e.target.value }))} />
            <select value={editingDraft.status} onChange={(e) => setEditingDraft((d) => ({ ...d, status: e.target.value }))}>
              <option value="open">open</option>
              <option value="closed">closed</option>
            </select>
            <select value={editingDraft.priority} onChange={(e) => setEditingDraft((d) => ({ ...d, priority: e.target.value }))}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <button type="submit">Save</button>
            <button type="button" className="ghost" onClick={() => setEditingId(null)}>Cancel</button>
          </form>
        </section>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <ResourceTable title="Cases" items={items} columns={[{ key: "id", label: "ID" }, { key: "title", label: "Title" }, { key: "status", label: "Status" }, { key: "priority", label: "Priority" }]} />

      <section className="card">
        <h3>Quick Edit</h3>
        <div className="chip-list">
          {items.map((item) => (
            <button key={item.id} className="ghost" onClick={() => startEdit(item)}>
              Edit #{item.id}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
