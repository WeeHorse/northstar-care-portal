## 4.9 Use Case Interaction Specifications (YAML)

Nedan är en YAML-specifikation per user story, enligt kraven i `.github/copilot-instructions.md`.

### Interaction Index

| Use Case | Interaction | Core Function |
|---|---|---|
| Authentication and Session | US-01 User logs in | loginUser |
| Authentication and Session | US-02 User keeps active session | restoreUserSession |
| Authentication and Session | US-03 User logs out | logoutUser |
| Dashboard | US-04 Support agent views dashboard overview | getSupportDashboardOverview |
| Dashboard | US-05 Manager views team dashboard | getManagerDashboardOverview |
| Case Management | US-06 Support agent lists cases | listCases |
| Case Management | US-07 Support agent views case detail | getCaseDetail |
| Case Management | US-08 Support agent updates case | updateCase |
| Case Management | US-09 Support agent creates case | createCase |
| Case Management | US-10 Manager filters team cases | listTeamCases |
| Record Overview | US-11 Clinician views record overview | getRecordOverview |
| Record Overview | US-12 Support agent gets restricted record metadata | getRestrictedRecordMetadata |
| Record Overview | US-13 Admin audits record access | listRecordAccessAuditLogs |
| Documents and Procedures | US-14 User lists accessible documents | listAccessibleDocuments |
| Documents and Procedures | US-15 User uploads document | uploadDocument |
| Documents and Procedures | US-15a User downloads document | downloadDocumentFile |
| Documents and Procedures | US-16 User searches documents | searchDocuments |
| Documents and Procedures | US-17 Support agent reads internal procedure | getProcedureDetail |
| Documents and Procedures | US-18 Admin classifies document | classifyDocument |
| Documents and Procedures | US-19 External consultant sees only shared documents | listConsultantSharedDocuments |
| Meetings | US-20 User views upcoming bookings | listUpcomingMeetings |
| Meetings | US-21 Support agent creates booking | createMeeting |
| Meetings | US-22 Manager filters bookings by team or day | listTeamMeetings |
| AI Assistant | US-23 User sends a care assistant chat message | handleAssistantChat |
| AI Assistant | US-24 User sees assistant sources | getAssistantAnswerSources |
| AI Assistant | US-25 Admin sees permission mismatch flags | listAssistantPermissionMismatchEvents |
| AI Assistant | US-26 Admin changes assistant lab mode | setAssistantMode |
| AI Assistant | US-26a Admin filters assistant security audit events | listAssistantAuditEvents |
| AI Assistant | US-26b Admin inspects assistant audit metadata | inspectAssistantAuditEvent |
| Audit and Security | US-27 Admin views audit log | listAuditEvents |
| Audit and Security | US-28 Admin views denied access events | listDeniedAccessEvents |
| Audit and Security | US-29 Admin changes user role | changeUserRole |
| Audit and Security | US-30 Admin toggles misconfigured demo mode | setSecurityConfigurationMode |

```yaml
use_case: "Authentication and Session"
interaction: "US-01 User logs in"

request_graph:
  - function: "postLoginEndpoint"
    layer: "boundary"
    responsibility: "Receive login request"
  - function: "mapLoginRequest"
    layer: "utility"
    responsibility: "Map payload to login command"
  - function: "loginUser"
    layer: "core"
    responsibility: "Authenticate user and create session"

core:
  function: "loginUser"
  responsibility: "Authenticate user and create session"
  delegates:
    - "verifyUserCredentials"
    - "issueSessionToken"
    - "writeLoginAuditLog"

response_graph:
  - function: "mapLoginResult"
    layer: "utility"
    responsibility: "Map authentication result to response DTO"
  - function: "sendLoginResponse"
    layer: "boundary"
    responsibility: "Return login response"

shared_functions:
  - "mapLoginRequest"
  - "mapLoginResult"
```

```yaml
use_case: "Authentication and Session"
interaction: "US-02 User keeps active session"

request_graph:
  - function: "getSessionEndpoint"
    layer: "boundary"
    responsibility: "Receive session restore request"
  - function: "extractSessionToken"
    layer: "utility"
    responsibility: "Extract token from cookie or header"
  - function: "restoreUserSession"
    layer: "core"
    responsibility: "Restore active user session"

core:
  function: "restoreUserSession"
  responsibility: "Restore active user session"
  delegates:
    - "validateSessionToken"
    - "loadSessionUser"
    - "refreshSessionExpiry"

response_graph:
  - function: "mapSessionResult"
    layer: "utility"
    responsibility: "Map restored session to response DTO"
  - function: "sendSessionResponse"
    layer: "boundary"
    responsibility: "Return session status"

shared_functions:
  - "extractSessionToken"
  - "mapSessionResult"
```

