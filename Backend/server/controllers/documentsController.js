export function createDocumentsController(documentsService) {
  return {
    list(req, res) {
      const items = documentsService.listDocuments(req.user, {
        title: req.query.title,
        category: req.query.category,
        tag: req.query.tag
      });
      return res.status(200).json({ items, total: items.length });
    },
    search(req, res) {
      const items = documentsService.searchDocuments({
        user: req.user,
        title: req.query.title,
        category: req.query.category,
        tag: req.query.tag
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
    }
  };
}
