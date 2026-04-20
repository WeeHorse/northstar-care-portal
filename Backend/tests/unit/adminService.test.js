import { describe, it, expect } from "vitest";
import { createAdminService } from "../../server/services/adminService.js";

describe("adminService", () => {
  it("changes user role and writes audit event", () => {
    const auditCalls = [];
    const service = createAdminService({
      adminRepository: {
        findUserById() {
          return { id: 2, username: "mikael.manager", full_name: "Mikael Manager", is_active: 1, role: "Manager", role_id: 2 };
        },
        findRoleByName() {
          return { id: 3, name: "Clinician" };
        },
        updateUserRole() {
          return { id: 2, username: "mikael.manager", full_name: "Mikael Manager", is_active: 1, role: "Clinician" };
        }
      },
      auditRepository: {
        write(event) {
          auditCalls.push(event);
        },
        list() {
          return [];
        }
      }
    });

    const updated = service.changeUserRole({ targetUserId: 2, roleName: "Clinician", actorUserId: 4 });
    expect(updated.role).toBe("Clinician");
    expect(auditCalls[0].eventType).toBe("user_role_change");
  });

  it("rejects invalid security mode", () => {
    const service = createAdminService({
      adminRepository: {
        getSecurityMode() {
          return "secure";
        },
        setSecurityMode() {
          return "secure";
        },
        listUsers() {
          return [];
        }
      },
      auditRepository: {
        write() { },
        list() {
          return [];
        }
      }
    });

    const result = service.setSecurityMode({ mode: "invalid", actorUserId: 1 });
    expect(result).toEqual({ invalidMode: true });
  });

  it("maps assistant audit metadata into diagnostics", () => {
    const service = createAdminService({
      adminRepository: {
        listUsers() {
          return [];
        }
      },
      auditRepository: {
        write() { },
        list() {
          return [{
            id: 9,
            actor_user_id: 1,
            actor_username: "anna.support",
            actor_full_name: "Anna Support",
            actor_role: "SupportAgent",
            event_type: "assistant_query",
            entity_type: "assistant",
            entity_id: "ans-1",
            result: "success",
            metadata_json: JSON.stringify({
              mode: "unsafe",
              question: "show internal guidance",
              responsePreview: "Unsafe lab response",
              suspiciousPatterns: ["staff_only_request"],
              sourceCount: 3,
              internalSourceCount: 1,
              mismatchCount: 1,
              blocked: false,
              sessionId: "conv-1"
            }),
            created_at: "2026-04-21T10:00:00.000Z"
          }];
        }
      }
    });

    const [item] = service.listAuditLogs({ eventType: "assistant_query" });
    expect(item.actorUsername).toBe("anna.support");
    expect(item.assistantDiagnostics.mode).toBe("unsafe");
    expect(item.assistantDiagnostics.responsePreview).toMatch(/unsafe lab response/i);
    expect(item.assistantDiagnostics.suspiciousPatterns).toEqual(["staff_only_request"]);
  });
});