```yaml
use_case: "Authentication and Session"
interaction: "US-03 User logs out"

request_graph:
  - function: "postLogoutEndpoint"
    layer: "boundary"
    responsibility: "Receive logout request"
  - function: "mapLogoutRequest"
    layer: "utility"
    responsibility: "Map request to logout command"
  - function: "logoutUser"
    layer: "core"
    responsibility: "Terminate active user session"

core:
  function: "logoutUser"
  responsibility: "Terminate active user session"
  delegates:
    - "extractSessionToken"
    - "invalidateSessionToken"
    - "writeLogoutAuditLog"

response_graph:
  - function: "mapLogoutResult"
    layer: "utility"
    responsibility: "Map logout result to response DTO"
  - function: "sendLogoutResponse"
    layer: "boundary"
    responsibility: "Return logout confirmation"

shared_functions:
  - "extractSessionToken"
  - "mapLogoutResult"
```

```yaml
use_case: "Dashboard"
interaction: "US-04 Support agent views dashboard overview"

request_graph:
  - function: "getDashboardEndpoint"
    layer: "boundary"
    responsibility: "Receive dashboard request"
  - function: "mapDashboardQuery"
    layer: "utility"
    responsibility: "Map query and user context to dashboard criteria"
  - function: "getSupportDashboardOverview"
    layer: "core"
    responsibility: "Build support dashboard overview"

core:
  function: "getSupportDashboardOverview"
  responsibility: "Build support dashboard overview"
  delegates:
    - "listOpenCasesForUser"
    - "listRecentDocumentsForUser"
    - "listUpcomingMeetingsForUser"

response_graph:
  - function: "mapDashboardOverviewResult"
    layer: "utility"
    responsibility: "Map dashboard data to response DTO"
  - function: "sendDashboardResponse"
    layer: "boundary"
    responsibility: "Return dashboard overview"

shared_functions:
  - "mapDashboardQuery"
  - "mapDashboardOverviewResult"
```

```yaml
use_case: "Dashboard"
interaction: "US-05 Manager views team dashboard"

request_graph:
  - function: "getManagerDashboardEndpoint"
    layer: "boundary"
    responsibility: "Receive manager dashboard request"
  - function: "mapManagerDashboardQuery"
    layer: "utility"
    responsibility: "Map manager filters to dashboard criteria"
  - function: "getManagerDashboardOverview"
    layer: "core"
    responsibility: "Build team-level dashboard overview"

core:
  function: "getManagerDashboardOverview"
  responsibility: "Build team-level dashboard overview"
  delegates:
    - "aggregateTeamCaseStats"
    - "listOpenIncidentsForTeam"
    - "aggregateTeamDocumentActivity"

response_graph:
  - function: "mapManagerDashboardResult"
    layer: "utility"
    responsibility: "Map manager dashboard data to response DTO"
  - function: "sendManagerDashboardResponse"
    layer: "boundary"
    responsibility: "Return manager dashboard overview"

shared_functions:
  - "mapManagerDashboardQuery"
  - "mapManagerDashboardResult"
```

```yaml
use_case: "Case Management"
interaction: "US-06 Support agent lists cases"

request_graph:
  - function: "getCasesEndpoint"
    layer: "boundary"
    responsibility: "Receive case list request"
  - function: "mapCaseListQuery"
    layer: "utility"
    responsibility: "Map filter and paging query to criteria"
  - function: "listCases"
    layer: "core"
    responsibility: "List cases by filter criteria"

core:
  function: "listCases"
  responsibility: "List cases by filter criteria"
  delegates:
    - "enforceCaseAccessPolicy"
    - "fetchCasesByCriteria"
    - "computeCaseListPagination"

response_graph:
  - function: "mapCaseListResult"
    layer: "utility"
    responsibility: "Map case list to response DTO"
  - function: "sendCaseListResponse"
    layer: "boundary"
    responsibility: "Return filtered case list"

shared_functions:
  - "mapCaseListQuery"
  - "mapCaseListResult"
```

```yaml
use_case: "Case Management"
interaction: "US-07 Support agent views case detail"

request_graph:
  - function: "getCaseDetailEndpoint"
    layer: "boundary"
    responsibility: "Receive case detail request"
  - function: "mapCaseDetailRequest"
    layer: "utility"
    responsibility: "Map case identifier and user context"
  - function: "getCaseDetail"
    layer: "core"
    responsibility: "Load full case detail for authorized user"

core:
  function: "getCaseDetail"
  responsibility: "Load full case detail for authorized user"
  delegates:
    - "enforceCaseAccessPolicy"
    - "fetchCaseDetailById"
    - "attachRelatedCaseResources"

response_graph:
  - function: "mapCaseDetailResult"
    layer: "utility"
    responsibility: "Map case detail to response DTO"
  - function: "sendCaseDetailResponse"
    layer: "boundary"
    responsibility: "Return case detail"

shared_functions:
  - "mapCaseDetailRequest"
  - "mapCaseDetailResult"
```

