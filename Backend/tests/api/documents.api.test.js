import request from "supertest";
import { describe, it, expect } from "vitest";
import { createTestContext } from "../helpers.js";

async function login(app, username) {
  const response = await request(app).post("/api/auth/login").send({ username, password: "secret" });
  return response.body.token;
}

describe("Documents API", () => {
  it("lists accessible documents for support agent", async () => {
    const { app } = createTestContext();
    const token = await login(app, "anna.support");

    const response = await request(app)
      .get("/api/documents")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
  });

  it("creates document and returns it", async () => {
    const { app } = createTestContext();
    const token = await login(app, "adam.admin");

    const created = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New Policy", description: "Doc", classification: "Internal" });

    expect(created.status).toBe(201);
    expect(created.body.title).toBe("New Policy");

    const fetched = await request(app)
      .get(`/api/documents/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(fetched.status).toBe(200);
    expect(fetched.body.id).toBe(created.body.id);
  });
});
