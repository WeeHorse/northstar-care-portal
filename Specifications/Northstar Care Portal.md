# Northstar Care Portal

## 1. Produktmål

Den simulerade portalen ska ge studerande eller utvecklare en realistisk men hanterbar miljö där de kan:

* läsa och hantera kundärenden
* se journalöversikter på en säker abstraherad nivå
* ladda upp och hitta dokument
* söka i interna rutiner
* boka eller visa digitala möten
* se rollstyrd åtkomst
* analysera säkerhetsbrister i en hybrid/molnliknande lösning
* förstå hur portal, identitet, data, loggning och AI-stöd hänger ihop

Det passar också kursens fokus på att identifiera risker, implementera säkerhetsåtgärder, analysera hybrid- och multicloudmiljöer och kommunicera säkerhetsfrågor.  

---

## 2. Scope för den simulerade portalen

### I scope

* Inloggad portal med roller
* Dashboard
* Ärendehantering
* Journalöversikt i simulerad form
* Dokumentbibliotek
* Rutinsök
* Mötes-/bokningsöversikt
* Enkel AI-assistentvy
* Auditlogg för aktivitet
* Adminvy för användare och roller

### Out of scope

* riktig Entra ID-inloggning
* riktig SharePoint-, Teams- eller Outlook-integration
* riktig AI/RAG-motor
* riktig filstorage i molnet
* verklig patientjournalhantering

I stället simuleras dessa delar lokalt, men datamodellen och gränssnitten utformas så att de liknar en riktig lösning.

---

## 3. Roller

Utifrån caset finns behov av minst dessa roller: supportpersonal, chefer, administratörer och externa konsulter/leverantörer med varierande access. 

### Roller i systemet

* **SupportAgent**

  * läsa och uppdatera kundärenden
  * läsa interna rutiner
  * se dokument de har tillgång till
  * skapa mötesbokningar
* **Manager**

  * allt en SupportAgent kan
  * se rapporter och statusöversikter
  * se teamets ärenden
  * läsa fler dokument
* **Clinician**

  * se journalöversikter och relaterade ärenden
  * läsa kliniska rutiner
* **Admin**

  * hantera användare, roller, systeminställningar
  * se auditloggar
  * hantera dokumentklassning
* **ExternalConsultant**

  * begränsad åtkomst till utvalda dokument och tekniska ärenden

---

## 4. User Stories

## 4.1 Autentisering och session

**US-01 – Logga in**
Som användare vill jag kunna logga in med användarnamn och lösenord så att jag kommer åt portalens funktioner utifrån min roll.

**Acceptanskriterier**

* användare med giltiga uppgifter får en session/token
* ogiltiga uppgifter ger felmeddelande
* användarens roll returneras efter inloggning
* alla inloggningsförsök loggas

**US-02 – Behålla session**
Som användare vill jag kunna ladda om sidan utan att förlora min session direkt, så att portalen fungerar som en riktig webbapp.

**US-03 – Logga ut**
Som användare vill jag kunna logga ut så att ingen obehörig använder min session.

---

## 4.2 Dashboard

**US-04 – Se översikt**
Som supportagent vill jag se en startsida med mina öppna ärenden, senaste dokument och kommande möten så att jag snabbt kan börja arbeta.

**US-05 – Chefsvy**
Som chef vill jag se statistik över teamets ärenden, öppna incidenter och dokumentaktivitet så att jag kan prioritera och följa upp.

---

## 4.3 Ärendehantering

**US-06 – Lista ärenden**
Som supportagent vill jag se en lista över ärenden filtrerade på status, prioritet och ägare så att jag snabbt hittar rätt ärenden.

**US-07 – Ärendedetalj**
Som supportagent vill jag öppna ett ärende och se kund, kategori, historik, relaterade dokument och kommentarer så att jag kan fortsätta hanteringen.

**US-08 – Uppdatera ärende**
Som supportagent vill jag kunna ändra status, lägga till kommentar och tilldela om ett ärende så att arbetet kan drivas framåt.

**US-09 – Skapa ärende**
Som supportagent vill jag kunna registrera ett nytt ärende med kund, beskrivning, kategori och prioritet.

