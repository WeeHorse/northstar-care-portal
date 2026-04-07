export function createRecordsController(recordsService) {
  return {
    list(req, res) {
      const items = recordsService.listRecords(req.user);
      return res.status(200).json({ items, total: items.length });
    },
    getById(req, res) {
      const item = recordsService.getRecordById({ id: Number(req.params.id), user: req.user });
      if (!item) {
        return res.status(404).json({ error: "Record not found" });
      }
      return res.status(200).json(item);
    }
  };
}
