import { createDb } from "./db/connection.js";
import { initDb } from "./db/initDb.js";
import { createApp } from "./app.js";
import { resolveRuntimePaths } from "./config/runtimePaths.js";

const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || "northstar-dev-secret";
const { dbPath, uploadRoot, storageType, azureConnectionString, azureContainerName } = resolveRuntimePaths(process.env);

// Diagnostic logging for storage configuration
console.log("=== Storage Configuration Diagnostic ===");
console.log(`STORAGE_TYPE env var: ${process.env.STORAGE_TYPE || "(not set - defaulting to 'local')"}`);
console.log(`AZURE_STORAGE_CONNECTION_STRING: ${process.env.AZURE_STORAGE_CONNECTION_STRING ? "(set)" : "(not set)"}`);
console.log(`AZURE_STORAGE_CONTAINER_NAME: ${process.env.AZURE_STORAGE_CONTAINER_NAME || "(not set - defaulting to 'documents')"}`);
console.log(`Resolved storageType: ${storageType}`);
console.log(`Azure Container Name: ${azureContainerName}`);
console.log("========================================");

const db = createDb(dbPath);
initDb(db, { uploadRoot });

const app = createApp({
  db,
  jwtSecret: JWT_SECRET,
  uploadRoot,
  storageType,
  azureConnectionString,
  azureContainerName
});

app.listen(PORT, () => {
  console.log(`Northstar backend listening on port ${PORT}`);
  console.log(`Northstar storage paths: db=${dbPath}, uploads=${uploadRoot}`);
  console.log(`Storage configuration: ${storageType === "azure" ? "✓ AZURE BLOB STORAGE" : "LOCAL FILESYSTEM"}`);
});
