export function createAuthRepository(db) {
  return {
    findUserByUsername(username) {
      return db
        .prepare(
          `SELECT u.id, u.username, u.password_hash, u.full_name, r.name AS role
           FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE u.username = ? AND u.is_active = 1`
        )
        .get(username);
    },
    findUserById(id) {
      return db
        .prepare(
          `SELECT u.id, u.username, u.full_name, r.name AS role
           FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE u.id = ? AND u.is_active = 1`
        )
        .get(id);
    }
  };
}
