function nextExternalRef() {
  const stamp = Date.now().toString().slice(-6);
  return `NS-2026-${stamp}`;
}

export function createCasesService({ casesRepository, auditRepository }) {
  return {
    listCases: ({ status, priority, user }) => {
      const filters = {
        status,
        priority
      };
      if (user.role === "SupportAgent") {
        filters.assignedUserId = user.id;
      }
      return casesRepository.list(filters);
    },
    getCaseById: ({ id, user }) => {
      const item = casesRepository.findById(id);
      if (!item) {
        return null;
      }
      if (user.role === "SupportAgent" && item.assigned_user_id !== user.id) {
        auditRepository.write({
          actorUserId: user.id,
          eventType: "case_view",
          entityType: "case",
          entityId: String(id),
          result: "denied"
        });
        return { denied: true };
      }
      return item;
    },
    createCase: ({ payload, user }) => {
      const created = casesRepository.create({
        externalRef: payload.externalRef || nextExternalRef(),
        title: payload.title,
        description: payload.description,
        status: payload.status || "open",
        priority: payload.priority || "medium",
        assignedUserId: payload.assignedUserId ?? user.id,
        team: payload.team || "support"
      });
      auditRepository.write({
        actorUserId: user.id,
        eventType: "case_create",
        entityType: "case",
        entityId: String(created.id),
        result: "success"
      });
      return created;
    },
    updateCase: ({ id, payload, user }) => {
      const existing = casesRepository.findById(id);
      if (!existing) {
        return null;
      }
      if (user.role === "SupportAgent" && existing.assigned_user_id !== user.id) {
        auditRepository.write({
          actorUserId: user.id,
          eventType: "case_update",
          entityType: "case",
          entityId: String(id),
          result: "denied"
        });
        return { denied: true };
      }
      const updated = casesRepository.update(id, payload);
      auditRepository.write({
        actorUserId: user.id,
        eventType: "case_update",
        entityType: "case",
        entityId: String(id),
        result: "success"
      });
      return updated;
    }
  };
}
