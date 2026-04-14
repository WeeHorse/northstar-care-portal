# Azure Blob Storage Integration Guide

## Overview

The Northstar Care Portal now supports both local file storage and Azure Blob Storage for document uploads. An environment-based switch allows automatic storage selection based on deployment context (local development vs. Azure AppService production).

## Architecture

### Storage Abstraction Layer

The system uses a pluggable storage abstraction with two implementations:

- **LocalFileStorage**: Stores files on the server's local filesystem (development)
- **AzureBlobStorage**: Stores files in Azure Blob Storage containers (production)

### File Paths

**Local Storage:**
```
Local filesystem → /home/site/uploads/ (Azure) or ./uploads/ (dev)
```

**Azure Blob Storage:**
```
Azure Storage Account → Blob Container → Blob names (generated filenames)
```

## Configuration

### Environment Variables

Control storage behavior with these environment variables:

```bash
# Storage type: "local" or "azure"
# Defaults to "local" unless running on Azure AppService
STORAGE_TYPE=local

# Azure Blob Storage connection (only needed if STORAGE_TYPE=azure)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...

# Azure Blob Storage container name (optional, defaults to "documents")
AZURE_STORAGE_CONTAINER_NAME=documents
```

### Automatic Detection

The system automatically detects Azure AppService environments:

```javascript
// Detected via these Azure-specific env vars:
- WEBSITE_SITE_NAME
- WEBSITE_INSTANCE_ID
- WEBSITE_RESOURCE_GROUP
```

**Default storage selection:**
- **Azure AppService + no STORAGE_TYPE**: Uses Azure Blob Storage (requires AZURE_STORAGE_CONNECTION_STRING)
- **Local dev + no STORAGE_TYPE**: Uses local filesystem
- **Explicit STORAGE_TYPE env var**: Always uses specified storage type

## AWS CloudFormation / Terraform Setup (Azure AppService)

### Enable Managed Identity (Recommended)

Instead of connection string, use Managed Identity:

```json
{
  "type": "Microsoft.Web/sites/config",
  "apiVersion": "2021-01-15",
  "name": "[concat(parameters('siteName'), '/identity')]",
  "properties": {
    "identity": {
      "type": "SystemAssigned"
    }
  }
}
```

### Grant Storage Access

Assign the Storage Blob Data Contributor role to AppService's managed identity in Azure Portal:

```
Storage Account → Access Control (IAM) → Add role assignment
Role: Storage Blob Data Contributor
Assign to: Your AppService's Managed Identity
```

## Development Setup

### Local Development (Default)

Files upload to `./uploads/` directory:

```bash
# Start backend with default local storage
npm run dev

# Backend logs will show:
# Document storage: local (local)
```

### Test Azure Locally

To test Azure Blob Storage code locally:

```bash
export STORAGE_TYPE=azure
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=..."
npm run dev
```

## Production Deployment (Azure AppService)

### Application Settings (Azure Portal)

Set in AppService → Settings → Configuration → Application settings:

```
STORAGE_TYPE = azure
AZURE_STORAGE_CONNECTION_STRING = <from Azure Portal>
AZURE_STORAGE_CONTAINER_NAME = documents (optional)
```

**Do NOT commit secrets to git.** Use Azure Key Vault instead:

```
@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/StorageConnectionString/)
```

### Startup Logs

AppService should log:

```
Document storage: azure (azure)
Northstar backend listening on port 3001
```

## API Behavior

The API behavior is identical regardless of storage backend:

```javascript
// Upload endpoint returns same DTO regardless of storage type
POST /api/documents/upload → { id, fileName, downloadLink, ... }

// Download endpoint streams files the same way
GET /api/documents/{id}/download → File download (local stream vs Azure stream)

// Search indexes filename in all cases
GET /api/documents/search?fileName=*.pdf
```

## Error Handling

### Common Errors

**"Azure Storage connection string is required"**
- Cause: `STORAGE_TYPE=azure` but `AZURE_STORAGE_CONNECTION_STRING` not set
- Fix: Add connection string to environment or switch to `STORAGE_TYPE=local`

**"ContainerNotFound"**
- Cause: Azure container doesn't exist and app lacks create permissions
- Fix: Pre-create container in Azure Portal OR grant container creation permissions

