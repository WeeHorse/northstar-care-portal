import request from "supertest";
import { describe, it, expect } from "vitest";
import { createTestContext } from "../helpers.js";

async function login(app, username) {
  const response = await request(app).post("/api/auth/login").send({ username, password: "secret" });
  return response.body.token;
}

describe("Assistant API", () => {
  it("answers questions and exposes sources", async () => {
    const { app } = createTestContext();
    const token = await login(app, "anna.support");

    const answer = await request(app)
      .post("/api/assistant/ask")
      .set("Authorization", `Bearer ${token}`)
      .send({ question: "How to escalate support incidents?" });

    expect(answer.status).toBe(200);
    expect(answer.body.answerId).toBeTypeOf("string");

    const sources = await request(app)
      .get(`/api/assistant/sources/${answer.body.answerId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(sources.status).toBe(200);
    expect(Array.isArray(sources.body.sources)).toBe(true);
  });

  it("allows admin to manage role-aware mode and list mismatches", async () => {
    const { app } = createTestContext();
    const adminToken = await login(app, "adam.admin");

    const modeGet = await request(app)
      .get("/api/assistant/settings/role-aware-mode")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(modeGet.status).toBe(200);

    const modeSet = await request(app)
      .patch("/api/assistant/settings/role-aware-mode")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ mode: "enabled" });
    expect(modeSet.status).toBe(200);
    expect(modeSet.body.mode).toBe("enabled");

    const mismatch = await request(app)
      .get("/api/assistant/mismatches")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(mismatch.status).toBe(200);
    expect(Array.isArray(mismatch.body.items)).toBe(true);
  });
});
