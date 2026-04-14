# Download Document File - Use Case Interaction Specification

```yaml
use_case: "Download document file"
interaction: "User downloads an uploaded document"

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

## Acceptance Criteria

- User can download an uploaded document file via authenticated HTTP GET endpoint
- Only users with access permission to the document can download it
- Downloaded file has correct MIME type and filename
- File download is audited for compliance
- Non-existent documents return 404
- Documents without files (metadata only) return 404
- Large files stream properly without memory issues
- Unauthorized access returns 403

## Authorization Rules

- **SupportAgent**: Can download documents in categories they have access to
- **Manager**: Can download all documents visible to their team
- **Clinician**: Can download clinical documents and related records
- **Admin**: Can download all documents
- **ExternalConsultant**: Can download documents specifically shared with them
