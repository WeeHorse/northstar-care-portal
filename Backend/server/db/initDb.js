import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

function nowIso() {
  return new Date().toISOString();
}

function addDays(baseDate, offsetDays) {
  const next = new Date(baseDate);
  next.setUTCDate(next.getUTCDate() + offsetDays);
  return next;
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
    const statuses = ["open", "in_progress", "pending", "closed"];
    const priorities = ["low", "medium", "high"];
    const teams = ["support", "clinical", "operations"];
    const base = new Date("2026-04-01T08:00:00.000Z");

    for (let i = 1; i <= 36; i += 1) {
      const stamp = addDays(base, i).toISOString();
      insertCase.run(
        `NS-2026-${String(i).padStart(3, "0")}`,
        `Case ${i}: ${(i % 2 === 0) ? "Access" : "Workflow"} follow-up`,
            `Seeded case ${i} for demo filtering, updates, and role scope verification.`,
        statuses[(i - 1) % statuses.length],
        priorities[(i - 1) % priorities.length],
        ((i - 1) % 4) + 1,
        teams[(i - 1) % teams.length],
        stamp,
        stamp
      );
    }
  }

  const commentCount = db.prepare("SELECT COUNT(*) AS count FROM case_comments").get().count;
  if (commentCount === 0) {
    const insertComment = db.prepare(
      "INSERT INTO case_comments (case_id, user_id, comment_text, created_at) VALUES (?, ?, ?, ?)"
    );
    const base = new Date("2026-04-03T09:00:00.000Z");

    for (let i = 1; i <= 36; i += 1) {
      insertComment.run(
        i,
        ((i - 1) % 4) + 1,
        `Seeded comment ${ i } for case ${ i }.`,
        addDays(base, i).toISOString()
      );
    }
  }

  const recordCount = db.prepare("SELECT COUNT(*) AS count FROM records").get().count;
  if (recordCount === 0) {
    const insertRecord = db.prepare(
      "INSERT INTO records (patient_ref, summary, status, sensitivity_level, last_contact_at, owner_team, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const statuses = ["active", "pending", "archived"];
    const sensitivity = ["restricted", "internal", "confidential"];
    const ownerTeams = ["clinical", "support", "operations"];
    const base = new Date("2026-04-01T10:00:00.000Z");

    for (let i = 1; i <= 36; i += 1) {
      const stamp = addDays(base, i).toISOString();
      insertRecord.run(
        `PT - ${ String(1000 + i) } `,
            `Seeded patient record ${i} summary for workflow demonstrations.`,
        statuses[(i - 1) % statuses.length],
          sensitivity[(i - 1) % sensitivity.length],
          stamp,
          ownerTeams[(i - 1) % ownerTeams.length],
          stamp,
          stamp
      );
    }
  }

  const documentCount = db.prepare("SELECT COUNT(*) AS count FROM documents").get().count;
  if (documentCount === 0) {
    const insertDocument = db.prepare(
      "INSERT INTO documents (title, description, classification, category, uploaded_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const insertPermission = db.prepare(
      "INSERT INTO document_permissions (document_id, role_id, access_level) VALUES (?, ?, ?)"
    );
    const classifications = ["Internal", "Confidential", "Restricted"];
    const categories = ["policy", "procedure", "operations", "security"];
    const base = new Date("2026-04-02T11:00:00.000Z");

    for (let i = 1; i <= 36; i += 1) {
      const stamp = addDays(base, i).toISOString();
      const created = insertDocument.run(
        `Seeded Document ${i}`,
            `Reference document ${i} for role-aware listing and search.`,
        classifications[(i - 1) % classifications.length],
        categories[(i - 1) % categories.length],
        ((i - 1) % 4) + 1,
        stamp,
        stamp
      );

      const documentId = created.lastInsertRowid;
      insertPermission.run(documentId, 4, "read");
      insertPermission.run(documentId, ((i - 1) % 3) + 1, "read");
      if (i % 5 === 0) {
        insertPermission.run(documentId, 2, "read");
      }
    }
  }

  const procedureCount = db.prepare("SELECT COUNT(*) AS count FROM procedures").get().count;
  if (procedureCount === 0) {
    const insertProcedure = db.prepare(
      "INSERT INTO procedures (title, body_markdown, category, classification, owner_team, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const categories = ["support", "clinical", "operations", "security"];
    const classifications = ["Internal", "Confidential"];
    const ownerTeams = ["support", "clinical", "operations"];
    const base = new Date("2026-04-04T08:30:00.000Z");

    for (let i = 1; i <= 36; i += 1) {
      const stamp = addDays(base, i).toISOString();
      insertProcedure.run(
        `Seeded Procedure ${ i }`,
            `1. Validate request. 2. Apply policy ${i}. 3. Record audit trail.`,
        categories[(i - 1) % categories.length],
        classifications[(i - 1) % classifications.length],
        ownerTeams[(i - 1) % ownerTeams.length],
        stamp,
        stamp
      );
    }
  }

  const meetingCount = db.prepare("SELECT COUNT(*) AS count FROM meetings").get().count;
  if (meetingCount === 0) {
    const insertMeeting = db.prepare(
      "INSERT INTO meetings (title, description, meeting_type, start_at, end_at, teams_link, created_by_user_id, team, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const teams = ["support", "clinical", "operations"];
    const meetingTypes = ["digital", "internal"];
    const base = new Date("2026-04-08T08:00:00.000Z");

    for (let i = 1; i <= 36; i += 1) {
      const start = new Date(base.getTime() + (i * 45 * 60 * 1000));
      const end = new Date(start.getTime() + (30 * 60 * 1000));
      const createdAt = addDays(base, Math.floor(i / 6)).toISOString();
      insertMeeting.run(
        `Seeded Meeting ${i}`,
            `Seeded meeting ${i} for calendar and filtering demos.`,
        meetingTypes[(i - 1) % meetingTypes.length],
        start.toISOString(),
        end.toISOString(),
        `https://teams.example/meeting/${i}`,
        ((i - 1) % 4) + 1,
        teams[(i - 1) % teams.length],
        createdAt,
        createdAt
      );
    }
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
