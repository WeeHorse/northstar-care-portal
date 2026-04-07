import { Router } from "express";

export function createRecordsRouter({ recordsController, authMiddleware }) {
  const router = Router();

  router.get("/", authMiddleware, recordsController.list);
  router.get("/:id", authMiddleware, recordsController.getById);

  return router;
}
