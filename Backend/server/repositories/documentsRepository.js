export function createDocumentsRepository(db) {
  return {
    listAccessible(role) {
      if (role === "Admin") {
        return db
          .prepare(
            `SELECT d.id, d.title, d.description, d.classification, d.category, d.uploaded_by_user_id, d.created_at, d.updated_at
             FROM documents d
             ORDER BY d.updated_at DESC`
          )
          .all();
      }

      return db
        .prepare(
          `SELECT DISTINCT d.id, d.title, d.description, d.classification, d.category, d.uploaded_by_user_id, d.created_at, d.updated_at
           FROM documents d
           JOIN document_permissions dp ON dp.document_id = d.id
           JOIN roles r ON r.id = dp.role_id
           WHERE r.name = ?
           ORDER BY d.updated_at DESC`
        )
        .all(role);
    },
    findByIdAccessible(id, role) {
      if (role === "Admin") {
        return db
          .prepare(
            `SELECT id, title, description, classification, category, uploaded_by_user_id, created_at, updated_at
             FROM documents
             WHERE id = ?`
          )
          .get(id);
      }

      return db
        .prepare(
          `SELECT d.id, d.title, d.description, d.classification, d.category, d.uploaded_by_user_id, d.created_at, d.updated_at
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
          `INSERT INTO documents (title, description, classification, category, uploaded_by_user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          payload.title,
          payload.description ?? null,
          payload.classification,
          payload.category ?? null,
          payload.uploadedByUserId,
          now,
          now
        );
      return this.findByIdAccessible(result.lastInsertRowid, "Admin");
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