**"File not found in storage"**
- Cause: File uploaded but storage backend changed/lost
- Fix: Ensure storage settings match where original file was uploaded

## File Metadata Storage

Both backends store identical metadata in SQLite:

```sql
-- Stored in documents table
storage_path: "filename-uuid.pdf" (Azure) or "/full/path.pdf" (local)
file_name: "original-name.pdf"
file_mime_type: "application/pdf"
file_size_bytes: 1024
```

The `storage_path` is the key for retrieving files:
- **Local**: Full filesystem path
- **Azure**: Blob name in container

## Testing

### Unit Tests

All storage operations use mocks - tests don't depend on backend:

```bash
npm test # Uses mock storage for all tests
```

### API Tests (Local vs Azure)

Tests auto-detect and use local storage:

```bash
npm run test:api # Uses LocalFileStorage by default
```

To test with Azure locally:

```bash
STORAGE_TYPE=azure \
AZURE_STORAGE_CONNECTION_STRING="..." \
npm run test:api
```

## Switching Storage After Deployment

### From Local → Azure

1. **Set environment variables** on AppService
2. **Upload any existing files** from local uploads/ to Azure container
3. **Update storage_path** in database:
   ```sql
   UPDATE documents 
   SET storage_path = SUBSTR(storage_path, INSTR(storage_path, '/') + 1)
   WHERE storage_path LIKE '/%'
   ```
4. **Restart AppService**

### From Azure → Local

1. **Download all blobs** from Azure container
2. **Place in local uploads/** directory with same names
3. **Set STORAGE_TYPE=local** in environment
4. **Update storage_path** in database to full local paths:
   ```sql
   UPDATE documents 
   SET storage_path = '/path/to/uploads/' || storage_path
   WHERE NOT storage_path LIKE '/%'
   ```
5. **Restart AppService**

## Performance Considerations

### Local Storage
- ✅ Fast for dev/test
- ✅ No network latency
- ❌ Lost if container is recreated
- ❌ Not scalable for multi-instance deployments

### Azure Blob Storage
- ✅ Scalable: Works with multiple AppService instances
- ✅ Persistent: Separate from application lifecycle
- ✅ Geo-redundant options available
- ❌ Network latency (usually <100ms)
- ❌ Requires Azure Storage costs

## Monitoring

### Azure Portal

Monitor storage usage:
```
Storage Account → Metrics → Blob count, Total size
```

### Application Logs

Track storage operations via audit table:

```sql
-- All document operations are audited
SELECT * FROM audit_logs 
WHERE entity_type = 'document' 
AND event_type IN ('document_upload', 'document_download')
ORDER BY created_at DESC
```

## Security

### Access Control

- **Local**: Filesystem permissions on uploads/ directory
- **Azure**: Role-based access via Azure RBAC
  - SAS tokens NOT generated (full container access only)
  - Managed Identity recommended over connection strings

### Encryption

- **Local**: Filesystem-level encryption (BitLocker, FileVault, etc.)
- **Azure**: Storage account encryption at rest (enabled by default)

### Data Retention

Set Azure lifecycle policies to auto-delete old files:

```json
{
  "rules": [
    {
      "name": "DeleteOldDocuments",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "delete": {
              "daysAfterModificationGreaterThan": 365
            }
          }
        }
      }
    }
  ]
}
```

## Troubleshooting

### Upload Fails with "Failed to save file"

```javascript
// Check logs for actual error:
// 1. Local: Filesystem permissions on uploads/
// 2. Azure: Connection string validity, container permissions

// Test connection:
node -e "
const { BlobServiceClient } = require('@azure/storage-blob');
const client = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
client.listContainers().byPage().next().then(p => console.log('✓ Connected'));
"
```

### Download Returns Empty File

```javascript
// Check file size is stored correctly:
SELECT id, file_name, file_size_bytes, storage_path 
FROM documents WHERE id = ?

// If file_size_bytes is NULL:
// - File may be corrupted during upload
// - Try re-uploading the document
```

## Future Enhancements

- [ ] AWS S3 storage backend
- [ ] Google Cloud Storage backend
- [ ] Automatic migration tool between backends
- [ ] File versioning support
- [ ] Signed URLs for external sharing
