# Backend and API Testing Baseline

## Scope implemented

Backend MVP baseline is implemented in [Backend/server](../Backend/server) with:
- Express server bootstrap
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
  - POST /api/documents
  - GET /api/documents/:id
- Procedures endpoints:
  - GET /api/procedures
  - GET /api/procedures/:id
- Meetings endpoints:
  - GET /api/meetings
  - POST /api/meetings
  - GET /api/meetings/:id
- JWT-based API authorization middleware
- Basic RBAC behavior for SupportAgent scope in case reads/list
- Role-aware record and document responses
- Role-aware procedure and meeting responses
- Audit logging for login and domain read/write events

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

- Unit: cases, documents, procedures, and meetings service behavior
- API: auth, cases, records, documents, procedures, and meetings flows
- E2E: auth -> cases flow, auth -> documents -> records flow, and auth -> procedures -> meetings flow

## Next backend increments

- Add remaining domain endpoints from specification (admin, audit read)
- Add validation middleware for all write endpoints
- Add pagination and sorting for list endpoints
- Expand seed data to scenario-driven security exercises
- Add role mutation endpoint and security-mode toggle
