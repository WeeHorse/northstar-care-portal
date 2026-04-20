function formatList(items) {
  if (!items || items.length === 0) {
    return "-";
  }

  return items.join(", ");
}

export function AuditLogTable({ items, expandedIds, onToggle }) {
  return (
    <section className="card">
      <h2>Audit Investigation</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Created</th>
              <th>Event</th>
              <th>Actor</th>
              <th>Role</th>
              <th>Result</th>
              <th>Investigate</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>No data</td>
              </tr>
            ) : (
              items.flatMap((item) => {
                const expanded = expandedIds.includes(item.id);
                const actorLabel = item.actorUsername || item.actorUserId || "-";
                const diagnostics = item.assistantDiagnostics;

                return [
                  (
                    <tr key={`audit-row-${item.id}`}>
                      <td>{item.createdAt}</td>
                      <td>{item.eventType}</td>
                      <td>{actorLabel}</td>
                      <td>{item.actorRole || "-"}</td>
                      <td>{item.result}</td>
                      <td>
                        <button className="ghost" type="button" onClick={() => onToggle(item.id)}>
                          {expanded ? "Hide details" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                  ),
                  expanded ? (
                    <tr key={`audit-detail-${item.id}`} className="audit-detail-row">
                      <td colSpan={6}>
                        <div className="audit-detail-grid">
                          <section className="audit-detail-card">
                            <h3>Generic Fields</h3>
                            <dl className="audit-detail-list">
                              <div><dt>Event type</dt><dd>{item.eventType}</dd></div>
                              <div><dt>Entity</dt><dd>{item.entityType || "-"}</dd></div>
                              <div><dt>Entity ID</dt><dd>{item.entityId || "-"}</dd></div>
                              <div><dt>Actor ID</dt><dd>{item.actorUserId || "-"}</dd></div>
                              <div><dt>Actor</dt><dd>{item.actorFullName || item.actorUsername || "-"}</dd></div>
                              <div><dt>Created</dt><dd>{item.createdAt}</dd></div>
                            </dl>
                          </section>

                          <section className="audit-detail-card">
                            <h3>Assistant Diagnostics</h3>
                            {diagnostics ? (
                              <dl className="audit-detail-list">
                                <div><dt>Mode</dt><dd>{diagnostics.mode || "-"}</dd></div>
                                <div><dt>Blocked</dt><dd>{diagnostics.blocked === null ? "-" : String(diagnostics.blocked)}</dd></div>
                                <div><dt>Source count</dt><dd>{diagnostics.sourceCount ?? "-"}</dd></div>
                                <div><dt>Internal source count</dt><dd>{diagnostics.internalSourceCount ?? "-"}</dd></div>
                                <div><dt>Mismatch count</dt><dd>{diagnostics.mismatchCount ?? "-"}</dd></div>
                                <div><dt>Session ID</dt><dd>{diagnostics.sessionId || "-"}</dd></div>
                                <div><dt>Suspicious patterns</dt><dd>{formatList(diagnostics.suspiciousPatterns)}</dd></div>
                                <div><dt>Question</dt><dd>{diagnostics.question || "-"}</dd></div>
                                <div><dt>Response preview</dt><dd>{diagnostics.responsePreview || "-"}</dd></div>
                              </dl>
                            ) : (
                              <p>No assistant-specific diagnostics for this event.</p>
                            )}
                          </section>
                        </div>

                        <section className="audit-detail-card">
                          <h3>Structured Metadata</h3>
                          <pre className="audit-metadata-view">{JSON.stringify(item.metadata || {}, null, 2)}</pre>
                        </section>
                      </td>
                    </tr>
                  ) : null
                ].filter(Boolean);
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}