import { BlobServiceClient } from "@azure/storage-blob";
import { Readable } from "stream";

/**
 * Azure Blob Storage adapter for document uploads.
 * Stores files in Azure Blob Storage containers.
 * Cool stuff
 */
export class AzureBlobStorage {
  constructor(connectionString, containerName = "documents") {
    if (!connectionString) {
      throw new Error("Azure Storage connection string is required");
    }
    this.containerName = containerName;
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Ensure container exists
   * @returns {Promise<void>}
   */
  async ensureContainer() {
    try {
      await this.containerClient.getProperties();
    } catch (err) {
      if (err.code === "ContainerNotFound") {
        await this.blobServiceClient.createContainer(this.containerName, {
          access: "container"
        });
      } else {
        throw err;
      }
    }
  }

  /**
   * Save a file to Azure Blob Storage
   * @param {string} fileName - Generated filename (used as blob name)
   * @param {Buffer} buffer - File buffer content
   * @returns {Promise<object>} { path: string (blob URL), fileName: string }
   */
  async saveFile(fileName, buffer) {
    await this.ensureContainer();
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.upload(buffer, buffer.length);
    return {
      path: fileName,
      fileName,
      url: blockBlobClient.url
    };
  }

  /**
   * Check if a blob exists
   * @param {string} blobName - Blob name (filename)
   * @returns {Promise<boolean>}
   */
  async fileExists(blobName) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.getProperties();
      return true;
    } catch (err) {
      if (err.code === "BlobNotFound") {
        return false;
      }
      throw err;
    }
  }

  /**
   * Get blob size in bytes
   * @param {string} blobName - Blob name (filename)
   * @returns {Promise<number>} Blob size
   */
  async getFileSize(blobName) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const properties = await blockBlobClient.getProperties();
    return properties.contentLength;
  }

  /**
   * Create a readable stream for a blob
   * @param {string} blobName - Blob name (filename)
   * @returns {Promise<ReadableStream>}
   */
  async createReadStream(blobName) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download();

    // Convert browser-compatible ReadableStream to Node.js stream
    return Readable.from(downloadResponse.readableStreamBody);
  }

  /**
   * Delete a blob from storage
   * @param {string} blobName - Blob name (filename)
   * @returns {Promise<void>}
   */
  async deleteFile(blobName) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (err) {
      if (err.code === "BlobNotFound") {
        // Already deleted, no error
        return;
      }
      throw err;
    }
  }

  /**
   * Get storage type identifier
   */
  getStorageType() {
    return "azure";
  }

  /**
   * Get diagnostics info
   */
  async getStorageInfo() {
    try {
      await this.ensureContainer();
      return {
        type: "azure",
        containerName: this.containerName,
        endpoint: this.blobServiceClient.url
      };
    } catch (err) {
      return {
        type: "azure",
        containerName: this.containerName,
        error: err.message
      };
    }
  }
}
