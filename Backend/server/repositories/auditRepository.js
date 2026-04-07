export function createAuditRepository(db) {
  return {
    write(event) {
      const stmt = db.prepare(
        `INSERT INTO audit_logs (actor_user_id, event_type, entity_type, entity_id, result, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      stmt.run(
        event.actorUserId ?? null,
        event.eventType,
        event.entityType,
        event.entityId ?? null,
        event.result,
        event.metadataJson ?? null,
        new Date().toISOString()
      );
    },
    list(filters = {}) {
      const values = [];
      const where = [];

      if (filters.eventType) {
        where.push("event_type = ?");
        values.push(filters.eventType);
      }
      if (filters.result) {
        where.push("result = ?");
        values.push(filters.result);
      }

      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const limit = Number(filters.limit || 100);
      values.push(limit);

      return db
        .prepare(
          `SELECT id, actor_user_id, event_type, entity_type, entity_id, result, metadata_json, created_at
           FROM audit_logs
           ${whereClause}
           ORDER BY created_at DESC
           LIMIT ?`
        )
        .all(...values);
    }
  };
}
