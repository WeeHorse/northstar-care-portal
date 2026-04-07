export function createDocumentsService({ documentsRepository, auditRepository }) {
  function parseTags(rawTags) {
    if (!rawTags) return [];
    return String(rawTags)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function serializeTags(tags) {
    if (!tags) return null;
    if (Array.isArray(tags)) {
      return tags.map((tag) => String(tag).trim()).filter(Boolean).join(",");
    }
    return String(tags)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join(",");
  }

  function toDocumentDto(item) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      classification: item.classification,
      category: item.category,
      tags: parseTags(item.tags),
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }

  return {
    listDocuments(user, filters = {}) {
      return documentsRepository.listAccessible(user.role, filters).map(toDocumentDto);
    },
    searchDocuments({ user, title, tag, category }) {
      return documentsRepository.listAccessible(user.role, { title, tag, category }).map(toDocumentDto);
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
      return toDocumentDto(item);
    },
    createDocument({ payload, user }) {
      const created = documentsRepository.create({
        title: payload.title,
        description: payload.description,
        classification: payload.classification || "Internal",
        category: payload.category || "general",
        tags: serializeTags(payload.tags),
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

      return toDocumentDto(created);
    },
    classifyDocument({ id, classification, user }) {
      const allowed = new Set(["Public", "Internal", "Confidential", "Restricted"]);
      if (!allowed.has(classification)) {
        return { invalidClassification: true };
      }
      const updated = documentsRepository.updateClassification(id, classification);
      if (!updated) {
        return null;
      }
      auditRepository.write({
        actorUserId: user.id,
        eventType: "document_classify",
        entityType: "document",
        entityId: String(id),
        result: "success",
        metadataJson: JSON.stringify({ classification })
      });
      return toDocumentDto(updated);
    }
  };
}