**US-10 – Chefens teamfilter**
Som chef vill jag kunna se alla ärenden inom mitt team, inte bara mina egna.

---

## 4.4 Journalöversikt

Eftersom portalen i caset är central för journalhantering men samtidigt säkerhetskänslig bör den simulerade portalen visa en kontrollerad, begränsad journalmodell. 

**US-11 – Visa journalöversikt**
Som klinisk användare vill jag se en journalöversikt med patient-ID, senaste kontakt, status och länkade anteckningar så att jag får en snabb bild.

**US-12 – Begränsad access**
Som supportagent vill jag inte kunna se full journalinformation, endast metadata som behövs för ärendehantering.

**US-13 – Åtkomstlogg**
Som admin vill jag att alla försök att läsa journaldata loggas för spårbarhet.

---

## 4.5 Dokument och rutiner

Caset beskriver uppladdning av dokument, sök i interna rutiner och agentkoppling till SharePoint, Azure-lagring och Google Drive.  

**US-14 – Dokumentlista**
Som användare vill jag kunna se dokument jag har åtkomst till.

**US-15 – Ladda upp dokument**
Som användare vill jag kunna ladda upp ett dokument med titel, kategori, klassning och taggar.

**US-16 – Söka dokument**
Som användare vill jag kunna söka dokument på titel, tagg och kategori.

**US-17 – Läs rutin**
Som supportagent vill jag kunna läsa interna rutiner så att jag kan följa processerna korrekt.

**US-18 – Dokumentklassning**
Som admin vill jag kunna klassificera dokument som Public, Internal, Confidential eller Restricted.

**US-19 – Begränsad dokumentåtkomst**
Som extern konsult vill jag bara se dokument som uttryckligen delats med min roll.

---

## 4.6 Möten och bokning

**US-20 – Visa bokningar**
Som användare vill jag se mina kommande möten i portalen.

**US-21 – Skapa bokning**
Som supportagent vill jag kunna skapa ett digitalt möte med patient/kund, tid och Teams-länk-placeholder.

**US-22 – Filtrera bokningar**
Som chef vill jag kunna se bokningar per team eller dag.

---

## 4.7 AI-assistent

Intervjun säger att AI-agenten kan ge breda svar eftersom dokumentbehörighet inte är fullt implementerad. Det är en viktig del att simulera som risk. 

**US-23 – Fråga assistenten**
Som användare vill jag kunna ställa en fråga till en AI-assistent och få ett svar baserat på interna dokument.

**US-24 – Visa källor**
Som användare vill jag se vilka dokument svaret bygger på.

**US-25 – Riskflagga**
Som admin vill jag kunna se när assistenten har svarat utifrån dokument som användaren egentligen inte borde ha åtkomst till, för att illustrera säkerhetsrisk.

**US-26 – Begränsa efter roll**
Som admin vill jag kunna slå på ett läge där assistenten bara söker i dokument som matchar användarens behörighet.

---

## 4.8 Audit och säkerhet

Eftersom loggning, spårbarhet, ad hoc-behörigheter och frånvaro av strikt modell lyfts i intervjun bör säkerhetsdelarna vara tydliga. 

**US-27 – Auditlogg**
Som admin vill jag kunna se en lista över säkerhetsrelevanta händelser som login, dokumentöppningar, journalvisningar och rolländringar.

**US-28 – Se åtkomstfel**
Som admin vill jag kunna se när användare nekats åtkomst till resurser.

**US-29 – Hantera roller**
Som admin vill jag kunna ändra en användares roll och se att detta påverkar åtkomsten direkt.

**US-30 – Demonstrera felkonfiguration**
Som lärare/admin vill jag kunna slå på en “osäker demo-konfiguration” där vissa roller får för bred åtkomst, för att skapa analysövningar.

---

## 4.9 Use Case Interaction Specifications (YAML)

Interaktionsspecifikationerna har flyttats till en separat fil för enklare underhall:
[Specifications/Northstar Care Portal Interactions.md](Specifications/Northstar%20Care%20Portal%20Interactions.md).

---

## 5. Icke-funktionella krav