```yaml
use_case: "Case Management"
interaction: "US-08 Support agent updates case"

request_graph:
  - function: "patchCaseEndpoint"
    layer: "boundary"
    responsibility: "Receive case update request"
  - function: "mapCaseUpdateRequest"
    layer: "utility"
    responsibility: "Map payload to case update command"
  - function: "updateCase"
    layer: "core"
    responsibility: "Apply case status and assignment updates"

core:
  function: "updateCase"
  responsibility: "Apply case status and assignment updates"
  delegates:
    - "validateCaseUpdateCommand"
    - "persistCaseUpdate"
    - "writeCaseUpdateAuditLog"

response_graph:
  - function: "mapCaseUpdateResult"
    layer: "utility"
    responsibility: "Map updated case to response DTO"
  - function: "sendCaseUpdateResponse"
    layer: "boundary"
    responsibility: "Return updated case"

shared_functions:
  - "mapCaseUpdateRequest"
  - "mapCaseUpdateResult"
```

```yaml
use_case: "Case Management"
interaction: "US-09 Support agent creates case"

request_graph:
  - function: "postCaseEndpoint"
    layer: "boundary"
    responsibility: "Receive create case request"
  - function: "mapCreateCaseRequest"
    layer: "utility"
    responsibility: "Map payload to create case command"
  - function: "createCase"
    layer: "core"
    responsibility: "Create a new support case"

core:
  function: "createCase"
  responsibility: "Create a new support case"
  delegates:
    - "validateCreateCaseCommand"
    - "generateCaseExternalReference"
    - "saveNewCase"

response_graph:
  - function: "mapCreateCaseResult"
    layer: "utility"
    responsibility: "Map created case to response DTO"
  - function: "sendCreateCaseResponse"
    layer: "boundary"
    responsibility: "Return created case"

shared_functions:
  - "mapCreateCaseRequest"
  - "mapCreateCaseResult"
```

```yaml
use_case: "Case Management"
interaction: "US-10 Manager filters team cases"

request_graph:
  - function: "getTeamCasesEndpoint"
    layer: "boundary"
    responsibility: "Receive manager team case request"
  - function: "mapTeamCaseFilterQuery"
    layer: "utility"
    responsibility: "Map team filter query to criteria"
  - function: "listTeamCases"
    layer: "core"
    responsibility: "List cases for manager team scope"

core:
  function: "listTeamCases"
  responsibility: "List cases for manager team scope"
  delegates:
    - "validateManagerTeamScope"
    - "fetchTeamCasesByCriteria"
    - "computeCaseListPagination"

response_graph:
  - function: "mapTeamCaseListResult"
    layer: "utility"
    responsibility: "Map team case list to response DTO"
  - function: "sendTeamCaseListResponse"
    layer: "boundary"
    responsibility: "Return manager team case list"

shared_functions:
  - "mapTeamCaseFilterQuery"
  - "mapTeamCaseListResult"
```

```yaml
use_case: "Record Overview"
interaction: "US-11 Clinician views record overview"

request_graph:
  - function: "getRecordOverviewEndpoint"
    layer: "boundary"
    responsibility: "Receive record overview request"
  - function: "mapRecordOverviewRequest"
    layer: "utility"
    responsibility: "Map record identifier and user context"
  - function: "getRecordOverview"
    layer: "core"
    responsibility: "Load record overview for authorized clinician"

core:
  function: "getRecordOverview"
  responsibility: "Load record overview for authorized clinician"
  delegates:
    - "enforceRecordAccessPolicy"
    - "fetchRecordOverviewById"
    - "loadLinkedRecordNotes"

response_graph:
  - function: "mapRecordOverviewResult"
    layer: "utility"
    responsibility: "Map record overview to response DTO"
  - function: "sendRecordOverviewResponse"
    layer: "boundary"
    responsibility: "Return record overview"

shared_functions:
  - "mapRecordOverviewRequest"
  - "mapRecordOverviewResult"
```

