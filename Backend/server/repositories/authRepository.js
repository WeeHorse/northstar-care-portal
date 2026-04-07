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
    },
    revokeToken({ jti, expiresAt }) {
      db.prepare(
        `INSERT OR REPLACE INTO revoked_tokens (jti, expires_at, created_at)
         VALUES (?, ?, ?)`
      ).run(jti, expiresAt, new Date().toISOString());
    },
    isTokenRevoked(jti) {
      const row = db.prepare("SELECT jti FROM revoked_tokens WHERE jti = ?").get(jti);
      return Boolean(row);
    },
    pruneExpiredRevokedTokens(nowEpochSeconds) {
      db.prepare("DELETE FROM revoked_tokens WHERE expires_at <= ?").run(nowEpochSeconds);
    }
  };
}
