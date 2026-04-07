import { Router } from "express";
import { requireRole } from "../middleware/requireRole.js";

export function createAdminRouter({ adminController, authMiddleware }) {
  const router = Router();
  const adminOnly = [authMiddleware, requireRole(["Admin"])];

  router.get("/users", ...adminOnly, adminController.listUsers);
  router.patch("/users/:id/role", ...adminOnly, adminController.changeUserRole);
  router.get("/audit", ...adminOnly, adminController.getAuditLogs);
  router.get("/settings/security-mode", ...adminOnly, adminController.getSecurityMode);
  router.patch("/settings/security-mode", ...adminOnly, adminController.setSecurityMode);

  return router;
}
