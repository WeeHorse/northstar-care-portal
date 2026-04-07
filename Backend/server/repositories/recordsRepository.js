export function createRecordsRepository(db) {
  return {
    list() {
      return db
        .prepare(
          `SELECT id, patient_ref, summary, status, sensitivity_level, last_contact_at, owner_team, created_at, updated_at
           FROM records
           ORDER BY updated_at DESC`
        )
        .all();
    },
    findById(id) {
      return db
        .prepare(
          `SELECT id, patient_ref, summary, status, sensitivity_level, last_contact_at, owner_team, created_at, updated_at
           FROM records
           WHERE id = ?`
        )
        .get(id);
    }
  };
}
