import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function nowIso() {
  return new Date().toISOString();
}

function addDays(baseDate, offsetDays) {
  const next = new Date(baseDate);
  next.setUTCDate(next.getUTCDate() + offsetDays);
  return next;
}

export function initDb(db, { uploadRoot = path.resolve("uploads") } = {}) {
  const schemaPath = path.resolve(__dirname, "schema.sql");
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
        `Seeded comment ${i} for case ${i}.`,
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

    const patientSummaries = [
      "Type 2 Diabetes Mellitus, hypertension, stable on metformin and lisinopril. Recent HbA1c 6.8%. Last visit 2026-03-15.",
      "Hypertension, hyperlipidemia managed with amlodipine and atorvastatin. BP well controlled. Follow-up scheduled.",
      "COPD GOLD stage 2, using tiotropium inhaler daily. Non-smoker for 5 years. Pulmonary function tests stable.",
      "Depression managed with sertraline 50mg daily. Stable mood, no suicidal ideation. CBT ongoing.",
      "Hypothyroidism on levothyroxine 75mcg. TSH 2.4 mIU/L within target range. Annual monitoring.",
      "Rheumatoid arthritis on methotrexate and adalimumab. DAS28-CRP 2.1 (low disease activity).",
      "Chronic kidney disease stage 3a, eGFR 48 ml/min. Proteinuria managed with ACE inhibitor.",
      "Atrial fibrillation on apixaban for anticoagulation. Rate controlled with diltiazem. No recent events.",
      "Asthma intermittent, using albuterol as needed. Peak flow 420 L/min. Well controlled.",
      "Obesity (BMI 32.5), enrolled in weight management program. Lost 8 kg over 6 months.",
    ];

    for (let i = 1; i <= 36; i += 1) {
      const stamp = addDays(base, i).toISOString();
      insertRecord.run(
        `PT-${String(10000 + i)}`,
        patientSummaries[(i - 1) % patientSummaries.length],
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
      "INSERT INTO documents (title, description, classification, category, tags, uploaded_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const insertPermission = db.prepare(
      "INSERT INTO document_permissions (document_id, role_id, access_level) VALUES (?, ?, ?)"
    );

    const medicalDocuments = [
      { title: "Lab Results - FBC 2026-04-10", description: "Full blood count: WBC 7.2, RBC 4.8, Hb 14.2 g/dL, Platelets 245", category: "clinical", tags: "lab,hematology,results" },
      { title: "Lab Results - CMP 2026-04-10", description: "Comprehensive metabolic panel: Glucose 98, Creatinine 0.9, Potassium 4.2, Sodium 138", category: "clinical", tags: "lab,chemistry,results" },
      { title: "Prescription - Metformin", description: "Metformin 500mg twice daily for Type 2 Diabetes. QTY: 60 tablets. Insurance approved.", category: "clinical", tags: "prescription,medication,diabetes" },
      { title: "Prescription - Lisinopril", description: "Lisinopril 10mg once daily for hypertension. QTY: 30 tablets. Refills: 3", category: "clinical", tags: "prescription,medication,hypertension" },
      { title: "Clinical Note 2026-04-09", description: "Patient presenting with hypertension, BP 158/92. Medication adjusted. Follow-up in 2 weeks.", category: "clinical", tags: "notes,visit,follow-up" },
      { title: "Lab Results - Lipid Panel", description: "Total cholesterol 218, LDL 145, HDL 38, Triglycerides 156. Needs dietary modification.", category: "clinical", tags: "lab,lipids,results" },
      { title: "Imaging Report - CXR 2026-04-08", description: "Chest X-ray: No acute findings. Heart size normal. Lungs clear bilaterally. No pneumonia.", category: "clinical", tags: "imaging,xray,results" },
      { title: "Discharge Summary 2026-04-05", description: "Admitted April 1 with pneumonia, treated with antibiotics. Discharged in stable condition.", category: "clinical", tags: "discharge,summary,hospital" },
      { title: "Lab Results - Thyroid Panel", description: "TSH 2.1 mIU/L, Free T4 16.5 pmol/L. Thyroid function normal. No medication change needed.", category: "clinical", tags: "lab,thyroid,results" },
      { title: "Prescription - Levothyroxine", description: "Levothyroxine 75mcg once daily in morning on empty stomach. QTY: 90 tablets.", category: "clinical", tags: "prescription,medication,thyroid" },
      { title: "Clinical Note 2026-04-06", description: "Patient reviewed for diabetes management. HbA1c target achieved. Lifestyle counseling provided.", category: "clinical", tags: "notes,visit,diabetes" },
      { title: "Lab Results - HbA1c", description: "HbA1c 6.8% (51 mmol/mol). Improved from previous 7.2%. Target range achieved.", category: "clinical", tags: "lab,diabetes,results" },
      { title: "Imaging Report - Ultrasound Abdomen", description: "Abdominal ultrasound: Liver homogeneous, gallbladder normal, no free fluid. Kidneys normal.", category: "clinical", tags: "imaging,ultrasound,results" },
      { title: "Prescription - Amlodipine", description: "Amlodipine 5mg once daily for hypertension. QTY: 30 tablets. Starting dose.", category: "clinical", tags: "prescription,medication,hypertension" },
      { title: "Lab Results - Urinalysis", description: "Urinalysis: Clear, pH 6.5, no glucose, no protein, no blood. Culture negative.", category: "clinical", tags: "lab,urinalysis,results" },
      { title: "Clinical Note 2026-04-03", description: "Annual physical examination completed. All vital signs stable. Preventive care plan updated.", category: "clinical", tags: "notes,visit,physical" },
      { title: "Lab Results - HSV IgM", description: "HSV IgM serology: Negative. HSV IgG positive (prior exposure). No acute infection.", category: "clinical", tags: "lab,serology,results" },
      { title: "Prescription - Sertraline", description: "Sertraline 50mg once daily for depression. Monitor for side effects. 4-week review.", category: "clinical", tags: "prescription,medication,mental-health" },
      { title: "Clinical Note 2026-04-01", description: "Patient admitted with acute gastroenteritis. Started on IV fluids and antiemetics. Improving.", category: "clinical", tags: "notes,admission,hospital" },
      { title: "Lab Results - Blood Cultures", description: "Blood cultures x2: No growth. Incubated for 5 days. Contamination ruled out.", category: "clinical", tags: "lab,cultures,results" },
    ];

    const base = new Date("2026-04-02T11:00:00.000Z");
    const classifications = ["Internal", "Confidential", "Restricted"];

    for (let i = 1; i <= 36; i += 1) {
      const stamp = addDays(base, i).toISOString();
      const doc = medicalDocuments[(i - 1) % medicalDocuments.length];

      const created = insertDocument.run(
        doc.title,
        doc.description,
        classifications[(i - 1) % classifications.length],
        doc.category,
        doc.tags,
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

  // Create uploaded medical document files
  const uploadedDocCount = db.prepare("SELECT COUNT(*) AS count FROM documents WHERE file_name IS NOT NULL").get().count;
  if (uploadedDocCount < 3) {
    const insertDocument = db.prepare(
      "INSERT INTO documents (title, description, classification, category, tags, uploaded_by_user_id, file_name, file_mime_type, file_size_bytes, storage_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const insertPermission = db.prepare(
      "INSERT INTO document_permissions (document_id, role_id, access_level) VALUES (?, ?, ?)"
    );

    fs.mkdirSync(uploadRoot, { recursive: true });

    // Medical Document 1: Diabetes Management Protocol
    const diabetesContent = `DIABETES MANAGEMENT PROTOCOL
Patient ID: PT-10015
Date of Assessment: 2026-04-09

PATIENT INFORMATION:
- Age: 58 years old
- Gender: Female
- BMI: 28.2 kg/m²
- Duration of Diabetes: 12 years

CURRENT MEDICATIONS:
1. Metformin 500mg PO BID
2. Lisinopril 10mg PO OD
3. Atorvastatin 40mg PO OD
4. Aspirin 75mg PO OD

RECENT LABORATORY RESULTS:
- Fasting Glucose: 98 mg/dL (Target: 80-130 mg/dL)
- HbA1c: 6.8% (Target: <7%)
- Total Cholesterol: 218 mg/dL
- LDL: 145 mg/dL
- HDL: 38 mg/dL
- Triglycerides: 156 mg/dL
- Creatinine: 0.9 mg/dL
- eGFR: 78 ml/min/1.73m²

PHYSICAL EXAMINATION:
- Blood Pressure: 138/86 mmHg (slightly elevated)
- Heart Rate: 72 bpm (regular)
- No evidence of diabetic retinopathy on dilated eye exam
- Peripheral pulses intact bilaterally
- Sensation intact to monofilament testing

ASSESSMENT:
Type 2 Diabetes Mellitus, well-controlled. No acute complications noted.

RECOMMENDATIONS:
1. Continue current diabetes medications
2. Dietary counseling: low glycemic index diet
3. Exercise: 150 minutes per week moderate intensity
4. Repeat HbA1c testing in 3 months
5. Annual retinopathy screening
6. Adjust blood pressure medications if BP remains >140/90 at next visit`;

    const diabetesPath = path.join(uploadRoot, `${Date.now()}-diabetes-protocol.txt`);
    fs.writeFileSync(diabetesPath, diabetesContent);
    const diabetesSize = Buffer.byteLength(diabetesContent);

    const diabetesDoc = insertDocument.run(
      "Diabetes Management Protocol - PT-10015",
      "Comprehensive diabetes management assessment with medication review, lab results, and clinical recommendations",
      "Restricted",
      "clinical",
      "diabetes,management,protocol,guidelines",
      3,
      "diabetes-protocol.txt",
      "text/plain",
      diabetesSize,
      diabetesPath,
      new Date("2026-04-09T10:30:00.000Z").toISOString(),
      new Date("2026-04-09T10:30:00.000Z").toISOString()
    );
    insertPermission.run(diabetesDoc.lastInsertRowid, 4, "read");
    insertPermission.run(diabetesDoc.lastInsertRowid, 3, "read");

    // Medical Document 2: Hypertension Follow-up Note
    const hypertensionContent = `HYPERTENSION FOLLOW-UP CLINICAL NOTE
Patient ID: PT-10023
Date of Visit: 2026-04-08
Clinician: Dr. Sarah Mitchell

CHIEF COMPLAINT:
Blood pressure monitoring and medication adjustment

VITAL SIGNS:
- BP (right arm, sitting): 158/92 mmHg
- BP (left arm, sitting): 156/90 mmHg
- HR: 76 bpm
- RR: 16 breaths/min
- Temperature: 36.8°C

HISTORY OF PRESENT ILLNESS:
Patient reports occasional headaches in the morning. Denies chest pain, shortness of breath, or dizziness. Good medication adherence. Lifestyle modifications ongoing.

CURRENT MEDICATIONS:
- Amlodipine 5mg OD
- Lisinopril 10mg OD
- Hydrochlorothiazide 25mg OD

PHYSICAL EXAMINATION:
- General: Well-appearing, no acute distress
- HEENT: No signs of hypertensive retinopathy
- Neck: No JVD, normal carotid upstroke
- Chest: Regular rate and rhythm, no murmurs
- Abdomen: Soft, non-tender, no bruits
- Extremities: No edema, pulses normal

ASSESSMENT:
Uncontrolled Stage 2 Hypertension on current triple therapy

PLAN:
1. Increase amlodipine to 10mg daily
2. Add doxazosin 2mg daily for additional BP reduction
3. Increase physical activity to 30 minutes daily
4. Reduce sodium intake to <2300mg per day
5. Recheck BP in 2 weeks
6. Repeat ECG if BP remains uncontrolled

PATIENT EDUCATION:
Discussed importance of medication adherence and lifestyle modifications. Patient demonstrates understanding.`;

    const hypertensionPath = path.join(uploadRoot, `${Date.now()}-hypertension-note.txt`);
    fs.writeFileSync(hypertensionPath, hypertensionContent);
    const hypertensionSize = Buffer.byteLength(hypertensionContent);

    const hypertensionDoc = insertDocument.run(
      "Hypertension Follow-up Note - PT-10023",
      "Clinical assessment of uncontrolled hypertension with updated medication regimen and follow-up plan",
      "Restricted",
      "clinical",
      "hypertension,follow-up,medications,assessment",
      3,
      "hypertension-note.txt",
      "text/plain",
      hypertensionSize,
      hypertensionPath,
      new Date("2026-04-08T14:15:00.000Z").toISOString(),
      new Date("2026-04-08T14:15:00.000Z").toISOString()
    );
    insertPermission.run(hypertensionDoc.lastInsertRowid, 4, "read");
    insertPermission.run(hypertensionDoc.lastInsertRowid, 3, "read");

    // Medical Document 3: Laboratory Report Summary
    const labReportContent = `COMPREHENSIVE LABORATORY REPORT
Patient ID: PT-10031
Date of Collection: 2026-04-10
Laboratory: Central Diagnostic Labs

COMPLETE BLOOD COUNT (CBC):
- White Blood Cell Count: 7.2 K/uL (4.5-11.0)
- Red Blood Cell Count: 4.8 M/uL (4.5-5.5 female)
- Hemoglobin: 14.2 g/dL (12.0-16.0 female)
- Hematocrit: 42.5% (36-46 female)
- Mean Corpuscular Volume: 88 fL (80-100)
- Platelets: 245 K/uL (150-400)
- Differential: Normal distribution

COMPREHENSIVE METABOLIC PANEL (CMP):
- Glucose: 98 mg/dL (fasting, 70-100)
- Blood Urea Nitrogen: 19 mg/dL (7-20)
- Creatinine: 0.9 mg/dL (0.6-1.2)
- Sodium: 138 mEq/L (135-145)
- Potassium: 4.2 mEq/L (3.5-5.0)
- Chloride: 102 mEq/L (98-107)
- CO2: 24 mEq/L (23-29)
- Calcium: 9.5 mg/dL (8.5-10.2)

LIVER FUNCTION TESTS:
- Albumin: 4.2 g/dL (3.5-5.0)
- Total Protein: 7.1 g/dL (6.0-8.3)
- ALT: 28 U/L (7-35)
- AST: 32 U/L (10-40)
- Alkaline Phosphatase: 72 U/L (30-120)
- Total Bilirubin: 0.8 mg/dL (0.1-1.2)
- Direct Bilirubin: 0.2 mg/dL (0.0-0.3)

LIPID PANEL:
- Total Cholesterol: 218 mg/dL (<200 optimal)
- LDL Cholesterol: 145 mg/dL (<100 optimal)
- HDL Cholesterol: 38 mg/dL (>40 female desired)
- Triglycerides: 156 mg/dL (<150 optimal)

THYROID PANEL:
- TSH: 2.1 mIU/L (0.4-4.0)
- Free T4: 16.5 pmol/L (12-22)

URINALYSIS:
- Color: Clear
- Appearance: Clear
- pH: 6.5 (4.5-8.0)
- Specific Gravity: 1.025 (1.005-1.030)
- Protein: Negative
- Glucose: Negative
- Blood: Negative
- Nitrites: Negative
- Bacteria: None
- White Blood Cells: None

INTERPRETATION:
Overall results within normal limits except for slightly elevated cholesterol and LDL levels. Recommend continued dietary modifications and consider re-evaluation in 3 months.

Tested by: Michael Chen, MLT
Reviewed by: Dr. Patricia Rodriguez, MD`;

    const labReportPath = path.join(uploadRoot, `${Date.now()}-lab-report.txt`);
    fs.writeFileSync(labReportPath, labReportContent);
    const labReportSize = Buffer.byteLength(labReportContent);

    const labReportDoc = insertDocument.run(
      "Comprehensive Laboratory Report - PT-10031",
      "Complete blood count, metabolic panel, liver function tests, lipid panel, thyroid function, and urinalysis results",
      "Restricted",
      "clinical",
      "laboratory,results,pathology,testing",
      3,
      "lab-report.txt",
      "text/plain",
      labReportSize,
      labReportPath,
      new Date("2026-04-10T09:45:00.000Z").toISOString(),
      new Date("2026-04-10T09:45:00.000Z").toISOString()
    );
    insertPermission.run(labReportDoc.lastInsertRowid, 4, "read");
    insertPermission.run(labReportDoc.lastInsertRowid, 3, "read");
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
        `Seeded Procedure ${i}`,
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
  const hasFileNameColumn = documentColumns.some((column) => column.name === "file_name");
  if (!hasFileNameColumn) {
    db.exec("ALTER TABLE documents ADD COLUMN file_name TEXT");
  }
  const hasFileMimeTypeColumn = documentColumns.some((column) => column.name === "file_mime_type");
  if (!hasFileMimeTypeColumn) {
    db.exec("ALTER TABLE documents ADD COLUMN file_mime_type TEXT");
  }
  const hasFileSizeBytesColumn = documentColumns.some((column) => column.name === "file_size_bytes");
  if (!hasFileSizeBytesColumn) {
    db.exec("ALTER TABLE documents ADD COLUMN file_size_bytes INTEGER");
  }
  const hasStoragePathColumn = documentColumns.some((column) => column.name === "storage_path");
  if (!hasStoragePathColumn) {
    db.exec("ALTER TABLE documents ADD COLUMN storage_path TEXT");
  }
}
