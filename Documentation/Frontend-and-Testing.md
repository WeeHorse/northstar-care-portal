# Frontend and Testing Baseline

## Scope implemented

Frontend baseline is implemented in [Frontend](../Frontend) with:
- React + Vite app scaffold
- Role-aware authenticated shell with route guard
- Route-level loading fallback and error boundary
- Pages wired to current backend endpoints:
  - /login
  - /dashboard
  - /cases
  - /records
  - /documents
  - /procedures
  - /meetings
  - /admin
- API client integration against backend REST APIs
- Persistent session in localStorage
- Create/edit forms for cases and meetings with optimistic UI updates
- Admin role-assignment controls and audit filter controls
- Responsive UI layout for desktop and mobile

## Run frontend locally

From [Frontend](../Frontend):

```bash
npm install
npm run dev
```

Optional environment variable:
- VITE_API_BASE_URL (default: http://localhost:3001)

## Test strategy implemented

Tests are in [Frontend/src/tests](../Frontend/src/tests):
- Unit tests: [Frontend/src/tests/unit](../Frontend/src/tests/unit)
- API tests: [Frontend/src/tests/api](../Frontend/src/tests/api)
- E2E tests: [Frontend/src/tests/e2e](../Frontend/src/tests/e2e)

Commands:

```bash
npm run test:unit
npm run test:api
npm run test:e2e
npm test
```

## Current passing suites

- Unit: auth context session behavior
- API: frontend API client requests, mutation helpers, and filter query handling
- E2E: login flow to dashboard, cases create/edit flow, and admin controls flow

## Next frontend increments

- Add role-specific UI masking for admin navigation item
- Add pagination/sorting controls matching backend list query capabilities
- Add richer dashboard visualizations and domain-specific cards