```yaml
use_case: "Record Overview"
interaction: "US-12 Support agent gets restricted record metadata"

request_graph:
  - function: "getRestrictedRecordEndpoint"
    layer: "boundary"
    responsibility: "Receive support record metadata request"
  - function: "mapRestrictedRecordRequest"
    layer: "utility"
    responsibility: "Map record request for metadata scope"
  - function: "getRestrictedRecordMetadata"
    layer: "core"
    responsibility: "Return restricted record metadata for support role"

core:
  function: "getRestrictedRecordMetadata"
  responsibility: "Return restricted record metadata for support role"
  delegates:
    - "enforceRestrictedRecordAccessPolicy"
    - "fetchRecordMetadataById"
    - "maskSensitiveRecordFields"

response_graph:
  - function: "mapRestrictedRecordResult"
    layer: "utility"
    responsibility: "Map restricted metadata to response DTO"
  - function: "sendRestrictedRecordResponse"
    layer: "boundary"
    responsibility: "Return restricted record metadata"

shared_functions:
  - "mapRestrictedRecordRequest"
  - "mapRestrictedRecordResult"
```

```yaml
use_case: "Record Overview"
interaction: "US-13 Admin audits record access"

request_graph:
  - function: "getRecordAccessAuditEndpoint"
    layer: "boundary"
    responsibility: "Receive record access audit request"
  - function: "mapRecordAccessAuditQuery"
    layer: "utility"
    responsibility: "Map audit filter query"
  - function: "listRecordAccessAuditLogs"
    layer: "core"
    responsibility: "List journal access events for traceability"

core:
  function: "listRecordAccessAuditLogs"
  responsibility: "List journal access events for traceability"
  delegates:
    - "validateAdminAccess"
    - "fetchRecordAccessAuditEvents"
    - "applyAuditPagination"

response_graph:
  - function: "mapRecordAccessAuditResult"
    layer: "utility"
    responsibility: "Map record access logs to response DTO"
  - function: "sendRecordAccessAuditResponse"
    layer: "boundary"
    responsibility: "Return record access audit log list"

shared_functions:
  - "mapRecordAccessAuditQuery"
  - "mapRecordAccessAuditResult"
```

```yaml
use_case: "Documents and Procedures"
interaction: "US-14 User lists accessible documents"

request_graph:
  - function: "getDocumentsEndpoint"
    layer: "boundary"
    responsibility: "Receive document list request"
  - function: "mapDocumentListQuery"
    layer: "utility"
    responsibility: "Map filter and paging query to document criteria"
  - function: "listAccessibleDocuments"
    layer: "core"
    responsibility: "List documents the user can access"

core:
  function: "listAccessibleDocuments"
  responsibility: "List documents the user can access"
  delegates:
    - "enforceDocumentAccessPolicy"
    - "fetchDocumentsByCriteria"
    - "computeDocumentListPagination"

response_graph:
  - function: "mapDocumentListResult"
    layer: "utility"
    responsibility: "Map document list to response DTO"
  - function: "sendDocumentListResponse"
    layer: "boundary"
    responsibility: "Return document list"

shared_functions:
  - "mapDocumentListQuery"
  - "mapDocumentListResult"
```

```yaml
use_case: "Documents and Procedures"
interaction: "US-15 User uploads document"

request_graph:
  - function: "postDocumentUploadEndpoint"
    layer: "boundary"
    responsibility: "Receive document upload request"
  - function: "mapDocumentUploadRequest"
    layer: "utility"
    responsibility: "Map multipart payload to upload command"
  - function: "uploadDocument"
    layer: "core"
    responsibility: "Store document and metadata"

core:
  function: "uploadDocument"
  responsibility: "Store document and metadata"
  delegates:
    - "validateDocumentUpload"
    - "storeDocumentBinary"
    - "saveDocumentMetadata"

response_graph:
  - function: "mapDocumentUploadResult"
    layer: "utility"
    responsibility: "Map uploaded document to response DTO"
  - function: "sendDocumentUploadResponse"
    layer: "boundary"
    responsibility: "Return upload result"

shared_functions:
  - "mapDocumentUploadRequest"
  - "mapDocumentUploadResult"
```

```yaml
use_case: "Documents and Procedures"
interaction: "US-16 User searches documents"

request_graph:
  - function: "getDocumentSearchEndpoint"
    layer: "boundary"
    responsibility: "Receive document search request"
  - function: "mapDocumentSearchQuery"
    layer: "utility"
    responsibility: "Map search terms and filters to search criteria"
  - function: "searchDocuments"
    layer: "core"
    responsibility: "Search accessible documents"

core:
  function: "searchDocuments"
  responsibility: "Search accessible documents"
  delegates:
    - "enforceDocumentAccessPolicy"
    - "queryDocumentsBySearchCriteria"
    - "computeDocumentListPagination"

response_graph:
  - function: "mapDocumentSearchResult"
    layer: "utility"
    responsibility: "Map search hits to response DTO"
  - function: "sendDocumentSearchResponse"
    layer: "boundary"
    responsibility: "Return document search result"

shared_functions:
  - "mapDocumentSearchQuery"
  - "mapDocumentSearchResult"
```

