export function createCasesRepository(db) {
  return {
    list(filters = {}) {
      const values = [];
      const where = [];

      if (filters.status) {
        where.push("status = ?");
        values.push(filters.status);
      }
      if (filters.priority) {
        where.push("priority = ?");
        values.push(filters.priority);
      }
      if (filters.assignedUserId) {
        where.push("assigned_user_id = ?");
        values.push(filters.assignedUserId);
      }

      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const sql = `SELECT id, external_ref, title, description, status, priority, assigned_user_id, team, created_at, updated_at
                   FROM cases
                   ${whereClause}
                   ORDER BY updated_at DESC`;
      return db.prepare(sql).all(...values);
    },
    findById(id) {
      return db
        .prepare(
          `SELECT id, external_ref, title, description, status, priority, assigned_user_id, team, created_at, updated_at
           FROM cases
           WHERE id = ?`
        )
        .get(id);
    },
    create(input) {
      const stmt = db.prepare(
        `INSERT INTO cases (external_ref, title, description, status, priority, assigned_user_id, team, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const now = new Date().toISOString();
      const result = stmt.run(
        input.externalRef,
        input.title,
        input.description,
        input.status,
        input.priority,
        input.assignedUserId ?? null,
        input.team ?? null,
        now,
        now
      );
      return this.findById(result.lastInsertRowid);
    },
    update(id, input) {
      const current = this.findById(id);
      if (!current) {
        return null;
      }
      const next = {
        ...current,
        status: input.status ?? current.status,
        priority: input.priority ?? current.priority,
        assigned_user_id: input.assignedUserId ?? current.assigned_user_id,
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        team: input.team ?? current.team
      };

      db.prepare(
        `UPDATE cases
         SET title = ?, description = ?, status = ?, priority = ?, assigned_user_id = ?, team = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        next.title,
        next.description,
        next.status,
        next.priority,
        next.assigned_user_id,
        next.team,
        new Date().toISOString(),
        id
      );

      return this.findById(id);
    }
  };
}
