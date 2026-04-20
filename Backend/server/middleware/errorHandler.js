import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  logger.error("Unhandled API error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.id,
    error: err?.message
  });

  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: "Internal Server Error" });
}
