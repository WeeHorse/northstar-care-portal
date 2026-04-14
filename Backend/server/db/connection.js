import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export function createDb(dbPath = process.env.DB_PATH || "./northstar.db") {
  const parentDir = path.dirname(dbPath);
  fs.mkdirSync(parentDir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  return db;
}
