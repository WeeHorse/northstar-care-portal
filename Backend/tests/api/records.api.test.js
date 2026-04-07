import request from "supertest";
import { describe, it, expect } from "vitest";
import { createTestContext } from "../helpers.js";

async function login(app, username) {
  const response = await request(app).post("/api/auth/login").send({ username, password: "secret" });
  return response.body.token;
}

describe("Records API", () => {
  it("returns restricted view for support agent", async () => {
    const { app } = createTestContext();
    const token = await login(app, "anna.support");

    const list = await request(app).get("/api/records").set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThan(0);

    const item = list.body.items[0];
    expect(item.patientRef).toBeTypeOf("string");
    expect(item.summary).toBeUndefined();
  });

  it("returns full view for clinician", async () => {
    const { app } = createTestContext();
    const token = await login(app, "clara.clinician");

    const list = await request(app).get("/api/records").set("Authorization", `Bearer ${token}`);
    const firstId = list.body.items[0].id;

    const detail = await request(app)
      .get(`/api/records/${firstId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(detail.status).toBe(200);
    expect(detail.body.summary).toBeTypeOf("string");
  });
});
