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

describe("E2E auth, procedures, and meetings flow", () => {
  it("logs in, reads procedures, creates meeting", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "adam.admin", password: "secret" })
    });
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json();

    const proceduresRes = await fetch(`${baseUrl}/api/procedures`, {
      headers: { authorization: `Bearer ${loginBody.token}` }
    });
    expect(proceduresRes.status).toBe(200);

    const createMeetingRes = await fetch(`${baseUrl}/api/meetings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${loginBody.token}`
      },
      body: JSON.stringify({
        title: "E2E Meeting",
        startAt: "2026-04-10T09:00:00.000Z",
        endAt: "2026-04-10T09:30:00.000Z"
      })
    });
    expect(createMeetingRes.status).toBe(201);
  });
});
