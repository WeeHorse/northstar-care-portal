import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

export function createAuthService({ authRepository, auditRepository, jwtSecret }) {
  return {
    login: ({ username, password }) => {
      const user = authRepository.findUserByUsername(username);
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        auditRepository.write({
          actorUserId: null,
          eventType: "login_attempt",
          entityType: "auth",
          entityId: username,
          result: "denied",
          metadataJson: JSON.stringify({ username })
        });
        return null;
      }

      const token = jwt.sign({ sub: user.id, role: user.role, jti: randomUUID() }, jwtSecret, { expiresIn: "8h" });
      auditRepository.write({
        actorUserId: user.id,
        eventType: "login_attempt",
        entityType: "auth",
        entityId: String(user.id),
        result: "success",
        metadataJson: JSON.stringify({ username: user.username })
      });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role
        }
      };
    },
    me: (userId) => authRepository.findUserById(userId),
    logout: ({ tokenJti, tokenExp, userId }) => {
      if (tokenJti) {
        authRepository.revokeToken({ jti: tokenJti, expiresAt: tokenExp || 0 });
      }
      authRepository.pruneExpiredRevokedTokens(Math.floor(Date.now() / 1000));
      auditRepository.write({
        actorUserId: userId,
        eventType: "logout",
        entityType: "auth",
        entityId: String(userId),
        result: "success"
      });
      return { message: "Logged out" };
    }
  };
}
