export function createAssistantController(assistantService) {
  return {
    async ask(req, res) {
      const question = req.body?.question || req.body?.message;
      if (!question) {
        return res.status(400).json({ error: "question is required" });
      }
      try {
        const result = await assistantService.ask({
          question,
          user: req.user,
          conversationId: req.body?.conversationId
        });
        return res.status(200).json(result);
      } catch (error) {
        return res.status(502).json({ error: "Assistant request failed" });
      }
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
    getMode(req, res) {
      return res.status(200).json(assistantService.getMode());
    },
    getRoleAwareMode(req, res) {
      return res.status(200).json(assistantService.getRoleAwareMode());
    },
    setMode(req, res) {
      const mode = req.body?.mode;
      if (!mode) {
        return res.status(400).json({ error: "mode is required" });
      }
      const result = assistantService.setMode({ mode, actorUserId: req.user.id });
      if (result.invalidMode) {
        return res.status(400).json({ error: "Invalid mode" });
      }
      return res.status(200).json(result);
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