### Säkerhet

* lösenord lagras hashade, aldrig i klartext
* sessionshantering med httpOnly-cookie eller bearer-token
* enkel RBAC i backend
* auditlogg på säkerhetsrelevanta event
* filuppladdning begränsas till tillåtna typer
* input-validering på alla POST/PUT/PATCH
* enkel rate limiting på login
* inga fullständiga personnummer eller verkliga journaldata i seeddata

### Prestanda

* listvyer ska svara under 500 ms i normal lokal miljö
* sökningar ska stödja pagination

### Tillgänglighet

* tydliga felmeddelanden
* semantisk HTML i frontend
* tangentbordsnavigering i basflöden

### Underhållbarhet

* tydlig separering mellan routes, controllers, services och repository-lager
* enkel SQLite-setup för lokal körning
* seedscript för demo-data

---

## 6. Tech spec

## 6.1 Arkitekturöversikt

### Frontend

* React
* React Router med data router
* pages-baserad struktur
* loaders/actions för datahämtning och formulärhantering
* push state-url:er för filter, sök och detaljvyer

### Backend

* Node.js
* Express
* imperativ REST-API
* SQLite via bättre-sqlite3 eller sqlite3
* enkel service/repository-struktur
* JWT eller cookie-baserad session

### Databas

* SQLite-fil, exempelvis `northstar.db`

### Kommunikationsmönster

* frontend hämtar data via REST
* loader i route hämtar listor och detaljdata
* action i route skickar formulärdata till backend
* query params i URL används för filter/sortering/pagination

---

## 6.2 Föreslagen frontend-struktur

```text
src/
  app/
    router.tsx
    api.ts
    auth.ts
  pages/
    login/
      LoginPage.tsx
    dashboard/
      DashboardPage.tsx
    cases/
      CasesPage.tsx
      CaseDetailPage.tsx
      CaseEditPage.tsx
    records/
      RecordListPage.tsx
      RecordDetailPage.tsx
    documents/
      DocumentsPage.tsx
      DocumentDetailPage.tsx
      UploadDocumentPage.tsx
    procedures/
      ProceduresPage.tsx
      ProcedureDetailPage.tsx
    meetings/
      MeetingsPage.tsx
      MeetingDetailPage.tsx
    assistant/
      AssistantPage.tsx
    admin/
      UsersPage.tsx
      RolesPage.tsx
      AuditLogPage.tsx
  components/
    layout/
    tables/
    forms/
    guards/
    badges/
    search/
  types/
  utils/
```

---

## 6.3 Routing med data router

Exempel på route-map:

```text
/
  /login
  /dashboard
  /cases
  /cases/:caseId
  /cases/:caseId/edit
  /records
  /records/:recordId
  /documents
  /documents/:documentId
  /documents/upload
  /procedures
  /procedures/:procedureId
  /meetings
  /meetings/:meetingId
  /assistant
  /admin/users
  /admin/roles
  /admin/audit
```

### Push state-url exempel

* `/cases?status=open&priority=high&q=portal`
* `/documents?classification=internal&tag=policy`
* `/meetings?date=2026-04-07&team=support`
* `/assistant?q=Hur+eskalerar+jag+ett+journalärende`

Det gör att sidorna blir delbara, navigerbara och testbara.

---

## 6.4 Backend-struktur

```text
server/
  app.js
  routes/
    auth.routes.js
    cases.routes.js
    records.routes.js
    documents.routes.js
    procedures.routes.js
    meetings.routes.js
    assistant.routes.js
    admin.routes.js
    audit.routes.js
  controllers/
  services/
  repositories/
  middleware/
    auth.js
    requireRole.js
    validate.js
    errorHandler.js
  db/
    schema.sql
    seed.sql
    connection.js
```

---

## 6.5 REST-endpoints

## Auth

* `POST /api/auth/login`
* `POST /api/auth/logout`
* `GET /api/auth/me`

## Cases

* `GET /api/cases`
* `POST /api/cases`
* `GET /api/cases/:id`
* `PATCH /api/cases/:id`
* `GET /api/cases/:id/comments`
* `POST /api/cases/:id/comments`

