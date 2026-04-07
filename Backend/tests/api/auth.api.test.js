import request from "supertest";
import { describe, it, expect } from "vitest";
import { createTestContext } from "../helpers.js";

describe("Auth API", () => {
  it("logs in and returns token and role", async () => {
    const { app } = createTestContext();

    const response = await request(app).post("/api/auth/login").send({
      username: "anna.support",
      password: "secret"
    });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("SupportAgent");
    expect(response.body.token).toBeTypeOf("string");
  });

  it("returns profile for authenticated user", async () => {
    const { app } = createTestContext();

    const login = await request(app).post("/api/auth/login").send({
      username: "adam.admin",
      password: "secret"
    });

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(me.status).toBe(200);
    expect(me.body.user.username).toBe("adam.admin");
    expect(me.body.user.role).toBe("Admin");
  });

  it("invalidates token on logout", async () => {
    const { app } = createTestContext();

    const login = await request(app).post("/api/auth/login").send({
      username: "adam.admin",
      password: "secret"
    });

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(logout.status).toBe(200);

    const meAfter = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(meAfter.status).toBe(401);
  });
});
