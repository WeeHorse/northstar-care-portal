# Use Case Interactions - Azure Blob Storage Integration

## Use Case: Upload Document with Configurable Storage Backend

### Interaction: Upload Document (Local Filesystem)

```yaml
use_case: "Upload document to local filesystem"
interaction: "User uploads a medical document to local storage"

request_graph:
  - function: "postDocumentUploadEndpoint"
    layer: "boundary"
    responsibility: "Receive multipart/form-data request with file and metadata"
  - function: "parseUploadMiddleware"
    layer: "utility"
    responsibility: "Validate file size, MIME type constraints"
  - function: "persistUploadMiddleware"
    layer: "utility"
    responsibility: "Save file buffer to storage backend (local)"
  - function: "uploadController"
    layer: "core"
    responsibility: "Process and persist document metadata and file reference"

core:
  function: "uploadController"
  responsibility: "Handle document upload and create metadata record"
  delegates:
    - "parseUploadMiddleware"
    - "persistUploadMiddleware"
    - "documentsService.createDocument"

response_graph:
  - function: "mapUploadResult"
    layer: "utility"
    responsibility: "Map created document to upload response DTO"
  - function: "sendUploadResponse"
    layer: "boundary"
    responsibility: "Return HTTP 201 with document metadata and download link"

shared_functions:
  - "parseUploadMiddleware"
  - "persistUploadMiddleware"
  - "mapUploadResult"
```

### Interaction: Upload Document (Azure Blob Storage)

```yaml
use_case: "Upload document to Azure Blob Storage"
interaction: "User uploads a medical document to Azure blob container"

request_graph:
  - function: "postDocumentUploadEndpoint"
    layer: "boundary"
    responsibility: "Receive multipart/form-data request with file and metadata"
  - function: "parseUploadMiddleware"
    layer: "utility"
    responsibility: "Validate file size, MIME type constraints"
  - function: "persistUploadMiddlewareAzure"
    layer: "utility"
    responsibility: "Upload file buffer to Azure Blob Storage container"
  - function: "uploadController"
    layer: "core"
    responsibility: "Process and persist document metadata with Azure blob reference"

core:
  function: "uploadController"
  responsibility: "Handle document upload to storage backend (abstracted)"
  delegates:
    - "parseUploadMiddleware"
    - "persistUploadMiddlewareAzure"
    - "documentsService.createDocument"

response_graph:
  - function: "mapUploadResult"
    layer: "utility"
    responsibility: "Map created document to upload response DTO"
  - function: "sendUploadResponse"
    layer: "boundary"
    responsibility: "Return HTTP 201 with document metadata and download link"

shared_functions:
  - "parseUploadMiddleware"
  - "persistUploadMiddlewareAzure"
  - "mapUploadResult"
```

## Use Case: Download Document with Configurable Storage Backend

### Interaction: Download Document (Local Filesystem)

```yaml
use_case: "Download document from local filesystem"
interaction: "User downloads a medical document from local storage"

request_graph:
  - function: "getDocumentDownloadEndpoint"
    layer: "boundary"
    responsibility: "Receive authenticated GET request for document ID"
  - function: "validateDocumentAccess"
    layer: "utility"
    responsibility: "Check RBAC permissions against document_permissions table"
  - function: "downloadController"
    layer: "core"
    responsibility: "Retrieve document and prepare for streaming"

core:
  function: "downloadController"
  responsibility: "Stream document file to client"
  delegates:
    - "validateDocumentAccess"
    - "documentsService.downloadDocument"
    - "localFileStorage.createReadStream"

response_graph:
  - function: "setDownloadHeaders"
    layer: "utility"
    responsibility: "Set Content-Type, Content-Disposition, Content-Length headers"
  - function: "streamFileToClient"
    layer: "boundary"
    responsibility: "Pipe file stream to HTTP response"

shared_functions:
  - "validateDocumentAccess"
  - "setDownloadHeaders"
```

### Interaction: Download Document (Azure Blob Storage)

```yaml
use_case: "Download document from Azure Blob Storage"
interaction: "User downloads a medical document from Azure blob"

request_graph:
  - function: "getDocumentDownloadEndpoint"
    layer: "boundary"
    responsibility: "Receive authenticated GET request for document ID"
  - function: "validateDocumentAccess"
    layer: "utility"
    responsibility: "Check RBAC permissions against document_permissions table"
  - function: "downloadController"
    layer: "core"
    responsibility: "Retrieve document reference and prepare for streaming"

core:
  function: "downloadController"
  responsibility: "Stream Azure blob to client"
  delegates:
    - "validateDocumentAccess"
    - "documentsService.downloadDocument"
    - "azureBlobStorage.createReadStream"

response_graph:
  - function: "setDownloadHeaders"
    layer: "utility"
    responsibility: "Set Content-Type, Content-Disposition, Content-Length headers"
  - function: "streamBlobToClient"
    layer: "boundary"
    responsibility: "Pipe Azure blob stream to HTTP response"

shared_functions:
  - "validateDocumentAccess"
  - "setDownloadHeaders"
```

## Use Case: Store Configuration Detection

### Interaction: Auto-detect Storage Type on Startup

```yaml
use_case: "Detect and initialize correct storage backend"
interaction: "Application starts and determines storage backend from environment"

request_graph:
  - function: "loadEnvironmentVariables"
    layer: "utility"
    responsibility: "Read STORAGE_TYPE, AZURE_* env vars"
  - function: "detectAzureAppService"
    layer: "utility"
    responsibility: "Check for Azure AppService environment indicators"
  - function: "initializeStorage"
    layer: "core"
    responsibility: "Create appropriate storage client"

core:
  function: "initializeStorage"
  responsibility: "Instantiate and configure storage backend"
  delegates:
    - "loadEnvironmentVariables"
    - "detectAzureAppService"
    - "createStorageClient"

response_graph:
  - function: "validateStorageConnection"
    layer: "utility"
    responsibility: "Test storage connectivity (ensure bucket/container exists)"
  - function: "logStorageConfiguration"
    layer: "boundary"
    responsibility: "Log storage type and configuration to console"

shared_functions:
  - "loadEnvironmentVariables"
  - "detectAzureAppService"
  - "createStorageClient"
  - "logStorageConfiguration"
```

## Storage Abstraction Architecture

```
Request → Route → Controller → Service → Storage Abstraction → Backend
                                           ├── LocalFileStorage
                                           └── AzureBlobStorage
```

### Key Abstraction Methods

All storage implementations provide:

```javascript
class StorageBackend {
  // Save file to storage
  async saveFile(fileName, buffer): { path, fileName }
  
  // Check if file exists
  async fileExists(filePath): boolean
  
  // Get file size
  async getFileSize(filePath): number
  
  // Create readable stream for download
  async createReadStream(filePath): ReadableStream
  
  // Delete file from storage
  async deleteFile(filePath): void
  
  // Get storage type identifier
  getStorageType(): "local" | "azure"
}
```

### Configuration via Environment

```javascript
// runtimePaths.js resolves all storage configuration
resolveRuntimePaths(env) => {
  storageType: "local" | "azure",      // Determined by env or auto-detect
  uploadRoot: string,                  // For local storage
  azureConnectionString: string,       // For Azure
  azureContainerName: string,          // For Azure
  isAzureAppService: boolean           // Detection flag
}
```
