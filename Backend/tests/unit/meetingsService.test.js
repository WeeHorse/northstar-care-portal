import { describe, it, expect } from "vitest";
import { createMeetingsService } from "../../server/services/meetingsService.js";

describe("meetingsService", () => {
  it("applies support user scope on list", () => {
    let received;
    const service = createMeetingsService({
      meetingsRepository: {
        list(filters) {
          received = filters;
          return [];
        }
      },
      auditRepository: { write() { } }
    });

    service.listMeetings({ user: { id: 8, role: "SupportAgent" } });
    expect(received).toEqual({ createdByUserId: 8 });
  });

  it("denies non-owner support user from reading meeting", () => {
    const service = createMeetingsService({
      meetingsRepository: {
        findById() {
          return { id: 1, created_by_user_id: 2, team: "support" };
        }
      },
      auditRepository: { write() { } }
    });

    const item = service.getMeetingById({ id: 1, user: { id: 1, role: "SupportAgent" } });
    expect(item).toEqual({ denied: true });
  });
});
