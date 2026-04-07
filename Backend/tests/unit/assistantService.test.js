import { describe, it, expect } from "vitest";
import { createAssistantService } from "../../server/services/assistantService.js";

describe("assistantService", () => {
  it("returns answer with sources and mismatch when role-aware mode is disabled", () => {
    const service = createAssistantService({
      documentsRepository: {
        listAccessible(role) {
          if (role === "Admin") {
            return [{ id: 10, title: "Clinical Data Handling", description: "sensitive", classification: "Confidential", category: "policy" }];
          }
          return [];
        },
        findByIdAccessible() {
          return null;
        }
      },
      proceduresRepository: {
        list() {
          return [];
        },
        findById() {
          return null;
        }
      },
      adminRepository: {
        getAssistantRoleAwareMode() {
          return "disabled";
        },
        setAssistantRoleAwareMode(mode) {
          return mode;
        }
      },
      auditRepository: {
        write() {},
        list() {
          return [];
        }
      }
    });

    const result = service.ask({ question: "clinical", user: { id: 1, role: "SupportAgent" } });
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.permissionMismatches.length).toBeGreaterThan(0);
  });

  it("updates role-aware mode", () => {
    const service = createAssistantService({
      documentsRepository: {
        listAccessible() {
          return [];
        },
        findByIdAccessible() {
          return null;
        }
      },
      proceduresRepository: {
        list() {
          return [];
        },
        findById() {
          return null;
        }
      },
      adminRepository: {
        getAssistantRoleAwareMode() {
          return "disabled";
        },
        setAssistantRoleAwareMode(mode) {
          return mode;
        }
      },
      auditRepository: {
        write() {},
        list() {
          return [];
        }
      }
    });

    const result = service.setRoleAwareMode({ mode: "enabled", actorUserId: 4 });
    expect(result.mode).toBe("enabled");
  });
});
