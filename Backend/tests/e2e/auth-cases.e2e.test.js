import { beforeAll, afterAll, describe, expect, it } from "vitest";

let server;
let baseUrl;

beforeAll(async () => {
  process.env.DB_PATH = ":memory:";
  process.env.JWT_SECRET = "test-secret";
  process.env.PORT = "0";

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

describe("E2E auth to case flow", () => {
  it("logs in, creates case, and fetches it", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "adam.admin", password: "secret" })
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.headers.get("x-request-id")).toBeTruthy();
    const loginBody = await loginRes.json();

    const createRes = await fetch(`${baseUrl}/api/cases`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${loginBody.token}`
      },
      body: JSON.stringify({ title: "E2E Case", description: "From e2e test" })
    });

    expect(createRes.status).toBe(201);
    const created = await createRes.json();

    const getRes = await fetch(`${baseUrl}/api/cases/${created.id}`, {
      headers: { authorization: `Bearer ${loginBody.token}` }
    });
    expect(getRes.status).toBe(200);
    const got = await getRes.json();
    expect(got.title).toBe("E2E Case");
  });
});
