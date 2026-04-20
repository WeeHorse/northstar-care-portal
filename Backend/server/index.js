import "dotenv/config";
import appInsights from "applicationinsights";
import { createDb } from "./db/connection.js";
import { initDb } from "./db/initDb.js";
import { createApp } from "./app.js";
import { resolveRuntimePaths } from "./config/runtimePaths.js";
import { logger, setAppInsightsClient } from "./utils/logger.js";

const AI_CONNECTION_STRING = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
if (AI_CONNECTION_STRING) {
  appInsights
    .setup(AI_CONNECTION_STRING)
    .setAutoCollectRequests(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(false)
    .start();
  setAppInsightsClient(appInsights.defaultClient);
  logger.info("Azure Application Insights initialized", { connectionStringConfigured: true });
}

const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || "northstar-dev-secret";
const { dbPath, uploadRoot, storageType, azureConnectionString, azureContainerName } = resolveRuntimePaths(process.env);

logger.info("Storage configuration resolved", {
  storageType,
  azureContainerName: azureContainerName || "(not set - defaulting to 'documents')",
  azureConnectionStringConfigured: Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING),
  storagTypeSource: process.env.STORAGE_TYPE ? "env" : "default"
});

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
  logger.info("Northstar backend started", {
    port: PORT,
    dbPath,
    uploadRoot,
    storageType
  });
});
