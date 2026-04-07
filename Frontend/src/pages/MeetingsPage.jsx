import { useEffect, useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";
import { ResourceTable } from "../components/ResourceTable";

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function toDisplayDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function MeetingsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ day: "", team: "" });
  const [filterDraft, setFilterDraft] = useState({ day: "", team: "" });
  const [draft, setDraft] = useState({ title: "", startAt: "", endAt: "", meetingType: "digital" });
  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState({ title: "", startAt: "", endAt: "", meetingType: "digital" });
  const tableItems = items.map((item) => ({
    ...item,
    startAtDisplay: toDisplayDateTime(item.startAt),
    endAtDisplay: toDisplayDateTime(item.endAt)
  }));

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.listMeetings(token, filters)
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
  }, [token, filters]);

  function applyFilters(event) {
    event.preventDefault();
    setError("");
    setFilters({ ...filterDraft });
  }

  async function onCreateMeeting(event) {
    event.preventDefault();
    setError("");
    const payload = {
      ...draft,
      startAt: toIsoDateTime(draft.startAt),
      endAt: toIsoDateTime(draft.endAt)
    };
    const tempId = `tmp-${Date.now()}`;
    const optimistic = { id: tempId, ...payload };
    setItems((prev) => [optimistic, ...prev]);
    try {
      const created = await api.createMeeting(token, payload);
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
      startAt: toDateTimeLocalValue(item.startAt),
      endAt: toDateTimeLocalValue(item.endAt),
      meetingType: item.meetingType || "digital"
    });
  }

  async function onSaveEdit() {
    if (!editingId) return;
    setError("");
    const payload = {
      ...editingDraft,
      startAt: toIsoDateTime(editingDraft.startAt),
      endAt: toIsoDateTime(editingDraft.endAt)
    };
    const previous = items;
    setItems((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
    try {
      const updated = await api.updateMeeting(token, editingId, payload);
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
        <h2>Filter Meetings</h2>
        <form className="inline-form" onSubmit={applyFilters}>
          <input
            type="date"
            value={filterDraft.day}
            onChange={(e) => setFilterDraft((prev) => ({ ...prev, day: e.target.value }))}
          />
          <input
            placeholder="team"
            value={filterDraft.team}
            onChange={(e) => setFilterDraft((prev) => ({ ...prev, team: e.target.value }))}
          />
          <button type="submit">Apply Filters</button>
        </form>
      </section>

      <section className="card">
        <h2>Create Meeting</h2>
        <form className="inline-form" onSubmit={onCreateMeeting}>
          <input placeholder="Title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} required />
          <input type="datetime-local" aria-label="Start" value={draft.startAt} onChange={(e) => setDraft((d) => ({ ...d, startAt: e.target.value }))} required />
          <input type="datetime-local" aria-label="End" value={draft.endAt} onChange={(e) => setDraft((d) => ({ ...d, endAt: e.target.value }))} required />
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
            <input type="datetime-local" aria-label="Edit start" value={editingDraft.startAt} onChange={(e) => setEditingDraft((d) => ({ ...d, startAt: e.target.value }))} />
            <input type="datetime-local" aria-label="Edit end" value={editingDraft.endAt} onChange={(e) => setEditingDraft((d) => ({ ...d, endAt: e.target.value }))} />
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

      <ResourceTable title="Meetings" items={tableItems} columns={[{ key: "id", label: "ID" }, { key: "title", label: "Title" }, { key: "meetingType", label: "Type" }, { key: "startAtDisplay", label: "Start" }, { key: "endAtDisplay", label: "End" }]} />

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
