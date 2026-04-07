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
  - /cases/:id
  - /records
  - /documents
  - /procedures
  - /meetings
  - /assistant
  - /admin
- API client integration against backend REST APIs
- Persistent session in localStorage with restore validation via /api/auth/me
- Logout flow that calls backend logout then clears local session
- Create/edit forms for cases and meetings with optimistic UI updates
- Dedicated case detail page bound to case detail API reads
- Meetings filtering by team and day
- Document upload form with file picker and metadata fields
- Admin role-assignment controls and audit filter controls
- Document search (title/tag/category) and admin document classification controls
- Assistant question flow with source rendering and permission mismatch indicator support
- Admin assistant guard mode toggle and mismatch event list
- Responsive UI layout for desktop and mobile

Cross-reference:
- Full user-story implementation status is maintained in [Documentation/User-Story-Coverage.md](./User-Story-Coverage.md).

## Run frontend locally

From [Frontend](../Frontend):

```bash
npm install
npm run dev
```

Optional environment variable:
- VITE_API_BASE_URL (default: empty, same-origin)

Local development defaults:
- Vite runs on port 5173
- `/api` and `/health` are proxied to `http://localhost:3001` to avoid CORS issues

Production-style build output:
- `npm run build` writes static files to `../Backend/wwwroot`
- Backend serves `wwwroot` when `index.html` exists, including SPA fallback for client-side routes

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

- Unit: auth context session behavior and assistant page behavior
- API: frontend API client requests, mutation helpers, filter query handling, meeting day/team filters, document upload/search/classification calls, and assistant calls
- E2E: login flow to dashboard, cases create/edit flow, admin controls flow, and assistant ask/sources flow

## Next frontend increments

- Add role-specific UI masking for admin navigation item
- Add pagination/sorting controls matching backend list query capabilities
- Add richer dashboard visualizations and domain-specific cards
