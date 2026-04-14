# Northstar Care Portal

Project scaffold for the Northstar Care Portal simulation.

## Current implementation status

- Specifications are documented in [Specifications/Northstar Care Portal.md](Specifications/Northstar%20Care%20Portal.md).
- Interaction YAML catalog is documented in [Specifications/Northstar Care Portal Interactions.md](Specifications/Northstar%20Care%20Portal%20Interactions.md).
- Azure Storage integration documented in [Specifications/Azure-Storage-Interactions.md](Specifications/Azure-Storage-Interactions.md).
- Backend MVP baseline is implemented in [Backend](Backend) with auth, cases, records, documents, procedures, meetings, and admin/audit APIs.
- Auth logout now revokes issued JWT tokens and middleware rejects revoked tokens.
- Backend and test details are documented in [Documentation/Backend-and-API-Testing.md](Documentation/Backend-and-API-Testing.md).
- **Azure Blob Storage integration**: Documents can be stored in local filesystem (dev) or Azure Blob Storage (production) via environment-based configuration. Full setup guide in [Documentation/Azure-Blob-Storage-Setup.md](Documentation/Azure-Blob-Storage-Setup.md).
- Frontend MVP baseline is implemented in [Frontend](Frontend) with authenticated routes, create/edit forms for cases and meetings, and admin controls.
- Frontend now also includes Assistant flows, document search, admin document classification controls, case detail route views, and meetings day/team filters.
- Document upload now supports multipart file submission with configurable storage backend (local or Azure Blob Storage).
- Document download functionality added: authenticated users can download uploaded documents via file links with role-based access control and audit logging. Works seamlessly with both storage backends.
- Meetings create/edit forms use native date-time pickers, and meeting list timestamps are shown in local date-time format.
- Frontend and test details are documented in [Documentation/Frontend-and-Testing.md](Documentation/Frontend-and-Testing.md).
- Full user-story coverage matrix is documented in [Documentation/User-Story-Coverage.md](Documentation/User-Story-Coverage.md).

## Backend quick start

From [Backend](Backend):

```bash
npm install
npm run dev
```

Backend runtime storage defaults:
- **Local/dev**: `DB_PATH` defaults to `./northstar.db`, uploads default to `./uploads`. Storage uses local filesystem.
- **Azure App Service**: When `WEBSITE_SITE_NAME` (or equivalent App Service markers) is present, defaults switch to writable paths:
	- DB: `/home/data/northstar.db`
	- Uploads: `/home/site/uploads`
	- **Storage**: Automatically uses Azure Blob Storage (requires `AZURE_STORAGE_CONNECTION_STRING`)

### Storage Configuration

Document storage can be explicitly configured via environment variables:

```bash
# Local filesystem storage (default)
STORAGE_TYPE=local

# Azure Blob Storage
STORAGE_TYPE=azure
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...
AZURE_STORAGE_CONTAINER_NAME=documents  # optional, defaults to "documents"
```

Optional backend environment variables:
- `DB_PATH` (absolute or relative path to SQLite file)
- `DOCUMENT_UPLOAD_ROOT` (absolute or relative path to uploaded files directory; local storage only)
- `STORAGE_TYPE` (`local` or `azure`; auto-detected on Azure AppService)
- `AZURE_STORAGE_CONNECTION_STRING` (Azure connection string for blob storage)
- `AZURE_STORAGE_CONTAINER_NAME` (Azure blob container name; defaults to `documents`)
- `JWT_SECRET` (JWT signing secret)
- `PORT` (HTTP port; App Service injects this automatically)

## Test commands

From [Backend](Backend):

```bash
npm run test:unit
npm run test:api
npm run test:e2e
npm test
```

## Frontend quick start

From [Frontend](Frontend):

```bash
npm install
npm run dev
```

Frontend dev server runs on port 5173 by default and proxies `/api` and `/health` to `http://localhost:3001`, so CORS is avoided during local development.

Optional environment variable:
- `VITE_API_BASE_URL` (default: empty, same-origin)

## Build frontend for backend serving

From [Frontend](Frontend):

```bash
npm run build
```

The frontend build now outputs to [Backend/wwwroot](Backend/wwwroot). When `index.html` exists in that directory, the backend serves static assets and supports SPA route fallback.

## Frontend test commands

From [Frontend](Frontend):

```bash
npm run test:unit
npm run test:api
npm run test:e2e
npm test
```

## Demo runbook

