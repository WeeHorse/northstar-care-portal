import request from "supertest";
import { describe, it, expect } from "vitest";
import { createTestContext } from "../helpers.js";

async function login(app, username) {
  const response = await request(app).post("/api/auth/login").send({ username, password: "secret" });
  return response.body.token;
}

describe("Procedures API", () => {
  it("lists procedures for support role", async () => {
    const { app } = createTestContext();
    const token = await login(app, "anna.support");

    const response = await request(app)
      .get("/api/procedures")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
  });

  it("returns procedure detail for clinician", async () => {
    const { app } = createTestContext();
    const token = await login(app, "clara.clinician");

    const list = await request(app).get("/api/procedures").set("Authorization", `Bearer ${token}`);
    const firstId = list.body.items[0].id;

    const detail = await request(app)
      .get(`/api/procedures/${firstId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(detail.status).toBe(200);
    expect(detail.body.title).toBeTypeOf("string");
  });
});
