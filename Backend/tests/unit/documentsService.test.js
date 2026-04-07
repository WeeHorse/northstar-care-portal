import { describe, it, expect } from "vitest";
import { createDocumentsService } from "../../server/services/documentsService.js";

describe("documentsService", () => {
  it("maps list output fields", () => {
    const service = createDocumentsService({
      documentsRepository: {
        listAccessible() {
          return [
            {
              id: 1,
              title: "Guide",
              description: "desc",
              classification: "Internal",
              category: "procedure",
              tags: "triage,policy",
              file_name: "guide.pdf",
              file_mime_type: "application/pdf",
              file_size_bytes: 2048,
              storage_path: "uploads/guide.pdf",
              created_at: "2026-01-01",
              updated_at: "2026-01-02"
            }
          ];
        }
      },
      auditRepository: { write() { } }
    });

    const result = service.listDocuments({ id: 1, role: "SupportAgent" });
    expect(result[0]).toEqual({
      id: 1,
      title: "Guide",
      description: "desc",
      classification: "Internal",
      category: "procedure",
      tags: ["triage", "policy"],
      fileName: "guide.pdf",
      fileMimeType: "application/pdf",
      fileSizeBytes: 2048,
      storagePath: "uploads/guide.pdf",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02"
    });
  });

  it("creates document and grants creator role access", () => {
    const calls = [];
    const service = createDocumentsService({
      documentsRepository: {
        create(payload) {
          calls.push(["create", payload]);
          return {
            id: 10,
            title: payload.title,
            description: payload.description,
            classification: payload.classification,
            category: payload.category,
            created_at: "t1",
            updated_at: "t1"
          };
        },
        findRoleIdByName() {
          return 2;
        },
        grantRoleAccess(documentId, roleId, accessLevel) {
          calls.push(["grantRoleAccess", documentId, roleId, accessLevel]);
        }
      },
      auditRepository: { write() { } }
    });

    const created = service.createDocument({
      payload: {
        title: "Policy",
        fileName: "policy.txt",
        fileMimeType: "text/plain",
        fileSizeBytes: 64,
        storagePath: "uploads/policy.txt"
      },
      user: { id: 5, role: "Manager" }
    });

    expect(created.id).toBe(10);
    expect(calls[0][1].fileName).toBe("policy.txt");
    expect(calls[1]).toEqual(["grantRoleAccess", 10, 2, "owner"]);
  });

  it("classifies document with valid level", () => {
    const service = createDocumentsService({
      documentsRepository: {
        updateClassification() {
          return {
            id: 1,
            title: "Policy",
            description: "",
            classification: "Restricted",
            category: "policy",
            tags: null,
            created_at: "t1",
            updated_at: "t2"
          };
        }
      },
      auditRepository: { write() { } }
    });

    const updated = service.classifyDocument({
      id: 1,
      classification: "Restricted",
      user: { id: 4, role: "Admin" }
    });

    expect(updated.classification).toBe("Restricted");
  });
});
