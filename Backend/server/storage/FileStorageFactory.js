import { LocalFileStorage } from "./LocalFileStorage.js";
import { AzureBlobStorage } from "./AzureBlobStorage.js";

export function createStorageClient({
  storageType = "local",
  uploadRoot,
  azureConnectionString,
  azureContainerName
} = {}) {
  if (storageType === "azure") {
    return new AzureBlobStorage(azureConnectionString, azureContainerName);
  }

  return new LocalFileStorage(uploadRoot);
}

export { LocalFileStorage, AzureBlobStorage };
