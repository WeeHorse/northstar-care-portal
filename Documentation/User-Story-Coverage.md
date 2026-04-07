# User Story Coverage Matrix

This matrix tracks specification coverage versus implementation status for all US-01 through US-30 stories.

Legend:
- Graph: whether the request/response/core interaction spec exists in [Specifications/Northstar Care Portal Interactions.md](../Specifications/Northstar%20Care%20Portal%20Interactions.md)
- Implementation status:
  - Implemented: shipped and test-covered in current app
  - Partial: some behavior exists but acceptance criteria are not fully met
  - Missing: no meaningful implementation yet

| User Story | Graph | Implementation | Notes |
|---|---|---|---|
| US-01 Logga in | Created | Implemented | Login endpoint and UI flow are present and tested. |
| US-02 Behalla session | Created | Partial | Session persists in local storage, but token refresh/expiry handling is limited. |
| US-03 Logga ut | Created | Partial | Frontend clears local session; backend logout is stateless and does not revoke tokens. |
| US-04 Se oversikt | Created | Implemented | Dashboard counters for cases, records, documents, meetings are implemented. |
| US-05 Chefsvy dashboard | Created | Partial | Manager uses same dashboard shell; dedicated manager analytics are limited. |
| US-06 Lista arenden | Created | Implemented | Case listing with status/priority filters and role-aware scope exists. |
| US-07 Arendedetalj | Created | Partial | Backend detail endpoint exists; frontend lacks a dedicated case detail page. |
| US-08 Uppdatera arende | Created | Partial | Status/priority/title updates exist; richer history/comments flow is limited. |
| US-09 Skapa arende | Created | Implemented | Create case flow is implemented in UI and API with tests. |
| US-10 Chefens teamfilter | Created | Partial | Team scoping exists in backend model but limited explicit manager filter UX. |
| US-11 Visa journaloversikt | Created | Partial | Record list/detail exists, but dedicated overview composition is limited. |
| US-12 Begransad access | Created | Implemented | Support/external users receive restricted record metadata views. |
| US-13 Atkomstlogg journaldata | Created | Partial | Successful record reads are logged; denied-path coverage is limited. |
| US-14 Dokumentlista | Created | Implemented | Role-aware document list is implemented and tested. |
| US-15 Ladda upp dokument | Created | Partial | Metadata-based create exists; real file upload handling is not implemented. |
| US-16 Soka dokument | Created | Implemented | Search by title/tag/category is implemented in API and UI with tests. |
| US-17 Las rutin | Created | Implemented | Procedure list/detail with role-aware visibility is implemented. |
| US-18 Dokumentklassning | Created | Implemented | Admin can classify documents via API and UI, with tests. |
| US-19 Begransad dokumentatkomst | Created | Implemented | External role visibility is constrained by document permissions. |
| US-20 Visa bokningar | Created | Implemented | Meeting list by user scope exists in frontend and backend. |
| US-21 Skapa bokning | Created | Implemented | Meeting create flow is implemented in UI and API with tests. |
| US-22 Filtrera bokningar | Created | Partial | Team filtering exists; day-specific filtering is limited. |
| US-23 Fraga assistenten | Created | Implemented | Assistant ask endpoint and frontend page are implemented. |
| US-24 Visa kallor | Created | Implemented | Assistant source retrieval endpoint and UI rendering are implemented. |
| US-25 Riskflagga | Created | Implemented | Permission mismatch flags are produced and surfaced to admin. |
| US-26 Begransa efter roll | Created | Implemented | Admin role-aware assistant mode toggle is implemented and persisted. |
| US-27 Auditlogg | Created | Implemented | Admin audit listing/filtering is implemented and tested. |
| US-28 Se atkomstfel | Created | Partial | Denied events exist for selected flows; broader denied-event coverage is limited. |
| US-29 Hantera roller | Created | Implemented | Admin role assignment change flow is implemented and tested. |
| US-30 Demonstrera felkonfiguration | Created | Implemented | Security mode toggle (secure/misconfigured) is implemented and tested. |

## Stories still not fully complete

Partial:
- US-02, US-03, US-05, US-07, US-08, US-10, US-11, US-13, US-15, US-22, US-28

Missing:
- None
