import { useEffect, useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";
import { ResourceTable } from "../components/ResourceTable";

export function MeetingsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ title: "", startAt: "", endAt: "", meetingType: "digital" });
  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState({ title: "", startAt: "", endAt: "", meetingType: "digital" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.listMeetings(token)
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

  async function onCreateMeeting(event) {
    event.preventDefault();
    setError("");
    const tempId = `tmp-${Date.now()}`;
    const optimistic = { id: tempId, ...draft };
    setItems((prev) => [optimistic, ...prev]);
    try {
      const created = await api.createMeeting(token, draft);
      setItems((prev) => prev.map((item) => (item.id === tempId ? created : item)));
      setDraft({ title: "", startAt: "", endAt: "", meetingType: "digital" });
    } catch (err) {
      setItems((prev) => prev.filter((item) => item.id !== tempId));
      setError(err.message);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditingDraft({
      title: item.title || "",
      startAt: item.startAt || "",
      endAt: item.endAt || "",
      meetingType: item.meetingType || "digital"
    });
  }

  async function onSaveEdit() {
    if (!editingId) return;
    setError("");
    const previous = items;
    setItems((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...editingDraft } : item)));
    try {
      const updated = await api.updateMeeting(token, editingId, editingDraft);
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
        <h2>Create Meeting</h2>
        <form className="inline-form" onSubmit={onCreateMeeting}>
          <input placeholder="Title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} required />
          <input placeholder="Start (ISO)" value={draft.startAt} onChange={(e) => setDraft((d) => ({ ...d, startAt: e.target.value }))} required />
          <input placeholder="End (ISO)" value={draft.endAt} onChange={(e) => setDraft((d) => ({ ...d, endAt: e.target.value }))} required />
          <select value={draft.meetingType} onChange={(e) => setDraft((d) => ({ ...d, meetingType: e.target.value }))}>
            <option value="digital">digital</option>
            <option value="internal">internal</option>
          </select>
          <button type="submit">Create Meeting</button>
        </form>
      </section>

      {editingId ? (
        <section className="card">
          <h2>Edit Meeting #{editingId}</h2>
          <form className="inline-form" onSubmit={(e) => { e.preventDefault(); onSaveEdit(); }}>
            <input value={editingDraft.title} onChange={(e) => setEditingDraft((d) => ({ ...d, title: e.target.value }))} />
            <input value={editingDraft.startAt} onChange={(e) => setEditingDraft((d) => ({ ...d, startAt: e.target.value }))} />
            <input value={editingDraft.endAt} onChange={(e) => setEditingDraft((d) => ({ ...d, endAt: e.target.value }))} />
            <select value={editingDraft.meetingType} onChange={(e) => setEditingDraft((d) => ({ ...d, meetingType: e.target.value }))}>
              <option value="digital">digital</option>
              <option value="internal">internal</option>
            </select>
            <button type="submit">Save</button>
            <button type="button" className="ghost" onClick={() => setEditingId(null)}>Cancel</button>
          </form>
        </section>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <ResourceTable title="Meetings" items={items} columns={[{ key: "id", label: "ID" }, { key: "title", label: "Title" }, { key: "meetingType", label: "Type" }, { key: "startAt", label: "Start" }]} />

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
