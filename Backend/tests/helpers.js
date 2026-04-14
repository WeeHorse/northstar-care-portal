import { createDb } from "../server/db/connection.js";
import { initDb } from "../server/db/initDb.js";
import { createApp } from "../server/app.js";

export function createTestContext(options = {}) {
  const db = createDb(":memory:");
  initDb(db);
  const app = createApp({
    db,
    jwtSecret: "test-secret",
    staticRoot: options.staticRoot,
    uploadRoot: options.uploadRoot,
    storageType: options.storageType || "local"
  });
  return { app, db };
}
