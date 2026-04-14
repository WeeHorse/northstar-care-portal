import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

let server;
let baseUrl;
let uploadRoot;
let previousUploadRoot;

beforeAll(async () => {
  uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), "northstar-e2e-upload-"));
  previousUploadRoot = process.env.DOCUMENT_UPLOAD_ROOT;
  process.env.DOCUMENT_UPLOAD_ROOT = uploadRoot;

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

  if (previousUploadRoot === undefined) {
    delete process.env.DOCUMENT_UPLOAD_ROOT;
  } else {
    process.env.DOCUMENT_UPLOAD_ROOT = previousUploadRoot;
  }

  if (uploadRoot) {
    fs.rmSync(uploadRoot, { recursive: true, force: true });
  }
});

describe("E2E auth, documents, and records flow", () => {
  it("logs in, uploads document, and reads records", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "adam.admin", password: "secret" })
    });
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json();

    const uploadForm = new FormData();
    uploadForm.append("title", "E2E Document");
    uploadForm.append("classification", "Internal");
    uploadForm.append("file", new Blob(["e2e upload"], { type: "text/plain" }), "e2e.txt");

    const createDocRes = await fetch(`${baseUrl}/api/documents/upload`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${loginBody.token}`
      },
      body: uploadForm
    });
    expect(createDocRes.status).toBe(201);
    const createdDocument = await createDocRes.json();
    expect(createdDocument.storagePath.startsWith(uploadRoot)).toBe(true);
    expect(fs.existsSync(createdDocument.storagePath)).toBe(true);

    const listRecordsRes = await fetch(`${baseUrl}/api/records`, {
      headers: { authorization: `Bearer ${loginBody.token}` }
    });
    expect(listRecordsRes.status).toBe(200);
    const recordsBody = await listRecordsRes.json();
    expect(Array.isArray(recordsBody.items)).toBe(true);
    expect(recordsBody.items.length).toBeGreaterThan(0);
  });
});
