import { Router } from "express";

export function createMeetingsRouter({ meetingsController, authMiddleware }) {
  const router = Router();

  router.get("/", authMiddleware, meetingsController.list);
  router.post("/", authMiddleware, meetingsController.create);
  router.patch("/:id", authMiddleware, meetingsController.update);
  router.get("/:id", authMiddleware, meetingsController.getById);

  return router;
}
