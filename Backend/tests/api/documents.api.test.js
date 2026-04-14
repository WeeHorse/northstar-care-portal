import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, it, expect } from "vitest";
import { createTestContext } from "../helpers.js";

const cleanupDirs = [];

afterEach(() => {
  while (cleanupDirs.length) {
    const directory = cleanupDirs.pop();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

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

  it("searches and classifies documents", async () => {
    const { app } = createTestContext();
    const adminToken = await login(app, "adam.admin");

    const created = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Network Guide", description: "Contains vpn tag", category: "network", tags: ["vpn", "ops"] });

    expect(created.status).toBe(201);

    const searched = await request(app)
      .get("/api/documents/search?title=Network&tag=vpn&category=network")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(searched.status).toBe(200);
    expect(searched.body.total).toBeGreaterThan(0);

    const classified = await request(app)
      .patch(`/api/documents/${created.body.id}/classification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ classification: "Restricted" });

    expect(classified.status).toBe(200);
    expect(classified.body.classification).toBe("Restricted");
  });

  it("searches documents by description and file name", async () => {
    const uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), "northstar-search-test-"));
    cleanupDirs.push(uploadRoot);
    const { app } = createTestContext({ uploadRoot });
    const token = await login(app, "adam.admin");

    const uploaded = await request(app)
      .post("/api/documents/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Policy Document")
      .field("description", "This document contains important compliance requirements")
      .field("classification", "Internal")
      .attach("file", Buffer.from("policy content"), {
        filename: "compliance-policy.pdf",
        contentType: "application/pdf"
      });

    expect(uploaded.status).toBe(201);

    const searchByDescription = await request(app)
      .get("/api/documents/search?description=compliance")
      .set("Authorization", `Bearer ${token}`);

    expect(searchByDescription.status).toBe(200);
    expect(searchByDescription.body.total).toBeGreaterThan(0);
    expect(searchByDescription.body.items.some((d) => d.id === uploaded.body.id)).toBe(true);

    const searchByFileName = await request(app)
      .get("/api/documents/search?fileName=compliance-policy")
      .set("Authorization", `Bearer ${token}`);

    expect(searchByFileName.status).toBe(200);
    expect(searchByFileName.body.total).toBeGreaterThan(0);
    expect(searchByFileName.body.items.some((d) => d.id === uploaded.body.id)).toBe(true);
  });

  it("uploads a document file with metadata", async () => {
    const { app } = createTestContext();
    const token = await login(app, "adam.admin");

    const uploaded = await request(app)
      .post("/api/documents/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Upload Policy")
      .field("classification", "Internal")
      .field("category", "policy")
      .field("tags", "upload,policy")
      .attach("file", Buffer.from("hello world"), {
        filename: "upload-policy.txt",
        contentType: "text/plain"
      });

    expect(uploaded.status).toBe(201);
    expect(uploaded.body.title).toBe("Upload Policy");
    expect(uploaded.body.fileName).toBe("upload-policy.txt");
    expect(uploaded.body.fileMimeType).toBe("text/plain");
    expect(uploaded.body.fileSizeBytes).toBeGreaterThan(0);
  });

  it("stores uploaded files in configured upload root", async () => {
    const uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), "northstar-upload-root-"));
    cleanupDirs.push(uploadRoot);
    const { app } = createTestContext({ uploadRoot });
    const token = await login(app, "adam.admin");

    const uploaded = await request(app)
      .post("/api/documents/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Configured Root Policy")
      .field("classification", "Internal")
      .attach("file", Buffer.from("configured-root"), {
        filename: "configured.txt",
        contentType: "text/plain"
      });

    expect(uploaded.status).toBe(201);
    expect(uploaded.body.storagePath.startsWith(uploadRoot)).toBe(true);
    expect(fs.existsSync(uploaded.body.storagePath)).toBe(true);
  });

  it("downloads an uploaded document file", async () => {
    const uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), "northstar-download-test-"));
    cleanupDirs.push(uploadRoot);
    const { app } = createTestContext({ uploadRoot });
    const token = await login(app, "adam.admin");

    const uploaded = await request(app)
      .post("/api/documents/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Download Test")
      .field("classification", "Internal")
      .attach("file", Buffer.from("test file content"), {
        filename: "test-file.txt",
        contentType: "text/plain"
      });

    expect(uploaded.status).toBe(201);
    const docId = uploaded.body.id;

    const downloaded = await request(app)
      .get(`/api/documents/${docId}/download`)
      .set("Authorization", `Bearer ${token}`);

    expect(downloaded.status).toBe(200);
    expect(downloaded.headers["content-disposition"]).toContain("test-file.txt");
    expect(downloaded.headers["content-type"]).toContain("text/plain");
    expect(downloaded.text).toBe("test file content");
  });

  it("returns 404 when downloading non-existent document", async () => {
    const { app } = createTestContext();
    const token = await login(app, "adam.admin");

    const response = await request(app)
      .get("/api/documents/99999/download")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toContain("Document not found");
  });

  it("returns 404 when downloading document without file", async () => {
    const { app } = createTestContext();
    const token = await login(app, "adam.admin");

    const created = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Metadata Only", classification: "Internal" });

    expect(created.status).toBe(201);
    const docId = created.body.id;

    const downloaded = await request(app)
      .get(`/api/documents/${docId}/download`)
      .set("Authorization", `Bearer ${token}`);

    expect(downloaded.status).toBe(404);
    expect(downloaded.body.error).toContain("No file attached");
  });

  it("includes downloadLink in document responses", async () => {
    const uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), "northstar-link-test-"));
    cleanupDirs.push(uploadRoot);
    const { app } = createTestContext({ uploadRoot });
    const token = await login(app, "adam.admin");

    const uploaded = await request(app)
      .post("/api/documents/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Link Test")
      .field("classification", "Internal")
      .attach("file", Buffer.from("content"), {
        filename: "link-test.txt",
        contentType: "text/plain"
      });

    expect(uploaded.status).toBe(201);
    const docId = uploaded.body.id;
    expect(uploaded.body.downloadLink).toBe(`/api/documents/${docId}/download`);

    const fetched = await request(app)
      .get(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(fetched.status).toBe(200);
    expect(fetched.body.downloadLink).toBe(`/api/documents/${docId}/download`);
  });
});

