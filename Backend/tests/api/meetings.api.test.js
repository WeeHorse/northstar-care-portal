import request from "supertest";
import { describe, it, expect } from "vitest";
import { createTestContext } from "../helpers.js";

async function login(app, username) {
  const response = await request(app).post("/api/auth/login").send({ username, password: "secret" });
  return response.body.token;
}

describe("Meetings API", () => {
  it("lists meetings for support user scope", async () => {
    const { app } = createTestContext();
    const token = await login(app, "anna.support");

    const response = await request(app)
      .get("/api/meetings")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it("creates meeting and fetches detail", async () => {
    const { app } = createTestContext();
    const token = await login(app, "adam.admin");

    const created = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "API Meeting",
        startAt: "2026-04-09T09:00:00.000Z",
        endAt: "2026-04-09T09:30:00.000Z",
        meetingType: "digital"
      });

    expect(created.status).toBe(201);

    const detail = await request(app)
      .get(`/api/meetings/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(detail.status).toBe(200);
    expect(detail.body.title).toBe("API Meeting");

    const updated = await request(app)
      .patch(`/api/meetings/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "API Meeting Updated" });

    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe("API Meeting Updated");
  });

  it("filters meetings by day", async () => {
    const { app } = createTestContext();
    const token = await login(app, "adam.admin");

    const response = await request(app)
      .get("/api/meetings?day=2026-04-08")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.total).toBeGreaterThanOrEqual(1);
  });
});
