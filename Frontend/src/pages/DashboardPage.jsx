import { useEffect, useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";

function Stat({ label, value }) {
  return (
    <article className="stat">
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}

export function DashboardPage() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({ cases: 0, records: 0, documents: 0, meetings: 0 });

  useEffect(() => {
    let active = true;
    Promise.all([
      api.listCases(token),
      api.listRecords(token),
      api.listDocuments(token),
      api.listMeetings(token)
    ]).then(([cases, records, documents, meetings]) => {
      if (!active) return;
      setStats({
        cases: cases.total || 0,
        records: records.total || 0,
        documents: documents.total || 0,
        meetings: meetings.total || 0
      });
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div>
      <header className="page-head">
        <h2>Welcome back, {user?.fullName || user?.username}</h2>
        <p>Role: {user?.role}</p>
      </header>
      <section className="stats-grid">
        <Stat label="Open Case Scope" value={stats.cases} />
        <Stat label="Record Scope" value={stats.records} />
        <Stat label="Document Scope" value={stats.documents} />
        <Stat label="Meeting Scope" value={stats.meetings} />
      </section>
    </div>
  );
}
