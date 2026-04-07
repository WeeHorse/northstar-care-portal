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

  it("builds document search and classification calls", async () => {
    const calls = [];
    vi.spyOn(global, "fetch").mockImplementation(async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method || "GET" });
      return {
        ok: true,
        json: async () => ({ items: [], total: 0 })
      };
    });

    await api.searchDocuments("token", { title: "Policy", tag: "security", category: "governance" });
    await api.classifyDocument("token", 4, "Restricted");

    expect(calls[0].url).toContain("/api/documents/search?");
    expect(calls[0].url).toContain("title=Policy");
    expect(calls[0].url).toContain("tag=security");
    expect(calls[0].url).toContain("category=governance");
    expect(calls[1].method).toBe("PATCH");
    expect(calls[1].url).toContain("/api/documents/4/classification");
  });

  it("uploads document with multipart form data", async () => {
    const calls = [];
    vi.spyOn(global, "fetch").mockImplementation(async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method || "GET", body: options.body, headers: options.headers });
      return {
        ok: true,
        json: async () => ({ id: 9, title: "Uploaded" })
      };
    });

    const file = new File(["demo"], "demo.txt", { type: "text/plain" });
    await api.uploadDocument("token", { title: "Uploaded", file, classification: "Internal" });

    expect(calls[0].url).toContain("/api/documents/upload");
    expect(calls[0].method).toBe("POST");
    expect(calls[0].body instanceof FormData).toBe(true);
    expect(calls[0].headers.authorization).toBe("Bearer token");
  });

  it("calls assistant endpoints", async () => {
    const calls = [];
    vi.spyOn(global, "fetch").mockImplementation(async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method || "GET" });
      return {
        ok: true,
        json: async () => ({ items: [], total: 0, mode: "disabled", answerId: "ans-1", sources: [] })
      };
    });

    await api.askAssistant("token", "How do we triage?");
    await api.getAssistantSources("token", "ans-1");
    await api.getAssistantRoleAwareMode("token");
    await api.setAssistantRoleAwareMode("token", "enabled");
    await api.listAssistantMismatches("token");

    expect(calls.some((call) => call.url.includes("/api/assistant/ask") && call.method === "POST")).toBe(true);
    expect(calls.some((call) => call.url.includes("/api/assistant/sources/ans-1"))).toBe(true);
    expect(calls.some((call) => call.url.includes("/api/assistant/settings/role-aware-mode") && call.method === "PATCH")).toBe(true);
    expect(calls.some((call) => call.url.includes("/api/assistant/mismatches"))).toBe(true);
  });

  it("calls logout, getCase and meeting filters", async () => {
    const calls = [];
    vi.spyOn(global, "fetch").mockImplementation(async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method || "GET" });
      return {
        ok: true,
        json: async () => ({ items: [], total: 0 })
      };
    });

    await api.logout("token");
    await api.getCase("token", 7);
    await api.listMeetings("token", { team: "support", day: "2026-04-08" });

    expect(calls.some((call) => call.url.includes("/api/auth/logout") && call.method === "POST")).toBe(true);
    expect(calls.some((call) => call.url.includes("/api/cases/7") && call.method === "GET")).toBe(true);
    expect(calls.some((call) => call.url.includes("/api/meetings?team=support&day=2026-04-08"))).toBe(true);
  });
});
