export function createProceduresController(proceduresService) {
  return {
    list(req, res) {
      const items = proceduresService.listProcedures(req.user);
      return res.status(200).json({ items, total: items.length });
    },
    getById(req, res) {
      const item = proceduresService.getProcedureById({ id: Number(req.params.id), user: req.user });
      if (!item) {
        return res.status(404).json({ error: "Procedure not found" });
      }
      return res.status(200).json(item);
    }
  };
}
