import jwt from "jsonwebtoken";

export function createAuthMiddleware({ jwtSecret, authRepository }) {
  return function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      if (decoded.jti && authRepository.isTokenRevoked(decoded.jti)) {
        return res.status(401).json({ error: "Invalid token" });
      }
      req.user = { id: decoded.sub, role: decoded.role };
      req.auth = { token, jti: decoded.jti, exp: decoded.exp };
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}
