import Database from "better-sqlite3";

export function createDb(dbPath = process.env.DB_PATH || "./northstar.db") {
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  return db;
}
