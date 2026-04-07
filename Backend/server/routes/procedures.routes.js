import { Router } from "express";

export function createProceduresRouter({ proceduresController, authMiddleware }) {
  const router = Router();

  router.get("/", authMiddleware, proceduresController.list);
  router.get("/:id", authMiddleware, proceduresController.getById);

  return router;
}