## Records

* `GET /api/records`
* `GET /api/records/:id`

## Documents

* `GET /api/documents`
* `POST /api/documents`
* `GET /api/documents/:id`
* `GET /api/documents/:id/download`

## Procedures

* `GET /api/procedures`
* `GET /api/procedures/:id`

## Meetings

* `GET /api/meetings`
* `POST /api/meetings`
* `GET /api/meetings/:id`
* `PATCH /api/meetings/:id`

## Assistant

* `POST /api/assistant/query`

## Admin

* `GET /api/admin/users`
* `PATCH /api/admin/users/:id/role`
* `GET /api/admin/audit`
* `PATCH /api/admin/settings/security-mode`

---

## 6.6 Datamodell i SQLite

Här är en rimlig första version.

### users

* id
* username
* password_hash
* full_name
* email
* role_id
* team_id
* is_active
* created_at
* updated_at

### roles

* id
* name
* description

### teams

* id
* name

### cases

* id
* external_ref
* title
* description
* status
* priority
* category
* customer_name
* assigned_user_id
* team_id
* related_record_id
* created_at
* updated_at

### case_comments

* id
* case_id
* user_id
* comment_text
* created_at

### records

* id
* patient_ref
* summary
* status
* sensitivity_level
* last_contact_at
* owner_team_id
* created_at
* updated_at

### documents

* id
* title
* description
* filename
* mime_type
* storage_path
* classification
* category
* uploaded_by_user_id
* created_at
* updated_at

### document_tags

* id
* document_id
* tag

### document_permissions

* id
* document_id
* role_id nullable
* user_id nullable
* team_id nullable
* access_level

### procedures

* id
* title
* body_markdown
* category
* classification
* owner_team_id
* created_at
* updated_at

### meetings

* id
* title
* description
* meeting_type
* start_at
* end_at
* teams_link
* created_by_user_id
* related_case_id nullable
* related_record_id nullable
* created_at
* updated_at

### audit_logs

* id
* actor_user_id nullable
* event_type
* entity_type
* entity_id
* result
* metadata_json
* created_at

### assistant_queries

* id
* user_id
* question
* answer
* source_count
* had_permission_mismatch
* created_at

---

## 6.7 SQL-skiss

```sql
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role_id INTEGER NOT NULL,
  team_id INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_ref TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  status TEXT NOT NULL,
  sensitivity_level TEXT NOT NULL,
  last_contact_at TEXT,
  owner_team_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_team_id) REFERENCES teams(id)
);

CREATE TABLE cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_ref TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  category TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  assigned_user_id INTEGER,
  team_id INTEGER,
  related_record_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (assigned_user_id) REFERENCES users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (related_record_id) REFERENCES records(id)
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  result TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);
```

---

## 6.8 RBAC-regler i backend

### Exempelregler

* `SupportAgent`

  * cases: read/write egna och teamets enligt policy
  * records: read metadata only
  * documents: read allowed
  * procedures: read allowed
* `Clinician`

  * records: full read
  * cases: full read/write relaterade till vårdflöde
* `Manager`

  * team-level access till cases, meetings, procedures, vissa documents
* `Admin`

  * full access
* `ExternalConsultant`

  * explicit allow only

Detta bör göras i middleware + service-lager, inte bara i frontend.

---

## 6.9 Simulerad AI-assistent

Eftersom riktig AI inte behöver vara i scope kan assistenten fungera så här:

1. användaren skickar fråga
2. backend gör enkel keyword-sökning i `procedures` och `documents`
3. backend bygger ett sammanställt svar
4. backend markerar om träfflistan innehåller dokument som användaren inte borde se
5. svaret returneras med källreferenser

Exempelrespons:

```json
{
  "answer": "För att eskalera ett journalärende ska du först verifiera identitet och sedan följa rutin NS-PROC-12.",
  "sources": [
    { "id": 12, "title": "Eskalering av journalärenden" }
  ],
  "hadPermissionMismatch": true
}
```

Det gör att AI-delen blir pedagogisk ur säkerhetsperspektiv, vilket matchar casets riskbild. 

---

