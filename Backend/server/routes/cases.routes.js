import { Router } from "express";

export function createCasesRouter({ casesController, authMiddleware }) {
  const router = Router();

  router.get("/", authMiddleware, casesController.list);
  router.post("/", authMiddleware, casesController.create);
  router.get("/:id", authMiddleware, casesController.getById);
  router.patch("/:id", authMiddleware, casesController.update);

  return router;
}
