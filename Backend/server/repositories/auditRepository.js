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
    }
  };
}