## 6.10 Säkerhetsfunktioner som bör byggas in

För att passa caset extra bra skulle jag lägga in dessa “medvetna säkerhetspunkter”:

* auditlogg vid login, journalvisning, dokumentöppning och rolländring
* möjlighet att köra i två lägen:

  * **secure mode**
  * **misconfigured mode**
* dokumentklassning och behörighetskontroll
* rollbaserad filtrering i alla backend-endpoints
* enkel “least privilege”-rapport i adminvyn
* varningsbanner om AI-assistenten använder otillåtna källor
* visning av publika kontra interna resurser

---

## 7. Sidstruktur i frontend

## Login

* formulär
* felmeddelanden
* demoanvändare

## Dashboard

* Mina ärenden
* Teamstatus
* Kommande möten
* Senast uppdaterade rutiner
* Säkerhetsnotiser

## Cases

* tabell med filter i URL
* detaljvy
* kommentarssektion
* relaterade dokument
* relaterad journalmetadata

## Records

* lista
* detaljvy med begränsat eller utökat innehåll beroende på roll

## Documents

* lista
* sök
* filtrering på klassning
* uppladdning
* detaljvy

## Procedures

* lista
* markdown-vy
* kategorifilter

## Meetings

* lista
* agenda
* detaljvy

## Assistant

* fråga/svar
* källor
* varning om säkerhetsövertramp

## Admin

* användarlista
* rolländring
* systemläge
* auditlogg
* säkerhetsöversikt

---

## 8. Exempel på seeddata

Du tjänar mycket på att ge portalen rik demo-data.

### Exempel

* 8–12 användare
* 4 roller
* 2–3 team
* 25 ärenden
* 10 journalöversikter
* 20 dokument
* 15 rutiner
* 12 möten
* 100+ auditloggar

### Särskilt bra demoexempel

* ett dokument som extern konsult felaktigt kan se i misconfigured mode
* ett AI-svar som visar otillåten källa
* ett ärende relaterat till portalavbrott
* ett ärende relaterat till dokumentåtkomst
* ett journalärende med begränsad metadata för support

---

## 9. API-kontrakt, exempel

### POST /api/auth/login

Request:

```json
{
  "username": "anna.support",
  "password": "secret"
}
```

Response:

```json
{
  "user": {
    "id": 1,
    "fullName": "Anna Support",
    "role": "SupportAgent"
  },
  "token": "..."
}
```

### GET /api/cases?status=open&priority=high

Response:

```json
{
  "items": [
    {
      "id": 14,
      "externalRef": "NS-2026-014",
      "title": "Patient kunde inte ansluta till digitalt möte",
      "status": "open",
      "priority": "high",
      "assignedUserName": "Anna Support"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

---

## 10. MVP-prioritering

Jag hade byggt detta i tre steg.

### MVP 1

* login
* dashboard
* ärendelista + detalj
* dokumentlista + sök
* rutiner
* enkel RBAC
* auditlogg

### MVP 2

* journalöversikt
* möten
* adminvy
* filuppladdning
* URL-drivna filter

### MVP 3

* AI-assistent
* secure/misconfigured mode
* säkerhetsöversikter
* fler rapporter

---

## 11. Varför denna spec passar Northstar Care

Den här lösningen speglar att Northstar Care har:

* en central portal för ärenden, journalrelaterat arbete och möten
* dokument i flera miljöer
* rollstyrning som idag är lite för bred
* AI-stöd som ännu inte fullt respekterar dokumentbehörigheter
* loggning som finns men inte är helt mogen
* behov av att analysera risker i en hybrid/molnliknande miljö.  

Den passar också kursens lärandemål om att förstå molnsäkerhet, identifiera risker, implementera säkerhetslösningar och kommunicera dem. 

---

## 12. Rekommenderad implementationston

För att få det pedagogiskt starkt skulle jag uttryckligen göra portalen som en **simulerad verksamhetsportal för säkerhetsanalys**, inte som ett försök att bygga ett riktigt journalsystem. Då blir det tydligt att:

* vissa data är abstraherade
* vissa integrationer är mockade
* säkerhetsriskerna är avsiktligt framhävda för analys

