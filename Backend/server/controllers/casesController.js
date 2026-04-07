export function createCasesController(casesService) {
  return {
    list(req, res) {
      const items = casesService.listCases({
        status: req.query.status,
        priority: req.query.priority,
        user: req.user
      });
      return res.status(200).json({ items, total: items.length });
    },
    getById(req, res) {
      const result = casesService.getCaseById({ id: Number(req.params.id), user: req.user });
      if (!result) {
        return res.status(404).json({ error: "Case not found" });
      }
      if (result.denied) {
        return res.status(403).json({ error: "Forbidden" });
      }
      return res.status(200).json(result);
    },
    create(req, res) {
      const { title, description } = req.body || {};
      if (!title || !description) {
        return res.status(400).json({ error: "title and description are required" });
      }
      const created = casesService.createCase({ payload: req.body, user: req.user });
      return res.status(201).json(created);
    },
    update(req, res) {
      const updated = casesService.updateCase({
        id: Number(req.params.id),
        payload: req.body || {},
        user: req.user
      });
      if (!updated) {
        return res.status(404).json({ error: "Case not found" });
      }
      if (updated.denied) {
        return res.status(403).json({ error: "Forbidden" });
      }
      return res.status(200).json(updated);
    }
  };
}