```yaml
use_case: "Documents and Procedures"
interaction: "US-17 Support agent reads internal procedure"

request_graph:
  - function: "getProcedureDetailEndpoint"
    layer: "boundary"
    responsibility: "Receive procedure detail request"
  - function: "mapProcedureDetailRequest"
    layer: "utility"
    responsibility: "Map procedure identifier and user context"
  - function: "getProcedureDetail"
    layer: "core"
    responsibility: "Load readable procedure content"

core:
  function: "getProcedureDetail"
  responsibility: "Load readable procedure content"
  delegates:
    - "enforceProcedureAccessPolicy"
    - "fetchProcedureById"
    - "renderProcedureMarkdown"

response_graph:
  - function: "mapProcedureDetailResult"
    layer: "utility"
    responsibility: "Map procedure detail to response DTO"
  - function: "sendProcedureDetailResponse"
    layer: "boundary"
    responsibility: "Return procedure detail"

shared_functions:
  - "mapProcedureDetailRequest"
  - "mapProcedureDetailResult"
```

```yaml
use_case: "Documents and Procedures"
interaction: "US-18 Admin classifies document"

request_graph:
  - function: "patchDocumentClassificationEndpoint"
    layer: "boundary"
    responsibility: "Receive document classification update request"
  - function: "mapDocumentClassificationRequest"
    layer: "utility"
    responsibility: "Map payload to classification command"
  - function: "classifyDocument"
    layer: "core"
    responsibility: "Update document classification"

core:
  function: "classifyDocument"
  responsibility: "Update document classification"
  delegates:
    - "validateDocumentClassificationLevel"
    - "persistDocumentClassification"
    - "writeDocumentClassificationAuditLog"

response_graph:
  - function: "mapDocumentClassificationResult"
    layer: "utility"
    responsibility: "Map classification update to response DTO"
  - function: "sendDocumentClassificationResponse"
    layer: "boundary"
    responsibility: "Return classified document"

shared_functions:
  - "mapDocumentClassificationRequest"
  - "mapDocumentClassificationResult"
```

```yaml
use_case: "Documents and Procedures"
interaction: "US-19 External consultant sees only shared documents"

request_graph:
  - function: "getConsultantDocumentsEndpoint"
    layer: "boundary"
    responsibility: "Receive consultant document list request"
  - function: "mapConsultantDocumentQuery"
    layer: "utility"
    responsibility: "Map consultant filters to query criteria"
  - function: "listConsultantSharedDocuments"
    layer: "core"
    responsibility: "List documents explicitly shared with consultant scope"

core:
  function: "listConsultantSharedDocuments"
  responsibility: "List documents explicitly shared with consultant scope"
  delegates:
    - "enforceConsultantDocumentScope"
    - "fetchSharedDocumentsForConsultant"
    - "computeDocumentListPagination"

response_graph:
  - function: "mapConsultantDocumentResult"
    layer: "utility"
    responsibility: "Map consultant document list to response DTO"
  - function: "sendConsultantDocumentResponse"
    layer: "boundary"
    responsibility: "Return consultant shared document list"

shared_functions:
  - "mapConsultantDocumentQuery"
  - "mapConsultantDocumentResult"
```

```yaml
use_case: "Meetings"
interaction: "US-20 User views upcoming bookings"

request_graph:
  - function: "getMeetingsEndpoint"
    layer: "boundary"
    responsibility: "Receive meeting list request"
  - function: "mapMeetingListQuery"
    layer: "utility"
    responsibility: "Map date and ownership filters"
  - function: "listUpcomingMeetings"
    layer: "core"
    responsibility: "List upcoming meetings for user scope"

core:
  function: "listUpcomingMeetings"
  responsibility: "List upcoming meetings for user scope"
  delegates:
    - "enforceMeetingAccessPolicy"
    - "fetchUpcomingMeetingsByCriteria"
    - "computeMeetingListPagination"

response_graph:
  - function: "mapMeetingListResult"
    layer: "utility"
    responsibility: "Map meeting list to response DTO"
  - function: "sendMeetingListResponse"
    layer: "boundary"
    responsibility: "Return meeting list"

shared_functions:
  - "mapMeetingListQuery"
  - "mapMeetingListResult"
```

