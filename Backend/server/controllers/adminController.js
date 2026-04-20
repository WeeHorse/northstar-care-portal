export function createAdminController(adminService) {
  return {
    listUsers(req, res) {
      const items = adminService.listUsers();
      return res.status(200).json({ items, total: items.length });
    },
    changeUserRole(req, res) {
      const roleName = req.body?.role;
      if (!roleName) {
        return res.status(400).json({ error: "role is required" });
      }

      const result = adminService.changeUserRole({
        targetUserId: Number(req.params.id),
        roleName,
        actorUserId: req.user.id
      });

      if (result.notFound) {
        return res.status(404).json({ error: "User not found" });
      }
      if (result.invalidRole) {
        return res.status(400).json({ error: "Invalid role" });
      }
      return res.status(200).json(result);
    },
    getAuditLogs(req, res) {
      const items = adminService.listAuditLogs({
        eventType: req.query.eventType,
        result: req.query.result,
        createdFrom: req.query.createdFrom,
        createdTo: req.query.createdTo,
        actorUser: req.query.user,
        actorRole: req.query.role,
        search: req.query.search,
        limit: req.query.limit
      });
      return res.status(200).json({ items, total: items.length });
    },
    getSecurityMode(req, res) {
      return res.status(200).json(adminService.getSecurityMode());
    },
    setSecurityMode(req, res) {
      const mode = req.body?.mode;
      if (!mode) {
        return res.status(400).json({ error: "mode is required" });
      }
      const result = adminService.setSecurityMode({ mode, actorUserId: req.user.id });
      if (result.invalidMode) {
        return res.status(400).json({ error: "Invalid mode" });
      }
      return res.status(200).json(result);
    }
  };
}
