import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../app/api";
import { useAuth } from "../app/auth";

export function CaseDetailPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getCase(token, id)
      .then((result) => {
        if (!active) return;
        setItem(result);
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
  }, [token, id]);

  if (loading) {
    return <section className="card skeleton-card"><div className="skeleton-row" /><div className="skeleton-row short" /></section>;
  }

  if (error) {
    return <section className="card"><h2>Case Detail</h2><p className="error">{error}</p></section>;
  }

  if (!item) {
    return <section className="card"><h2>Case Detail</h2><p>No case found</p></section>;
  }

  return (
    <section className="card">
      <h2>Case #{item.id}</h2>
      <p><strong>Title:</strong> {item.title}</p>
      <p><strong>Description:</strong> {item.description}</p>
      <p><strong>Status:</strong> {item.status}</p>
      <p><strong>Priority:</strong> {item.priority}</p>
      <p><strong>Team:</strong> {item.team || "-"}</p>
      <p><strong>External Ref:</strong> {item.external_ref || item.externalRef || "-"}</p>
      <p><strong>Updated:</strong> {item.updated_at || item.updatedAt || "-"}</p>
    </section>
  );
}
