import request from "supertest";
import { describe, it, expect } from "vitest";
import { createTestContext } from "../helpers.js";

async function login(app, username) {
  const response = await request(app).post("/api/auth/login").send({ username, password: "secret" });
  return response.body.token;
}

describe("Admin API", () => {
  it("denies non-admin user", async () => {
    const { app } = createTestContext();
    const token = await login(app, "anna.support");

    const response = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("lists users, changes role, and reads audit", async () => {
    const { app } = createTestContext();
    const token = await login(app, "adam.admin");

    const users = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);
    expect(users.status).toBe(200);
    expect(users.body.total).toBeGreaterThan(0);

    const targetUser = users.body.items.find((u) => u.username === "mikael.manager");

    const roleChange = await request(app)
      .patch(`/api/admin/users/${targetUser.id}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "Clinician" });
    expect(roleChange.status).toBe(200);
    expect(roleChange.body.role).toBe("Clinician");

    const securityMode = await request(app)
      .patch("/api/admin/settings/security-mode")
      .set("Authorization", `Bearer ${token}`)
      .send({ mode: "misconfigured" });
    expect(securityMode.status).toBe(200);
    expect(securityMode.body.mode).toBe("misconfigured");

    const audit = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", `Bearer ${token}`);
    expect(audit.status).toBe(200);
    expect(audit.body.total).toBeGreaterThan(0);
  });
});
