import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createTestContext } from "../helpers.js";

const tempDirs = [];

function createStaticRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "northstar-wwwroot-"));
  tempDirs.push(dir);
  fs.writeFileSync(path.join(dir, "index.html"), "<html><body><div id=\"app\">northstar</div></body></html>");
  fs.writeFileSync(path.join(dir, "app.js"), "console.log('ok')");
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("Frontend hosting", () => {
  it("serves built assets and falls back to index.html for SPA routes", async () => {
    const staticRoot = createStaticRoot();
    const { app } = createTestContext({ staticRoot });

    const asset = await request(app).get("/app.js");
    expect(asset.status).toBe(200);
    expect(asset.text).toContain("console.log");

    const spaRoute = await request(app).get("/dashboard");
    expect(spaRoute.status).toBe(200);
    expect(spaRoute.text).toContain("id=\"app\"");
  });
});
