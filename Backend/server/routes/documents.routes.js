import { Router } from "express";

export function createDocumentsRouter({ documentsController, authMiddleware }) {
  const router = Router();

  router.get("/", authMiddleware, documentsController.list);
  router.post("/", authMiddleware, documentsController.create);
  router.get("/:id", authMiddleware, documentsController.getById);

  return router;
}
