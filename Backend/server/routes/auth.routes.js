import { Router } from "express";

export function createAuthRouter({ authController, authMiddleware }) {
  const router = Router();

  router.post("/login", authController.login);
  router.post("/logout", authMiddleware, authController.logout);
  router.get("/me", authMiddleware, authController.me);

  return router;
}
