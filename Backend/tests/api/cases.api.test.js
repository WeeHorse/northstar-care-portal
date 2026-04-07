import request from "supertest";
import { describe, it, expect } from "vitest";
import { createTestContext } from "../helpers.js";

async function login(app, username) {
  const response = await request(app).post("/api/auth/login").send({ username, password: "secret" });
  return response.body.token;
}

describe("Cases API", () => {
  it("lists cases for support agent scope", async () => {
    const { app } = createTestContext();
    const token = await login(app, "anna.support");

    const response = await request(app)
      .get("/api/cases?status=open")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.total).toBeGreaterThanOrEqual(1);
  });

  it("creates and updates a case", async () => {
    const { app } = createTestContext();
    const token = await login(app, "adam.admin");

    const created = await request(app)
      .post("/api/cases")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New case", description: "Needs triage", priority: "low" });

    expect(created.status).toBe(201);
    expect(created.body.title).toBe("New case");

    const updated = await request(app)
      .patch(`/api/cases/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "closed" });

    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe("closed");
  });
});