### 1. Start backend

From [Backend](Backend):

```bash
npm install
npm run dev
```

Backend runs on port 3001 by default.

### 2. Start frontend

From [Frontend](Frontend):

```bash
npm install
npm run dev
```

Frontend runs on port 5173 by default and proxies API calls to backend port 3001.

### 3. Open the app

Open the local Vite URL shown in terminal (typically http://localhost:5173) and sign in with one of the demo users below.

## Seeded demo data

Yes, the database is auto-seeded when backend starts and tables are empty.

Seeded entities include:
- 5 roles: SupportAgent, Manager, Clinician, Admin, ExternalConsultant
- 4 users
- 36 cases
- 36 case comments
- 36 records
- 36 documents with role-based permissions
- 36 procedures
- 36 meetings
- 1 system setting: security_mode=secure

Demo credentials (all use password: secret):
- anna.support (SupportAgent)
- mikael.manager (Manager)
- clara.clinician (Clinician)
- adam.admin (Admin)

## Demo script by role

Use this as a quick presenter flow.

### SupportAgent flow (anna.support)

1. Log in and open Dashboard to show scope counters.
2. Go to Cases and create a new case with title + description.
3. Open the case detail route from the case list to show detailed read behavior.
4. Edit the case status/priority to show optimistic UI updates.
5. Open Documents, upload a text/pdf/doc document, then run a search with title/tag/category filters.
6. Open Records and note that support role sees restricted metadata.
7. Open Meetings, create a meeting entry, then apply day/team filters.
8. Open Assistant and ask an operations question, then inspect source list.

### Clinician flow (clara.clinician)

1. Log in and open Records.
2. Show that clinician role can view richer record detail than support.
3. Open Procedures and show clinical/internal procedure visibility.

### Admin flow (adam.admin)

1. Log in and open Admin.
2. Toggle security mode (secure <-> misconfigured).
3. Change a user role from the role assignment controls.
4. Classify a document as Restricted from Documents page.
5. Toggle Assistant Guard Mode (enabled/disabled).
6. Ask a question from Assistant page and compare mismatch behavior by guard mode.
7. Apply audit filters (eventType/result) and show security-relevant events.

### Manager flow (optional, mikael.manager)

1. Log in and review team-level pages (Cases/Meetings).
2. Compare visibility against SupportAgent to explain RBAC differences.

## Reseed from scratch

If you want to reset to a fresh demo dataset:

1. Stop backend.
2. Delete the local SQLite database file created in [Backend](Backend) (named northstar.db) if it exists.
3. Start backend again with npm run dev.

This recreates schema and seed data on startup.

For Azure App Service, reseeding uses the resolved `DB_PATH` location (default `/home/data/northstar.db`) instead of project-relative paths.

Current specification status:
- Product, scope, roles, user stories, architecture, data model, API contracts, and MVP roadmap are documented in [Specifications/Northstar Care Portal.md](Specifications/Northstar%20Care%20Portal.md).
- User stories US-01 through US-30 are mapped to compliant YAML Use Case Interaction Specifications in [Specifications/Northstar Care Portal Interactions.md](Specifications/Northstar%20Care%20Portal%20Interactions.md), with an index link from section 4.9 in [Specifications/Northstar Care Portal.md](Specifications/Northstar%20Care%20Portal.md#L219).

Current implementation progress against user stories:
- Implemented in this iteration: US-16 (document search), US-18 (document classification), US-23 (assistant question), US-24 (assistant sources), US-25 (permission mismatch flags), US-26 (role-aware assistant mode).
- Full US-01 to US-30 implementation status (implemented/partial/missing) is tracked in [Documentation/User-Story-Coverage.md](Documentation/User-Story-Coverage.md).

## Azure DevOps pipeline

- A CI pipeline is now available at [azure-pipelines.yaml](azure-pipelines.yaml).
- Trigger: push to `main` only.
- Order of execution:
	1. Install backend and frontend dependencies.
	2. Build frontend into [Backend/wwwroot](Backend/wwwroot).
	3. Verify that repository is still clean after build (`git status --porcelain` must be empty).
	4. Start backend and verify hosted endpoints (`/health` and `/`).
	5. Run frontend and backend test suites (JUnit output).
	6. Run dependency scans for backend and frontend using `npm audit`.
	7. Generate and publish a consolidated CI report summary and artifact.

Generated CI artifacts are published from `Testing/reports` as artifact name `ci-report`.