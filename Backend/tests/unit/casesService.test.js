import { describe, it, expect } from "vitest";
import { createCasesService } from "../../server/services/casesService.js";

describe("casesService", () => {
  it("applies support agent scope on list", () => {
    const seen = { filters: null };
    const service = createCasesService({
      casesRepository: {
        list(filters) {
          seen.filters = filters;
          return [];
        }
      },
      auditRepository: { write() { } }
    });

    service.listCases({ status: "open", priority: "high", user: { id: 7, role: "SupportAgent" } });

    expect(seen.filters).toEqual({ status: "open", priority: "high", assignedUserId: 7 });
  });

  it("denies support agent from reading non-assigned case", () => {
    const writes = [];
    const service = createCasesService({
      casesRepository: {
        findById() {
          return { id: 1, assigned_user_id: 2 };
        }
      },
      auditRepository: {
        write(event) {
          writes.push(event);
        }
      }
    });

    const result = service.getCaseById({ id: 1, user: { id: 1, role: "SupportAgent" } });
    expect(result).toEqual({ denied: true });
    expect(writes[0]?.result).toBe("denied");
  });
});
