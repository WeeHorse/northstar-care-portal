function canReadProcedure(userRole, procedure) {
  if (userRole === "Admin") return true;
  if (procedure.classification === "Internal") {
    return ["SupportAgent", "Manager", "Clinician"].includes(userRole);
  }
  if (procedure.classification === "Confidential") {
    return ["Clinician", "Manager"].includes(userRole);
  }
  return false;
}

export function createProceduresService({ proceduresRepository, auditRepository }) {
  return {
    listProcedures(user) {
      const items = proceduresRepository.list().filter((item) => canReadProcedure(user.role, item));
      return items.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        classification: item.classification,
        ownerTeam: item.owner_team,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    },
    getProcedureById({ id, user }) {
      const item = proceduresRepository.findById(id);
      if (!item || !canReadProcedure(user.role, item)) {
        return null;
      }
      auditRepository.write({
        actorUserId: user.id,
        eventType: "procedure_view",
        entityType: "procedure",
        entityId: String(item.id),
        result: "success"
      });
      return {
        id: item.id,
        title: item.title,
        bodyMarkdown: item.body_markdown,
        category: item.category,
        classification: item.classification,
        ownerTeam: item.owner_team,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    }
  };
}
