# Northstar Care Portal

Project scaffold for the Northstar Care Portal simulation.

## Current implementation status

- Specifications are documented in [Specifications/Northstar Care Portal.md](Specifications/Northstar%20Care%20Portal.md).
- Interaction YAML catalog is documented in [Specifications/Northstar Care Portal Interactions.md](Specifications/Northstar%20Care%20Portal%20Interactions.md).
- Backend MVP baseline is implemented in [Backend](Backend) with auth, cases, records, documents, procedures, and meetings APIs.
- Backend and test details are documented in [Documentation/Backend-and-API-Testing.md](Documentation/Backend-and-API-Testing.md).

## Backend quick start

From [Backend](Backend):

```bash
npm install
npm run dev
```

## Test commands

From [Backend](Backend):

```bash
npm run test:unit
npm run test:api
npm run test:e2e
npm test
```

Current specification status:
- Product, scope, roles, user stories, architecture, data model, API contracts, and MVP roadmap are documented in [Specifications/Northstar Care Portal.md](Specifications/Northstar%20Care%20Portal.md).
- User stories US-01 through US-30 are mapped to compliant YAML Use Case Interaction Specifications in [Specifications/Northstar Care Portal Interactions.md](Specifications/Northstar%20Care%20Portal%20Interactions.md), with an index link from section 4.9 in [Specifications/Northstar Care Portal.md](Specifications/Northstar%20Care%20Portal.md#L219).