```yaml
use_case: "Meetings"
interaction: "US-21 Support agent creates booking"

request_graph:
  - function: "postMeetingEndpoint"
    layer: "boundary"
    responsibility: "Receive create meeting request"
  - function: "mapCreateMeetingRequest"
    layer: "utility"
    responsibility: "Map payload to create meeting command"
  - function: "createMeeting"
    layer: "core"
    responsibility: "Create digital meeting booking"

core:
  function: "createMeeting"
  responsibility: "Create digital meeting booking"
  delegates:
    - "validateCreateMeetingCommand"
    - "generateTeamsLinkPlaceholder"
    - "saveMeeting"

response_graph:
  - function: "mapCreateMeetingResult"
    layer: "utility"
    responsibility: "Map created meeting to response DTO"
  - function: "sendCreateMeetingResponse"
    layer: "boundary"
    responsibility: "Return created meeting"

shared_functions:
  - "mapCreateMeetingRequest"
  - "mapCreateMeetingResult"
```

```yaml
use_case: "Meetings"
interaction: "US-22 Manager filters bookings by team or day"

request_graph:
  - function: "getTeamMeetingsEndpoint"
    layer: "boundary"
    responsibility: "Receive team meeting filter request"
  - function: "mapTeamMeetingFilterQuery"
    layer: "utility"
    responsibility: "Map team and day filters"
  - function: "listTeamMeetings"
    layer: "core"
    responsibility: "List meetings by team or date for manager"

core:
  function: "listTeamMeetings"
  responsibility: "List meetings by team or date for manager"
  delegates:
    - "validateManagerTeamScope"
    - "fetchTeamMeetingsByCriteria"
    - "computeMeetingListPagination"

response_graph:
  - function: "mapTeamMeetingResult"
    layer: "utility"
    responsibility: "Map team meetings to response DTO"
  - function: "sendTeamMeetingResponse"
    layer: "boundary"
    responsibility: "Return filtered team meetings"

shared_functions:
  - "mapTeamMeetingFilterQuery"
  - "mapTeamMeetingResult"
```

```yaml
use_case: "AI Assistant"
interaction: "US-23 User sends a care assistant chat message"

request_graph:
  - function: "postAssistantChatEndpoint"
    layer: "boundary"
    responsibility: "Receive authenticated assistant chat request"
  - function: "mapAssistantChatRequest"
    layer: "utility"
    responsibility: "Map chat payload and user context to an assistant command"
  - function: "handleAssistantChat"
    layer: "core"
    responsibility: "Generate a care assistant reply for the current conversation"

core:
  function: "handleAssistantChat"
  responsibility: "Generate a care assistant reply for the current conversation"
  delegates:
    - "detectPromptInjectionPatterns"
    - "retrieveAssistantContext"
    - "buildAssistantPrompt"
    - "generateAssistantReply"
    - "writeAssistantSecurityLogs"

response_graph:
  - function: "mapAssistantChatResult"
    layer: "utility"
    responsibility: "Map assistant result and diagnostics to a response DTO"
  - function: "sendAssistantChatResponse"
    layer: "boundary"
    responsibility: "Return assistant message, sources, and security details"

shared_functions:
  - "mapAssistantChatRequest"
  - "mapAssistantChatResult"
  - "detectPromptInjectionPatterns"
```

```yaml
use_case: "AI Assistant"
interaction: "US-24 User sees assistant sources"

request_graph:
  - function: "getAssistantSourcesEndpoint"
    layer: "boundary"
    responsibility: "Receive request for stored assistant answer sources"
  - function: "mapAssistantSourceRequest"
    layer: "utility"
    responsibility: "Map answer identifier to a source lookup command"
  - function: "getAssistantAnswerSources"
    layer: "core"
    responsibility: "Load the stored source set and security metadata for an assistant answer"

core:
  function: "getAssistantAnswerSources"
  responsibility: "Load the stored source set and security metadata for an assistant answer"
  delegates:
    - "loadAssistantAnswerEnvelope"
    - "filterVisibleAssistantSources"

response_graph:
  - function: "mapAssistantSourceResult"
    layer: "utility"
    responsibility: "Map stored sources to response DTO"
  - function: "sendAssistantSourceResponse"
    layer: "boundary"
    responsibility: "Return visible sources and diagnostics"

shared_functions:
  - "mapAssistantSourceRequest"
  - "mapAssistantSourceResult"
  - "filterVisibleAssistantSources"
```

