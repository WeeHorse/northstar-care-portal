export function createAuditRepository(db) {
  function normalizeList(value) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter(Boolean);
    }

    return String(value).split(",").map((item) => item.trim()).filter(Boolean);
  }

  function normalizeDate(value) {
    if (!value) {
      return null;
    }

    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString();
  }

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

      const eventTypes = normalizeList(filters.eventType);

      if (eventTypes.length === 1) {
        where.push("a.event_type = ?");
        values.push(eventTypes[0]);
      }

      if (eventTypes.length > 1) {
        where.push(`a.event_type IN (${eventTypes.map(() => "?").join(", ")})`);
        values.push(...eventTypes);
      }

      if (filters.result) {
        where.push("a.result = ?");
        values.push(filters.result);
      }

      const createdFrom = normalizeDate(filters.createdFrom);
      if (createdFrom) {
        where.push("a.created_at >= ?");
        values.push(createdFrom);
      }

      const createdTo = normalizeDate(filters.createdTo);
      if (createdTo) {
        where.push("a.created_at <= ?");
        values.push(createdTo);
      }

      if (filters.actorUser) {
        const actorUser = `%${String(filters.actorUser).toLowerCase()}%`;
        where.push("(LOWER(COALESCE(u.username, '')) LIKE ? OR LOWER(COALESCE(u.full_name, '')) LIKE ? OR CAST(a.actor_user_id AS TEXT) LIKE ?)");
        values.push(actorUser, actorUser, actorUser);
      }

      if (filters.actorRole) {
        where.push("r.name = ?");
        values.push(String(filters.actorRole));
      }

      if (filters.search) {
        where.push("LOWER(COALESCE(a.metadata_json, '')) LIKE ?");
        values.push(`%${String(filters.search).toLowerCase()}%`);
      }

      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const limit = Number(filters.limit || 100);
      values.push(limit);

      return db
        .prepare(
          `SELECT a.id, a.actor_user_id, a.event_type, a.entity_type, a.entity_id, a.result, a.metadata_json, a.created_at,
                  u.username AS actor_username, u.full_name AS actor_full_name, r.name AS actor_role
           FROM audit_logs a
           LEFT JOIN users u ON u.id = a.actor_user_id
           LEFT JOIN roles r ON r.id = u.role_id
           ${whereClause}
           ORDER BY a.created_at DESC
           LIMIT ?`
        )
        .all(...values);
    }
  };
}
