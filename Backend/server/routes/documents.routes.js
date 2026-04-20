import { Router } from "express";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { requireRole } from "../middleware/requireRole.js";
import { logger } from "../utils/logger.js";

export function createDocumentsRouter({ documentsController, authMiddleware, storage }) {
  const router = Router();
  const adminOnly = [authMiddleware, requireRole(["Admin"])];
  const allowedMimeTypes = new Set([
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]);
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
      if (!allowedMimeTypes.has(file.mimetype)) {
        cb(new Error("Unsupported file type"));
        return;
      }
      cb(null, true);
    }
  });

  function parseUpload(req, res, next) {
    upload.single("file")(req, res, (err) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File too large" });
        return;
      }
      res.status(400).json({ error: err.message || "Upload failed" });
    });
  }

  async function persistUpload(req, res, next) {
    if (!req.file) {
      next();
      return;
    }
    try {
      const extension = path.extname(req.file.originalname) || ".bin";
      const fileName = `${Date.now()}-${randomUUID()}${extension}`;
      const result = await storage.saveFile(fileName, req.file.buffer);
      req.uploadedFilePath = result.path;
      req.uploadedFileName = result.fileName;
      next();
    } catch (err) {
      logger.error("Document upload persistence failed", {
        requestId: req.requestId,
        originalFileName: req.file?.originalname,
        error: err.message
      });
      res.status(500).json({ error: "Failed to save file" });
    }
  }

  router.get("/", authMiddleware, documentsController.list);
  router.get("/search", authMiddleware, documentsController.search);
  router.post("/", authMiddleware, documentsController.create);
  router.post("/upload", authMiddleware, parseUpload, persistUpload, documentsController.upload);
  router.get("/:id", authMiddleware, documentsController.getById);
  router.get("/:id/download", authMiddleware, documentsController.download);
  router.patch("/:id/classification", ...adminOnly, documentsController.classify);

  return router;
}
