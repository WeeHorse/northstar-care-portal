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
});
