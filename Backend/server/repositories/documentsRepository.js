export function createDocumentsRepository(db) {
  function buildSearchFilters(filters = {}, values = []) {
    const where = [];
    if (filters.title) {
      where.push("LOWER(d.title) LIKE ?");
      values.push(`%${String(filters.title).toLowerCase()}%`);
    }
    if (filters.category) {
      where.push("LOWER(COALESCE(d.category, '')) LIKE ?");
      values.push(`%${String(filters.category).toLowerCase()}%`);
    }
    if (filters.tag) {
      where.push("LOWER(COALESCE(d.tags, '')) LIKE ?");
      values.push(`%${String(filters.tag).toLowerCase()}%`);
    }
    return where;
  }

  return {
    listAccessible(role, filters = {}) {
      const values = [];
      const searchWhere = buildSearchFilters(filters, values);
      if (role === "Admin") {
        const whereClause = searchWhere.length ? `WHERE ${searchWhere.join(" AND ")}` : "";
        return db
          .prepare(
            `SELECT d.id, d.title, d.description, d.classification, d.category, d.tags, d.uploaded_by_user_id, d.created_at, d.updated_at
             FROM documents d
             ${whereClause}
             ORDER BY d.updated_at DESC`
          )
          .all(...values);
      }

      values.push(role);
      const whereClause = searchWhere.length ? ` AND ${searchWhere.join(" AND ")}` : "";
      return db
        .prepare(
          `SELECT DISTINCT d.id, d.title, d.description, d.classification, d.category, d.tags, d.uploaded_by_user_id, d.created_at, d.updated_at
           FROM documents d
           JOIN document_permissions dp ON dp.document_id = d.id
           JOIN roles r ON r.id = dp.role_id
           WHERE r.name = ?
           ${whereClause}
           ORDER BY d.updated_at DESC`
        )
        .all(...values);
    },
    findByIdAccessible(id, role) {
      if (role === "Admin") {
        return db
          .prepare(
            `SELECT id, title, description, classification, category, tags, uploaded_by_user_id, created_at, updated_at
             FROM documents
             WHERE id = ?`
          )
          .get(id);
      }

      return db
        .prepare(
          `SELECT d.id, d.title, d.description, d.classification, d.category, d.tags, d.uploaded_by_user_id, d.created_at, d.updated_at
           FROM documents d
           JOIN document_permissions dp ON dp.document_id = d.id
           JOIN roles r ON r.id = dp.role_id
           WHERE d.id = ? AND r.name = ?`
        )
        .get(id, role);
    },
    create(payload) {
      const now = new Date().toISOString();
      const result = db
        .prepare(
          `INSERT INTO documents (title, description, classification, category, tags, uploaded_by_user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          payload.title,
          payload.description ?? null,
          payload.classification,
          payload.category ?? null,
          payload.tags ?? null,
          payload.uploadedByUserId,
          now,
          now
        );
      return this.findByIdAccessible(result.lastInsertRowid, "Admin");
    },
    updateClassification(documentId, classification) {
      db.prepare(
        `UPDATE documents
         SET classification = ?, updated_at = ?
         WHERE id = ?`
      ).run(classification, new Date().toISOString(), documentId);
      return this.findByIdAccessible(documentId, "Admin");
    },
    grantRoleAccess(documentId, roleId, accessLevel = "read") {
      db.prepare(
        "INSERT INTO document_permissions (document_id, role_id, access_level) VALUES (?, ?, ?)"
      ).run(documentId, roleId, accessLevel);
    },
    findRoleIdByName(role) {
      const row = db.prepare("SELECT id FROM roles WHERE name = ?").get(role);
      return row?.id;
    }
  };
}
