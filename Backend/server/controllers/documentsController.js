import fs from "node:fs";
import { logger } from "../utils/logger.js";

export function createDocumentsController(documentsService, storage) {
  return {
    list(req, res) {
      const items = documentsService.listDocuments(req.user, {
        title: req.query.title,
        description: req.query.description,
        category: req.query.category,
        tag: req.query.tag,
        fileName: req.query.fileName
      });
      return res.status(200).json({ items, total: items.length });
    },
    search(req, res) {
      const items = documentsService.searchDocuments({
        user: req.user,
        title: req.query.title,
        description: req.query.description,
        category: req.query.category,
        tag: req.query.tag,
        fileName: req.query.fileName
      });
      return res.status(200).json({ items, total: items.length });
    },
    getById(req, res) {
      const item = documentsService.getDocumentById({ id: Number(req.params.id), user: req.user });
      if (!item) {
        return res.status(404).json({ error: "Document not found" });
      }
      return res.status(200).json(item);
    },
    create(req, res) {
      const { title } = req.body || {};
      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }
      const created = documentsService.createDocument({ payload: req.body, user: req.user });
      return res.status(201).json(created);
    },
    upload(req, res) {
      const { title } = req.body || {};
      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }
      if (!req.file) {
        return res.status(400).json({ error: "file is required" });
      }

      const created = documentsService.createDocument({
        payload: {
          ...req.body,
          fileName: req.file.originalname,
          fileMimeType: req.file.mimetype,
          fileSizeBytes: req.file.size,
          storagePath: req.uploadedFilePath || null
        },
        user: req.user
      });
      return res.status(201).json(created);
    },
    classify(req, res) {
      const classification = req.body?.classification;
      if (!classification) {
        return res.status(400).json({ error: "classification is required" });
      }

      const result = documentsService.classifyDocument({
        id: Number(req.params.id),
        classification,
        user: req.user
      });

      if (!result) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (result.invalidClassification) {
        return res.status(400).json({ error: "Invalid classification" });
      }
      return res.status(200).json(result);
    },
    async download(req, res) {
      const result = await documentsService.downloadDocument({
        id: Number(req.params.id),
        user: req.user,
        storage
      });

      if (!result) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (result.accessDenied) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (result.noFileAttached) {
        return res.status(404).json({ error: "No file attached to this document" });
      }

      try {
        // Check if file exists in storage
        const fileExists = await storage.fileExists(result.filePath);
        if (!fileExists) {
          return res.status(404).json({ error: "File not found in storage" });
        }

        res.set({
          "Content-Type": result.mimeType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${result.fileName}"`,
          "Content-Length": result.fileSize
        });

        const fileStream = await storage.createReadStream(result.filePath);
        fileStream.on("error", (err) => {
          logger.error("Document download stream failed", {
            requestId: req.requestId,
            path: result.filePath,
            documentId: Number(req.params.id),
            error: err.message
          });
          if (!res.headersSent) {
            res.status(500).json({ error: "Error reading file" });
          }
        });

        return fileStream.pipe(res);
      } catch (err) {
        logger.error("Document download failed", {
          requestId: req.requestId,
          documentId: Number(req.params.id),
          error: err.message
        });
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to retrieve file" });
        }
      }
    }
  };
}
