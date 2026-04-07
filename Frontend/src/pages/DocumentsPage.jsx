import { useEffect, useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";
import { ResourceTable } from "../components/ResourceTable";

export function DocumentsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ title: "", tag: "", category: "" });

  useEffect(() => {
    api.listDocuments(token).then((res) => setItems(res.items || [])).catch(() => setItems([]));
  }, [token]);

  async function onSearch(event) {
    event.preventDefault();
    setError("");
    try {
      const result = await api.searchDocuments(token, filters);
      setItems(result.items || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function onClassify(documentId, classification) {
    setError("");
    try {
      const updated = await api.classifyDocument(token, documentId, classification);
      setItems((prev) => prev.map((item) => (item.id === documentId ? updated : item)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-stack">
      <form className="card inline-form" onSubmit={onSearch}>
        <h2>Search Documents</h2>
        <input placeholder="title" value={filters.title} onChange={(event) => setFilters((prev) => ({ ...prev, title: event.target.value }))} />
        <input placeholder="tag" value={filters.tag} onChange={(event) => setFilters((prev) => ({ ...prev, tag: event.target.value }))} />
        <input placeholder="category" value={filters.category} onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))} />
        <button type="submit">Search</button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <ResourceTable
        title="Documents"
        items={items}
        columns={[
          { key: "id", label: "ID" },
          { key: "title", label: "Title" },
          { key: "classification", label: "Class" },
          { key: "category", label: "Category" }
        ]}
      />

      {user?.role === "Admin" ? (
        <section className="card">
          <h3>Classify Documents</h3>
          <div className="role-grid">
            {items.map((item) => (
              <div key={item.id} className="role-row">
                <span>{item.title}</span>
                <select value={item.classification || "Internal"} onChange={(event) => onClassify(item.id, event.target.value)}>
                  <option value="Public">Public</option>
                  <option value="Internal">Internal</option>
                  <option value="Confidential">Confidential</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
