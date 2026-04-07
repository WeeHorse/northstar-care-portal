export function createAssistantController(assistantService) {
  return {
    ask(req, res) {
      const question = req.body?.question;
      const result = assistantService.ask({ question, user: req.user });
      return res.status(200).json(result);
    },
    getSources(req, res) {
      const data = assistantService.getAnswerSources({ answerId: req.params.answerId });
      if (!data) {
        return res.status(404).json({ error: "Assistant answer not found" });
      }
      return res.status(200).json(data);
    },
    listMismatches(req, res) {
      const items = assistantService.listPermissionMismatchEvents({ limit: req.query.limit });
      return res.status(200).json({ items, total: items.length });
    },
    getRoleAwareMode(req, res) {
      return res.status(200).json(assistantService.getRoleAwareMode());
    },
    setRoleAwareMode(req, res) {
      const mode = req.body?.mode;
      if (!mode) {
        return res.status(400).json({ error: "mode is required" });
      }
      const result = assistantService.setRoleAwareMode({ mode, actorUserId: req.user.id });
      if (result.invalidMode) {
        return res.status(400).json({ error: "Invalid mode" });
      }
      return res.status(200).json(result);
    }
  };
}
