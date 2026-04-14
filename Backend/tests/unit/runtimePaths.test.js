import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectAzureAppService, resolveRuntimePaths } from "../../server/config/runtimePaths.js";

describe("runtime path resolution", () => {
  it("uses local defaults outside Azure", () => {
    const paths = resolveRuntimePaths({});
    expect(paths.isAzureAppService).toBe(false);
    expect(paths.dbPath).toBe(path.resolve("northstar.db"));
    expect(paths.uploadRoot).toBe(path.resolve("uploads"));
  });

  it("uses Azure-safe defaults in App Service", () => {
    const paths = resolveRuntimePaths({ WEBSITE_SITE_NAME: "northstar-care-group-0" });
    expect(paths.isAzureAppService).toBe(true);
    expect(paths.dbPath).toBe(path.join("/home", "data", "northstar.db"));
    expect(paths.uploadRoot).toBe(path.join("/home", "site", "uploads"));
  });

  it("resolves relative environment overrides to absolute paths", () => {
    const paths = resolveRuntimePaths({
      DB_PATH: "./data/custom.db",
      DOCUMENT_UPLOAD_ROOT: "./tmp/uploads"
    });

    expect(paths.dbPath).toBe(path.resolve("./data/custom.db"));
    expect(paths.uploadRoot).toBe(path.resolve("./tmp/uploads"));
  });

  it("detects Azure when instance id is present", () => {
    expect(detectAzureAppService({ WEBSITE_INSTANCE_ID: "instance-01" })).toBe(true);
  });
});