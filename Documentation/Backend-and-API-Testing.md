# Backend and API Testing Baseline

## Scope implemented

Backend MVP baseline is implemented in [Backend/server](../Backend/server) with:
- Express server bootstrap
- Static frontend hosting from `wwwroot` (when built assets exist)
- SQLite database initialization and seed data
- Auth endpoints:
  - POST /api/auth/login
  - GET /api/auth/me
  - POST /api/auth/logout
- Cases endpoints:
  - GET /api/cases
  - POST /api/cases
  - GET /api/cases/:id
  - PATCH /api/cases/:id
- Records endpoints:
  - GET /api/records
  - GET /api/records/:id
- Documents endpoints:
  - GET /api/documents
  - GET /api/documents/search
  - POST /api/documents
  - POST /api/documents/upload (multipart/form-data)
  - GET /api/documents/:id
  - PATCH /api/documents/:id/classification
- Procedures endpoints:
  - GET /api/procedures
  - GET /api/procedures/:id
- Meetings endpoints:
  - GET /api/meetings
  - POST /api/meetings
  - PATCH /api/meetings/:id
  - GET /api/meetings/:id
- Admin endpoints:
  - GET /api/admin/users
  - PATCH /api/admin/users/:id/role
  - GET /api/admin/audit
  - GET /api/admin/settings/security-mode
  - PATCH /api/admin/settings/security-mode
- Assistant endpoints:
  - POST /api/assistant/ask
  - GET /api/assistant/sources/:answerId
  - GET /api/assistant/mismatches (admin)
  - GET /api/assistant/settings/role-aware-mode (admin)
  - PATCH /api/assistant/settings/role-aware-mode (admin)
- JWT-based API authorization middleware
- Logout token revocation using JWT jti plus revoked-token checks in auth middleware
- Basic RBAC behavior for SupportAgent scope in case reads/list
- Role-aware record and document responses
- Role-aware procedure and meeting responses
- Admin-only role guard for admin and audit reads
- Audit logging for login/logout and domain read/write events, including denied case/meeting access paths
- Document upload validation (basic): allowed mime types and max file size checks

## Run backend locally

From [Backend](../Backend):

```bash
npm install
npm run dev
```

Default runtime values:
- PORT: 3001
- DB_PATH: ./northstar.db
- JWT_SECRET: northstar-dev-secret

Azure App Service runtime behavior:
- When App Service environment markers are present (`WEBSITE_SITE_NAME`, `WEBSITE_INSTANCE_ID`, or `WEBSITE_RESOURCE_GROUP`), backend runtime defaults automatically switch to writable storage paths:
  - DB_PATH default: `/home/data/northstar.db`
  - DOCUMENT_UPLOAD_ROOT default: `/home/site/uploads`
- You can override both via environment variables:
  - `DB_PATH`
  - `DOCUMENT_UPLOAD_ROOT`

Seeding behavior:
- On an empty database, backend bootstrap now seeds a richer demo dataset (about 36 rows each for cases, case comments, records, documents, procedures, and meetings; users remain 4 seeded demo accounts).

## Test strategy implemented

Tests are in [Backend/tests](../Backend/tests):
- Unit tests: [Backend/tests/unit](../Backend/tests/unit)
- API tests: [Backend/tests/api](../Backend/tests/api)
- E2E tests: [Backend/tests/e2e](../Backend/tests/e2e)

Commands:

```bash
npm run test:unit
npm run test:api
npm run test:e2e
npm test
```

## Current passing suites

- Unit: cases, documents, procedures, meetings, admin, assistant service behavior, and runtime path resolution for local vs App Service defaults
- API: auth (including logout invalidation), cases, records, documents (including multipart upload + search/classification), procedures, meetings (including day filtering), assistant, and admin/audit flows; includes regression for configured upload-root persistence
- E2E: auth -> cases flow, auth -> documents -> records flow, auth -> procedures -> meetings flow, auth -> admin -> audit flow, and auth -> assistant flow; includes configured upload-root persistence assertion
- API regression: frontend static asset serving and SPA fallback routing

Cross-reference:
- Full user-story implementation status is maintained in [Documentation/User-Story-Coverage.md](./User-Story-Coverage.md).

## Next backend increments

- Add validation middleware for all write endpoints
- Add pagination and sorting for list endpoints
- Expand seed data to scenario-driven security exercises
- Harden role-change propagation for already-issued tokens
