import { beforeAll, afterAll, describe, expect, it } from "vitest";

let server;
let baseUrl;

beforeAll(async () => {
  const { createDb } = await import("../../server/db/connection.js");
  const { initDb } = await import("../../server/db/initDb.js");
  const { createApp } = await import("../../server/app.js");

  const db = createDb(":memory:");
  initDb(db);
  const app = createApp({ db, jwtSecret: "test-secret" });
  server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

describe("E2E auth, admin, and audit flow", () => {
  it("logs in as admin, changes role, and fetches audit log", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "adam.admin", password: "secret" })
    });
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json();

    const usersRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { authorization: `Bearer ${loginBody.token}` }
    });
    expect(usersRes.status).toBe(200);
    const usersBody = await usersRes.json();
    const targetUser = usersBody.items.find((u) => u.username === "mikael.manager");

    const roleRes = await fetch(`${baseUrl}/api/admin/users/${targetUser.id}/role`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${loginBody.token}`
      },
      body: JSON.stringify({ role: "Clinician" })
    });
    expect(roleRes.status).toBe(200);

    const auditRes = await fetch(`${baseUrl}/api/admin/audit`, {
      headers: { authorization: `Bearer ${loginBody.token}` }
    });
    expect(auditRes.status).toBe(200);
    const auditBody = await auditRes.json();
    expect(auditBody.total).toBeGreaterThan(0);
  });
});
