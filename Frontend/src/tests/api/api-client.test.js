import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../../app/api";

describe("api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends login request and parses response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ token: "abc", user: { username: "anna.support" } })
    });

    const result = await api.login("anna.support", "secret");
    expect(result.token).toBe("abc");
  });

  it("throws readable errors", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Forbidden" })
    });

    await expect(api.listAdminUsers("bad-token")).rejects.toThrow("Forbidden");
  });

  it("supports create and update API calls", async () => {
    const calls = [];
    vi.spyOn(global, "fetch").mockImplementation(async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method || "GET" });
      return {
        ok: true,
        json: async () => ({ ok: true })
      };
    });

    await api.createCase("token", { title: "T", description: "D" });
    await api.updateCase("token", 12, { status: "closed" });
    await api.createMeeting("token", { title: "M", startAt: "a", endAt: "b" });
    await api.updateMeeting("token", 3, { title: "M2" });

    expect(calls.map((c) => c.method)).toEqual(["POST", "PATCH", "POST", "PATCH"]);
  });

  it("adds filters for audit log queries", async () => {
    let seenUrl = "";
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      seenUrl = String(url);
      return {
        ok: true,
        json: async () => ({ items: [], total: 0 })
      };
    });

    await api.listAuditLogs("token", { eventType: "login_attempt", result: "success" });
    expect(seenUrl).toContain("eventType=login_attempt");
    expect(seenUrl).toContain("result=success");
  });

  it("uses same-origin API path by default", async () => {
    let seenUrl = "";
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      seenUrl = String(url);
      return {
        ok: true,
        json: async () => ({ items: [], total: 0 })
      };
    });

    await api.listCases("token");
    expect(seenUrl.startsWith("/api/")).toBe(true);
  });
});
