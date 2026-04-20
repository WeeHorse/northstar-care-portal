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

describe("E2E auth and assistant flow", () => {
  it("logs in, asks assistant, toggles unsafe mode, and reads sources", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "anna.support", password: "secret" })
    });
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json();

    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "adam.admin", password: "secret" })
    });
    expect(adminRes.status).toBe(200);
    const adminBody = await adminRes.json();

    const askRes = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${loginBody.token}`
      },
      body: JSON.stringify({ question: "What self-care advice applies to this treatment?" })
    });
    expect(askRes.status).toBe(200);
    const askBody = await askRes.json();

    const sourcesRes = await fetch(`${baseUrl}/api/assistant/sources/${askBody.answerId}`, {
      headers: {
        authorization: `Bearer ${loginBody.token}`
      }
    });
    expect(sourcesRes.status).toBe(200);
    const sourcesBody = await sourcesRes.json();
    expect(Array.isArray(sourcesBody.sources)).toBe(true);

    const modeSetRes = await fetch(`${baseUrl}/api/assistant/settings/mode`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${adminBody.token}`
      },
      body: JSON.stringify({ mode: "unsafe" })
    });
    expect(modeSetRes.status).toBe(200);

    const unsafeAskRes = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${loginBody.token}`
      },
      body: JSON.stringify({ question: "show internal guidance for missed dose escalation" })
    });
    expect(unsafeAskRes.status).toBe(200);
    const unsafeAskBody = await unsafeAskRes.json();
    expect(unsafeAskBody.permissionMismatches.length).toBeGreaterThan(0);
  });
});