```yaml
use_case: "AI Assistant"
interaction: "US-25 Admin sees permission mismatch flags"

request_graph:
  - function: "getAssistantRiskFlagsEndpoint"
    layer: "boundary"
    responsibility: "Receive assistant risk flag request"
  - function: "mapAssistantRiskFlagQuery"
    layer: "utility"
    responsibility: "Map filter query for risk events"
  - function: "listAssistantPermissionMismatchEvents"
    layer: "core"
    responsibility: "List assistant answers with permission mismatch"

core:
  function: "listAssistantPermissionMismatchEvents"
  responsibility: "List assistant answers with permission mismatch"
  delegates:
    - "validateAdminAccess"
    - "fetchAssistantMismatchEvents"
    - "applyAuditPagination"

response_graph:
  - function: "mapAssistantRiskFlagResult"
    layer: "utility"
    responsibility: "Map assistant mismatch events to response DTO"
  - function: "sendAssistantRiskFlagResponse"
    layer: "boundary"
    responsibility: "Return assistant mismatch events"

shared_functions:
  - "mapAssistantRiskFlagQuery"
  - "mapAssistantRiskFlagResult"
```

```yaml
use_case: "AI Assistant"
interaction: "US-26 Admin changes assistant lab mode"

request_graph:
  - function: "patchAssistantModeEndpoint"
    layer: "boundary"
    responsibility: "Receive assistant mode change request"
  - function: "mapAssistantModeUpdateRequest"
    layer: "utility"
    responsibility: "Validate requested SAFE or UNSAFE mode"
  - function: "setAssistantMode"
    layer: "core"
    responsibility: "Persist the requested assistant lab mode and audit the change"

core:
  function: "setAssistantMode"
  responsibility: "Persist the requested assistant lab mode and audit the change"
  delegates:
    - "writeAssistantModeSetting"
    - "writeAssistantModeChangeLog"

response_graph:
  - function: "mapAssistantModeUpdateResult"
    layer: "utility"
    responsibility: "Map updated mode to response DTO"
  - function: "sendAssistantModeUpdateResponse"
    layer: "boundary"
    responsibility: "Return updated assistant mode"

shared_functions:
  - "mapAssistantModeUpdateRequest"
  - "mapAssistantModeUpdateResult"
```

```yaml
use_case: "AI Assistant"
interaction: "US-26a Admin filters assistant security audit events"

request_graph:
  - function: "getAssistantAuditEventsEndpoint"
    layer: "boundary"
    responsibility: "Receive admin audit investigation request"
  - function: "mapAssistantAuditFilterRequest"
    layer: "utility"
    responsibility: "Map event, date range, actor, role, and text filters to audit criteria"
  - function: "listAssistantAuditEvents"
    layer: "core"
    responsibility: "Return filtered assistant-related audit events for investigation"

core:
  function: "listAssistantAuditEvents"
  responsibility: "Return filtered assistant-related audit events for investigation"
  delegates:
    - "queryAuditLogStore"
    - "parseAuditMetadata"
    - "buildAssistantDiagnostics"

response_graph:
  - function: "mapAssistantAuditListResult"
    layer: "utility"
    responsibility: "Map audit rows and assistant diagnostics to response DTOs"
  - function: "sendAssistantAuditListResponse"
    layer: "boundary"
    responsibility: "Return filtered assistant audit events"

shared_functions:
  - "mapAssistantAuditFilterRequest"
  - "mapAssistantAuditListResult"
  - "buildAssistantDiagnostics"
```

```yaml
use_case: "AI Assistant"
interaction: "US-26b Admin inspects assistant audit metadata"

request_graph:
  - function: "expandAssistantAuditEventRow"
    layer: "boundary"
    responsibility: "Receive UI intent to inspect a specific audit event"
  - function: "mapAssistantAuditInspection"
    layer: "utility"
    responsibility: "Prepare generic audit fields and assistant-specific diagnostics for display"
  - function: "inspectAssistantAuditEvent"
    layer: "core"
    responsibility: "Assemble full assistant audit event details for investigation"

core:
  function: "inspectAssistantAuditEvent"
  responsibility: "Assemble full assistant audit event details for investigation"
  delegates:
    - "separateGenericAuditFields"
    - "extractAssistantDiagnostics"
    - "formatStructuredMetadata"

response_graph:
  - function: "mapAssistantAuditInspectionResult"
    layer: "utility"
    responsibility: "Map full audit event details to expandable UI state"
  - function: "renderAssistantAuditInspection"
    layer: "boundary"
    responsibility: "Display generic audit data, assistant diagnostics, and raw structured metadata"

shared_functions:
  - "mapAssistantAuditInspection"
  - "mapAssistantAuditInspectionResult"
  - "extractAssistantDiagnostics"
```

