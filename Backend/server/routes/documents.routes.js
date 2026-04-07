import { Router } from "express";
import { requireRole } from "../middleware/requireRole.js";

export function createDocumentsRouter({ documentsController, authMiddleware }) {
  const router = Router();
  const adminOnly = [authMiddleware, requireRole(["Admin"])];

  router.get("/", authMiddleware, documentsController.list);
  router.get("/search", authMiddleware, documentsController.search);
  router.post("/", authMiddleware, documentsController.create);
  router.get("/:id", authMiddleware, documentsController.getById);
  router.patch("/:id/classification", ...adminOnly, documentsController.classify);

  return router;
}
