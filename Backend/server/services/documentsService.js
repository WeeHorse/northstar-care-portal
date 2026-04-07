export function createDocumentsService({ documentsRepository, auditRepository }) {
  return {
    listDocuments(user) {
      return documentsRepository.listAccessible(user.role).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        classification: item.classification,
        category: item.category,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    },
    getDocumentById({ id, user }) {
      const item = documentsRepository.findByIdAccessible(id, user.role);
      if (!item) {
        return null;
      }
      auditRepository.write({
        actorUserId: user.id,
        eventType: "document_view",
        entityType: "document",
        entityId: String(item.id),
        result: "success"
      });
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        classification: item.classification,
        category: item.category,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    },
    createDocument({ payload, user }) {
      const created = documentsRepository.create({
        title: payload.title,
        description: payload.description,
        classification: payload.classification || "Internal",
        category: payload.category || "general",
        uploadedByUserId: user.id
      });

      const roleId = documentsRepository.findRoleIdByName(user.role);
      if (roleId) {
        documentsRepository.grantRoleAccess(created.id, roleId, "owner");
      }

      auditRepository.write({
        actorUserId: user.id,
        eventType: "document_create",
        entityType: "document",
        entityId: String(created.id),
        result: "success"
      });

      return {
        id: created.id,
        title: created.title,
        description: created.description,
        classification: created.classification,
        category: created.category,
        createdAt: created.created_at,
        updatedAt: created.updated_at
      };
    }
  };
}