```yaml
use_case: "Audit and Security"
interaction: "US-27 Admin views audit log"

request_graph:
  - function: "getAuditLogEndpoint"
    layer: "boundary"
    responsibility: "Receive audit log request"
  - function: "mapAuditLogQuery"
    layer: "utility"
    responsibility: "Map audit filters and paging query"
  - function: "listAuditEvents"
    layer: "core"
    responsibility: "List security-relevant audit events"

core:
  function: "listAuditEvents"
  responsibility: "List security-relevant audit events"
  delegates:
    - "validateAdminAccess"
    - "fetchAuditEventsByCriteria"
    - "applyAuditPagination"

response_graph:
  - function: "mapAuditLogResult"
    layer: "utility"
    responsibility: "Map audit events to response DTO"
  - function: "sendAuditLogResponse"
    layer: "boundary"
    responsibility: "Return audit event list"

shared_functions:
  - "mapAuditLogQuery"
  - "mapAuditLogResult"
```

```yaml
use_case: "Audit and Security"
interaction: "US-28 Admin views denied access events"

request_graph:
  - function: "getDeniedAccessEndpoint"
    layer: "boundary"
    responsibility: "Receive denied access event request"
  - function: "mapDeniedAccessQuery"
    layer: "utility"
    responsibility: "Map denied access filters"
  - function: "listDeniedAccessEvents"
    layer: "core"
    responsibility: "List access denied security events"

core:
  function: "listDeniedAccessEvents"
  responsibility: "List access denied security events"
  delegates:
    - "validateAdminAccess"
    - "fetchDeniedAccessEvents"
    - "applyAuditPagination"

response_graph:
  - function: "mapDeniedAccessResult"
    layer: "utility"
    responsibility: "Map denied access events to response DTO"
  - function: "sendDeniedAccessResponse"
    layer: "boundary"
    responsibility: "Return denied access event list"

shared_functions:
  - "mapDeniedAccessQuery"
  - "mapDeniedAccessResult"
```

```yaml
use_case: "Audit and Security"
interaction: "US-29 Admin changes user role"

request_graph:
  - function: "patchUserRoleEndpoint"
    layer: "boundary"
    responsibility: "Receive user role change request"
  - function: "mapUserRoleChangeRequest"
    layer: "utility"
    responsibility: "Map payload to role change command"
  - function: "changeUserRole"
    layer: "core"
    responsibility: "Change user role and enforce immediate policy refresh"

core:
  function: "changeUserRole"
  responsibility: "Change user role and enforce immediate policy refresh"
  delegates:
    - "validateUserRoleChange"
    - "persistUserRoleAssignment"
    - "writeUserRoleChangeAuditLog"

response_graph:
  - function: "mapUserRoleChangeResult"
    layer: "utility"
    responsibility: "Map updated user role to response DTO"
  - function: "sendUserRoleChangeResponse"
    layer: "boundary"
    responsibility: "Return updated user role"

shared_functions:
  - "mapUserRoleChangeRequest"
  - "mapUserRoleChangeResult"
```

```yaml
use_case: "Audit and Security"
interaction: "US-30 Admin toggles misconfigured demo mode"

request_graph:
  - function: "patchSecurityModeEndpoint"
    layer: "boundary"
    responsibility: "Receive security mode toggle request"
  - function: "mapSecurityModeRequest"
    layer: "utility"
    responsibility: "Map payload to security mode command"
  - function: "setSecurityConfigurationMode"
    layer: "core"
    responsibility: "Toggle secure or misconfigured authorization mode"

core:
  function: "setSecurityConfigurationMode"
  responsibility: "Toggle secure or misconfigured authorization mode"
  delegates:
    - "validateAdminAccess"
    - "persistSecurityConfigurationMode"
    - "writeSecurityModeAuditLog"

response_graph:
  - function: "mapSecurityModeResult"
    layer: "utility"
    responsibility: "Map security mode state to response DTO"
  - function: "sendSecurityModeResponse"
    layer: "boundary"
    responsibility: "Return active security mode"

shared_functions:
  - "mapSecurityModeRequest"
  - "mapSecurityModeResult"
```

---

```yaml
use_case: "Documents and Procedures"
interaction: "US-15a User downloads document file"

request_graph:
  - function: "getFileDownloadEndpoint"
    layer: "boundary"
    responsibility: "Receive GET request for document file download"
  - function: "extractDocumentIdFromPath"
    layer: "utility"
    responsibility: "Extract document ID from URL path parameter"
  - function: "downloadDocumentFile"
    layer: "core"
    responsibility: "Retrieve file for authenticated user with access control"

core:
  function: "downloadDocumentFile"
  responsibility: "Authorize user access to document and return file"
  delegates:
    - "findDocumentByIdWithAccess"
    - "validateFileExists"
    - "auditDocumentDownload"

response_graph:
  - function: "attachFileHeaders"
    layer: "utility"
    responsibility: "Set content disposition and type headers"
  - function: "sendFileContent"
    layer: "boundary"
    responsibility: "Stream file content to client"

shared_functions:
  - "findDocumentByIdWithAccess"
  - "auditDocumentDownload"
```

---

