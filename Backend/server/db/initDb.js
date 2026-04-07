import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

function nowIso() {
  return new Date().toISOString();
}

export function initDb(db) {
  const schemaPath = path.resolve("server/db/schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  db.exec(schemaSql);

  const roleCount = db.prepare("SELECT COUNT(*) AS count FROM roles").get().count;
  if (roleCount === 0) {
    const insertRole = db.prepare("INSERT INTO roles (name) VALUES (?)");
    ["SupportAgent", "Manager", "Clinician", "Admin", "ExternalConsultant"].forEach((role) => {
      insertRole.run(role);
    });
  }

  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(
      "INSERT INTO users (username, password_hash, full_name, role_id, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const passwordHash = bcrypt.hashSync("secret", 10);
    const t = nowIso();
    insertUser.run("anna.support", passwordHash, "Anna Support", 1, 1, t);
    insertUser.run("mikael.manager", passwordHash, "Mikael Manager", 2, 1, t);
    insertUser.run("clara.clinician", passwordHash, "Clara Clinician", 3, 1, t);
    insertUser.run("adam.admin", passwordHash, "Adam Admin", 4, 1, t);
  }

  const caseCount = db.prepare("SELECT COUNT(*) AS count FROM cases").get().count;
  if (caseCount === 0) {
    const insertCase = db.prepare(
      "INSERT INTO cases (external_ref, title, description, status, priority, assigned_user_id, team, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const t = nowIso();
    insertCase.run(
      "NS-2026-001",
      "Portal login intermittent failure",
      "Users report temporary login failures during peak load.",
      "open",
      "high",
      1,
      "support",
      t,
      t
    );
    insertCase.run(
      "NS-2026-002",
      "Document classification mismatch",
      "A document appears with broader visibility than expected.",
      "open",
      "medium",
      1,
      "support",
      t,
      t
    );
  }

  const recordCount = db.prepare("SELECT COUNT(*) AS count FROM records").get().count;
  if (recordCount === 0) {
    const insertRecord = db.prepare(
      "INSERT INTO records (patient_ref, summary, status, sensitivity_level, last_contact_at, owner_team, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const t = nowIso();
    insertRecord.run("PT-1001", "Follow-up needed after digital consultation.", "active", "restricted", t, "clinical", t, t);
    insertRecord.run("PT-1002", "Routine wellness check completed.", "active", "internal", t, "support", t, t);
  }

  const documentCount = db.prepare("SELECT COUNT(*) AS count FROM documents").get().count;
  if (documentCount === 0) {
    const insertDocument = db.prepare(
      "INSERT INTO documents (title, description, classification, category, uploaded_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const insertPermission = db.prepare(
      "INSERT INTO document_permissions (document_id, role_id, access_level) VALUES (?, ?, ?)"
    );
    const t = nowIso();

    const supportGuide = insertDocument.run(
      "Support Escalation Guide",
      "Steps for escalation and triage in support queue.",
      "Internal",
      "procedure",
      4,
      t,
      t
    );
    insertPermission.run(supportGuide.lastInsertRowid, 1, "read");
    insertPermission.run(supportGuide.lastInsertRowid, 2, "read");
    insertPermission.run(supportGuide.lastInsertRowid, 4, "read");

    const clinicalNote = insertDocument.run(
      "Clinical Data Handling",
      "Policy for handling clinical metadata and access boundaries.",
      "Confidential",
      "policy",
      4,
      t,
      t
    );
    insertPermission.run(clinicalNote.lastInsertRowid, 3, "read");
    insertPermission.run(clinicalNote.lastInsertRowid, 4, "read");
  }

  const procedureCount = db.prepare("SELECT COUNT(*) AS count FROM procedures").get().count;
  if (procedureCount === 0) {
    const insertProcedure = db.prepare(
      "INSERT INTO procedures (title, body_markdown, category, classification, owner_team, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const t = nowIso();
    insertProcedure.run(
      "Escalering av journalarende",
      "Verifiera identitet och folj NS-PROC-12 for eskalering.",
      "clinical",
      "Internal",
      "clinical",
      t,
      t
    );
    insertProcedure.run(
      "Incident triage for portal",
      "1. Klassificera incident. 2. Prioritera. 3. Tilldela ansvarig.",
      "support",
      "Internal",
      "support",
      t,
      t
    );
  }

  const meetingCount = db.prepare("SELECT COUNT(*) AS count FROM meetings").get().count;
  if (meetingCount === 0) {
    const insertMeeting = db.prepare(
      "INSERT INTO meetings (title, description, meeting_type, start_at, end_at, teams_link, created_by_user_id, team, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const t = nowIso();
    insertMeeting.run(
      "Case follow-up PT-1001",
      "Digital uppfoljning med patient.",
      "digital",
      "2026-04-08T09:00:00.000Z",
      "2026-04-08T09:30:00.000Z",
      "https://teams.example/meeting/1",
      1,
      "support",
      t,
      t
    );
    insertMeeting.run(
      "Team incident review",
      "Daglig avstamning for supportteam.",
      "internal",
      "2026-04-08T10:00:00.000Z",
      "2026-04-08T10:30:00.000Z",
      "https://teams.example/meeting/2",
      2,
      "support",
      t,
      t
    );
  }

  const settingsCount = db.prepare("SELECT COUNT(*) AS count FROM system_settings").get().count;
  if (settingsCount === 0) {
    db.prepare("INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)").run(
      "security_mode",
      "secure",
      nowIso()
    );
  }

  const assistantMode = db.prepare("SELECT value FROM system_settings WHERE key = 'assistant_role_aware_mode'").get();
  if (!assistantMode) {
    db.prepare("INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)").run(
      "assistant_role_aware_mode",
      "disabled",
      nowIso()
    );
  }

  const documentColumns = db.prepare("PRAGMA table_info(documents)").all();
  const hasTagsColumn = documentColumns.some((column) => column.name === "tags");
  if (!hasTagsColumn) {
    db.exec("ALTER TABLE documents ADD COLUMN tags TEXT");
  }
}
