export function createProceduresRepository(db) {
  return {
    list() {
      return db
        .prepare(
          `SELECT id, title, body_markdown, category, classification, owner_team, created_at, updated_at
           FROM procedures
           ORDER BY updated_at DESC`
        )
        .all();
    },
    findById(id) {
      return db
        .prepare(
          `SELECT id, title, body_markdown, category, classification, owner_team, created_at, updated_at
           FROM procedures
           WHERE id = ?`
        )
        .get(id);
    }
  };
}
