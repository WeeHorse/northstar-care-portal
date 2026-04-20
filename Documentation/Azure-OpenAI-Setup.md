# Azure OpenAI Setup Guide

## Overview

The Care Assistant can run in two modes at runtime:

- local mock mode when Azure OpenAI variables are not configured
- live Azure OpenAI mode when the backend receives Azure OpenAI configuration

This project now supports both local `.env` loading and Azure-hosted configuration.

## Required Settings

The backend reads these variables for Azure OpenAI Responses API:

```bash
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=gpt-5.4-mini
AZURE_OPENAI_API_VERSION=2025-04-01-preview
```

Notes:

- `AZURE_OPENAI_ENDPOINT` should be the resource base URL, not the full `/openai/responses` URL
- `AZURE_OPENAI_DEPLOYMENT` is the Azure deployment name
- this backend calls `POST /openai/v1/responses`

## Local Development

The backend now loads `.env` automatically from the Backend workspace folder through `dotenv`.

Recommended local flow:

1. Use the example variables in `Backend/.env.example`
2. Create `Backend/.env`
3. Put your rotated Azure OpenAI key in `AZURE_OPENAI_API_KEY`
4. Start the backend with `npm run dev`

If the Azure variables are missing, the assistant falls back to the local mock generator.

## Azure App Service Configuration

For hosted deployment, set the same values in Azure App Service:

1. Open your App Service
2. Go to Settings
3. Open Environment variables or Configuration
4. Add these application settings:

```text
AZURE_OPENAI_ENDPOINT = https://your-resource.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY = <secret>
AZURE_OPENAI_DEPLOYMENT = gpt-5.4-mini
AZURE_OPENAI_API_VERSION = 2025-04-01-preview
```

Restart the App Service after updating settings.

## Azure Key Vault Integration

Do not keep production secrets directly in source control or long-lived portal text fields when you can avoid it.

Recommended production approach:

1. Create or open an Azure Key Vault
2. Add a secret for the OpenAI API key
3. Enable a system-assigned managed identity on the App Service
4. Grant that identity `Key Vault Secrets User` on the vault
5. Reference the secret from App Service configuration

Example App Service setting value:

```text
AZURE_OPENAI_API_KEY = @Microsoft.KeyVault(SecretUri=https://your-vault.vault.azure.net/secrets/AzureOpenAiApiKey/)
```

You can use the same pattern for other secrets such as:

- `AZURE_STORAGE_CONNECTION_STRING`
- `APPLICATIONINSIGHTS_CONNECTION_STRING`
- `JWT_SECRET`

## Recommended Azure Deployment Pattern

For this project, a practical hosted setup is:

- Azure App Service for the backend
- Azure OpenAI for assistant generation
- Azure Blob Storage for document storage
- Azure Key Vault for secrets
- Application Insights for backend telemetry

This keeps the local development path simple while giving the hosted version proper secret handling.

## Verification Checklist

After deployment, verify these steps:

1. Backend starts without configuration errors
2. `GET /health` responds successfully
3. Assistant chat returns a normal answer instead of the local mock wording
4. Prompt-blocking behavior still works in SAFE mode
5. Audit logs still capture assistant events

## Common Failures

### 401 or 403 from Azure OpenAI

- API key is invalid
- wrong resource endpoint
- stale key after rotation

### 404 from Azure OpenAI

- `AZURE_OPENAI_DEPLOYMENT` does not match the deployment name in Azure

### Assistant still behaves like local mock

- one or more Azure OpenAI variables are missing
- App Service was not restarted after configuration changes
- local terminal only exported one variable instead of the full set