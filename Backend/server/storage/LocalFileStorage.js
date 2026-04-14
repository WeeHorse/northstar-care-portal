import fs from "node:fs";
import path from "node:path";

/**
 * Local filesystem storage adapter for document uploads.
 * Stores files on the server's local disk.
 */
export class LocalFileStorage {
  constructor(uploadRoot) {
    this.uploadRoot = uploadRoot || path.resolve("uploads");
  }

  /**
   * Save a file to local storage
   * @param {string} fileName - Generated filename
   * @param {Buffer} buffer - File buffer content
   * @returns {object} { path: string, fileName: string }
   */
  async saveFile(fileName, buffer) {
    fs.mkdirSync(this.uploadRoot, { recursive: true });
    const fullPath = path.join(this.uploadRoot, fileName);
    fs.writeFileSync(fullPath, buffer);
    return { path: fullPath, fileName };
  }

  /**
   * Check if a file exists
   * @param {string} filePath - Full path to file
   * @returns {boolean}
   */
  async fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * Get file size in bytes
   * @param {string} filePath - Full path to file
   * @returns {number} File size
   */
  async getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size;
  }

  /**
   * Create a readable stream for a file
   * @param {string} filePath - Full path to file
   * @returns {ReadableStream}
   */
  async createReadStream(filePath) {
    return fs.createReadStream(filePath);
  }

  /**
   * Delete a file from storage
   * @param {string} filePath - Full path to file
   * @returns {Promise<void>}
   */
  async deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Get storage type identifier
   */
  getStorageType() {
    return "local";
  }
}
