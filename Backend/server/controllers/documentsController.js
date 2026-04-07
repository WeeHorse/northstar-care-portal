export function createDocumentsController(documentsService) {
  return {
    list(req, res) {
      const items = documentsService.listDocuments(req.user);
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
    }
  };
}
