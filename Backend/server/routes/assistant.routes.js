import { Router } from "express";
import { requireRole } from "../middleware/requireRole.js";

export function createAssistantRouter({ assistantController, authMiddleware }) {
  const router = Router();
  const adminOnly = [authMiddleware, requireRole(["Admin"])];

  router.post("/ask", authMiddleware, assistantController.ask);
  router.get("/sources/:answerId", authMiddleware, assistantController.getSources);
  router.get("/mismatches", ...adminOnly, assistantController.listMismatches);
  router.get("/settings/role-aware-mode", ...adminOnly, assistantController.getRoleAwareMode);
  router.patch("/settings/role-aware-mode", ...adminOnly, assistantController.setRoleAwareMode);

  return router;
}
