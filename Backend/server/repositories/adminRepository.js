export function createAdminRepository(db) {
  return {
    listUsers() {
      return db
        .prepare(
          `SELECT u.id, u.username, u.full_name, u.is_active, r.name AS role
           FROM users u
           JOIN roles r ON r.id = u.role_id
           ORDER BY u.id ASC`
        )
        .all();
    },
    findUserById(id) {
      return db
        .prepare(
          `SELECT u.id, u.username, u.full_name, u.is_active, r.name AS role, u.role_id
           FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE u.id = ?`
        )
        .get(id);
    },
    findRoleByName(roleName) {
      return db.prepare("SELECT id, name FROM roles WHERE name = ?").get(roleName);
    },
    updateUserRole(userId, roleId) {
      db.prepare("UPDATE users SET role_id = ? WHERE id = ?").run(roleId, userId);
      return this.findUserById(userId);
    },
    getSecurityMode() {
      const row = db.prepare("SELECT value FROM system_settings WHERE key = 'security_mode'").get();
      return row?.value ?? "secure";
    },
    setSecurityMode(mode) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES ('security_mode', ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      ).run(mode, now);
      return this.getSecurityMode();
    }
  };
}
