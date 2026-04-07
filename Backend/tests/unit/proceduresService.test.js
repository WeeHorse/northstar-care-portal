import { describe, it, expect } from "vitest";
import { createProceduresService } from "../../server/services/proceduresService.js";

describe("proceduresService", () => {
  it("filters out confidential procedures for support role", () => {
    const service = createProceduresService({
      proceduresRepository: {
        list() {
          return [
            { id: 1, title: "Internal", classification: "Internal", category: "support", owner_team: "support", created_at: "a", updated_at: "b" },
            { id: 2, title: "Confidential", classification: "Confidential", category: "clinical", owner_team: "clinical", created_at: "a", updated_at: "b" }
          ];
        }
      },
      auditRepository: { write() { } }
    });

    const result = service.listProcedures({ id: 1, role: "SupportAgent" });
    expect(result.map((x) => x.id)).toEqual([1]);
  });

  it("returns detail for clinician", () => {
    const service = createProceduresService({
      proceduresRepository: {
        findById() {
          return {
            id: 2,
            title: "Confidential",
            body_markdown: "body",
            category: "clinical",
            classification: "Confidential",
            owner_team: "clinical",
            created_at: "a",
            updated_at: "b"
          };
        }
      },
      auditRepository: { write() { } }
    });

    const item = service.getProcedureById({ id: 2, user: { id: 3, role: "Clinician" } });
    expect(item?.title).toBe("Confidential");
  });
});
