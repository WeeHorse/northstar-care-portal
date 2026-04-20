import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip;
}

export function apiLogger(req, res, next) {
  if (!req.path.startsWith("/api")) {
    next();
    return;
  }

  const requestId = req.headers["x-request-id"] || randomUUID();
  const startedAt = Date.now();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  logger.info("API request started", {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"]
  });

  res.on("finish", () => {
    logger.info("API request completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?.id
    });
  });

  res.on("close", () => {
    if (res.writableEnded) {
      return;
    }

    logger.warn("API request aborted", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      durationMs: Date.now() - startedAt
    });
  });

  next();
}
