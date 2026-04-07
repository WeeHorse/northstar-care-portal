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
        write() {},
        list() {
          return [];
        }
      }
    });

    const result = service.setSecurityMode({ mode: "invalid", actorUserId: 1 });
    expect(result).toEqual({ invalidMode: true });
  });
});
