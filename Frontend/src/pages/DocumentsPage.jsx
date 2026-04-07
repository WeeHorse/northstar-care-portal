import { useEffect, useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";
import { ResourceTable } from "../components/ResourceTable";

export function DocumentsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ title: "", tag: "", category: "" });
  const [uploadDraft, setUploadDraft] = useState({
    title: "",
    description: "",
    classification: "Internal",
    category: "general",
    tags: "",
    file: null
  });

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

  async function onUpload(event) {
    event.preventDefault();
    setError("");
    if (!uploadDraft.file) {
      setError("Please choose a file");
      return;
    }
    try {
      const created = await api.uploadDocument(token, uploadDraft);
      setItems((prev) => [created, ...prev]);
      setUploadDraft({
        title: "",
        description: "",
        classification: "Internal",
        category: "general",
        tags: "",
        file: null
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-stack">
      <form className="card inline-form" onSubmit={onUpload}>
        <h2>Upload Document</h2>
        <input
          aria-label="Upload title"
          placeholder="title"
          value={uploadDraft.title}
          onChange={(event) => setUploadDraft((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
        <input
          placeholder="description"
          value={uploadDraft.description}
          onChange={(event) => setUploadDraft((prev) => ({ ...prev, description: event.target.value }))}
        />
        <select
          value={uploadDraft.classification}
          onChange={(event) => setUploadDraft((prev) => ({ ...prev, classification: event.target.value }))}
        >
          <option value="Public">Public</option>
          <option value="Internal">Internal</option>
          <option value="Confidential">Confidential</option>
          <option value="Restricted">Restricted</option>
        </select>
        <input
          placeholder="category"
          value={uploadDraft.category}
          onChange={(event) => setUploadDraft((prev) => ({ ...prev, category: event.target.value }))}
        />
        <input
          placeholder="tags"
          value={uploadDraft.tags}
          onChange={(event) => setUploadDraft((prev) => ({ ...prev, tags: event.target.value }))}
        />
        <input
          type="file"
          aria-label="Document file"
          onChange={(event) => setUploadDraft((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
          required
        />
        <button type="submit">Upload</button>
      </form>

      <form className="card inline-form" onSubmit={onSearch}>
        <h2>Search Documents</h2>
        <input aria-label="Search title" placeholder="title" value={filters.title} onChange={(event) => setFilters((prev) => ({ ...prev, title: event.target.value }))} />
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
