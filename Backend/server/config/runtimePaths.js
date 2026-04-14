import path from "node:path";

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function toAbsolutePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(inputPath);
}

export function detectAzureAppService(env = process.env) {
  return Boolean(env.WEBSITE_SITE_NAME || env.WEBSITE_INSTANCE_ID || env.WEBSITE_RESOURCE_GROUP);
}

export function resolveRuntimePaths(env = process.env) {
  const isAzureAppService = detectAzureAppService(env);

  const defaultDbPath = isAzureAppService
    ? path.join("/home", "data", "northstar.db")
    : path.resolve("northstar.db");
  const defaultUploadRoot = isAzureAppService
    ? path.join("/home", "site", "uploads")
    : path.resolve("uploads");

  const dbPath = hasValue(env.DB_PATH) ? toAbsolutePath(String(env.DB_PATH)) : defaultDbPath;
  const uploadRoot = hasValue(env.DOCUMENT_UPLOAD_ROOT)
    ? toAbsolutePath(String(env.DOCUMENT_UPLOAD_ROOT))
    : defaultUploadRoot;

  // Determine storage type
  const storageType = hasValue(env.STORAGE_TYPE) ? String(env.STORAGE_TYPE).toLowerCase() : "local";

  // Azure Blob Storage configuration
  const azureConnectionString = env.AZURE_STORAGE_CONNECTION_STRING || "";
  const azureContainerName = env.AZURE_STORAGE_CONTAINER_NAME || "documents";

  return {
    dbPath,
    uploadRoot,
    isAzureAppService,
    storageType,
    azureConnectionString,
    azureContainerName
  };
}