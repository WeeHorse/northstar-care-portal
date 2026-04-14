export function createDocumentsService({ documentsRepository, auditRepository, storage }) {
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
    const hasFile = item.storage_path ? true : false;
    const downloadLink = hasFile ? `/api/documents/${item.id}/download` : null;

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      classification: item.classification,
      category: item.category,
      tags: parseTags(item.tags),
      fileName: item.file_name || null,
      fileMimeType: item.file_mime_type || null,
      fileSizeBytes: item.file_size_bytes ?? null,
      storagePath: item.storage_path || null,
      downloadLink,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }

  return {
    listDocuments(user, filters = {}) {
      return documentsRepository.listAccessible(user.role, filters).map(toDocumentDto);
    },
    searchDocuments({ user, title, description, tag, category, fileName }) {
      return documentsRepository.listAccessible(user.role, { title, description, tag, category, fileName }).map(toDocumentDto);
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
        uploadedByUserId: user.id,
        fileName: payload.fileName,
        fileMimeType: payload.fileMimeType,
        fileSizeBytes: payload.fileSizeBytes,
        storagePath: payload.storagePath
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
    },
    async downloadDocument({ id, user, storage: storageClient }) {
      const item = documentsRepository.findByIdAccessible(id, user.role);
      if (!item) {
        return null;
      }

      if (!item.storage_path || !item.file_name) {
        return { noFileAttached: true };
      }

      // Check file existence using storage client
      try {
        const fileExists = await storageClient.fileExists(item.storage_path);
        if (!fileExists) {
          return { noFileAttached: true };
        }

        const fileSize = await storageClient.getFileSize(item.storage_path);

        auditRepository.write({
          actorUserId: user.id,
          eventType: "document_download",
          entityType: "document",
          entityId: String(item.id),
          result: "success"
        });

        return {
          filePath: item.storage_path,
          fileName: item.file_name,
          mimeType: item.file_mime_type,
          fileSize
        };
      } catch (err) {
        console.error("Error checking file existence:", err);
        return { noFileAttached: true };
      }
    }
  };
}
