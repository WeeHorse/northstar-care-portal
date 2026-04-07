import jwt from "jsonwebtoken";

export function createAuthMiddleware(jwtSecret) {
  return function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = { id: decoded.sub, role: decoded.role };
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}
