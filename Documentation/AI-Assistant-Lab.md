# AI Assistant Lab

## Overview

The Care Assistant is a small teaching-oriented chat feature for treatment and medication guidance.

It is designed to demonstrate four states in one code path:

- vulnerable retrieval and disclosure in UNSAFE mode
- prompt injection detection and refusal in SAFE mode
- role-aware filtering for patient-safe guidance
- structured audit evidence for later investigation

The assistant is framed as:

"A digital treatment and medication guidance assistant that helps users find relevant information about treatment, medication routines, self-care, and when to contact healthcare staff, but does not replace professional medical judgment."

## Backend shape

- `Backend/server/services/assistantService.js`: orchestrates assistant chat, retrieval, mode handling, conversation state, and audit events
- `Backend/server/services/retrievalService.js`: keyword retrieval, simple source ranking, and PATIENT/INTERNAL classification
- `Backend/server/services/promptSafetyService.js`: suspicious prompt heuristics and SAFE-mode blocking decisions
- `Backend/server/services/llmService.js`: Azure OpenAI Responses API integration with local mock fallback when Azure env vars are not configured
- `Backend/server/index.js`: loads local `.env` configuration before runtime settings are resolved

## Modes

### SAFE mode

- default mode
- filters INTERNAL content for non-privileged users
- flags suspicious prompt injection patterns
- blocks direct attempts to reveal hidden instructions or internal-only guidance
- returns refusal wording instead of hidden content

### UNSAFE mode

- intentionally broad for the lab
- may include INTERNAL content for non-privileged users
- still logs suspicious prompts
- may reveal internal titles and excerpts so students can observe leakage and then investigate logs

## Role handling

This implementation maps existing Northstar roles into two assistant-access groups:

- privileged assistant roles: `Admin`, `Manager`, `Clinician`
- non-privileged assistant roles: `SupportAgent`, `ExternalConsultant`

That mapping is specific to the assistant lab and does not rewrite the rest of the application RBAC model.

## Audit events

The assistant writes structured events to the existing audit log using these event types:

- `assistant_query`
- `assistant_retrieval`
- `assistant_prompt_injection_flag`
- `assistant_permission_mismatch`
- `assistant_response_blocked`
- `assistant_mode_changed`

Useful metadata includes mode, question, suspicious patterns, source counts, internal source counts, mismatch counts, and a conversation session ID.

## API surface

- `POST /api/assistant/chat`: send a chat message
- `POST /api/assistant/ask`: compatibility alias for chat requests
- `GET /api/assistant/sources/:answerId`: fetch stored answer source diagnostics
- `GET /api/assistant/settings/mode`: read current assistant mode
- `PATCH /api/assistant/settings/mode`: admin-only SAFE/UNSAFE mode change
- `GET /api/assistant/mismatches`: admin-only mismatch audit view

Legacy role-aware endpoints are still available as compatibility aliases.

## Frontend behavior

The Assistant page now shows:

- current mode badge
- UNSAFE warning banner
- chat-style message thread
- source list per assistant response
- security detail panel with suspicious prompt and mismatch counts

The Admin page now exposes the assistant lab mode directly as SAFE or UNSAFE.

## Seeded lab content

Additional seeded records were added so retrieval has realistic material for the lab:

- patient guidance documents for medication routines and self-care
- internal procedures for escalation workflow and injection-defense notes

## Test coverage

Assistant-specific tests cover:

- backend unit behavior for SAFE blocking, UNSAFE mismatch leakage, and mode changes
- backend API behavior for chat, mode reads, mode updates, and stored source lookup
- backend end-to-end login and assistant flows
- frontend API client, page-level rendering, and end-to-end assistant UI flow

## How to connect this to Azure OpenAI and Azure Monitor later

- Azure OpenAI text generation is now wired through `Backend/server/services/llmService.js` using the Responses API when these environment variables are configured:
	- `AZURE_OPENAI_ENDPOINT`
	- `AZURE_OPENAI_API_KEY`
	- `AZURE_OPENAI_DEPLOYMENT`
	- `AZURE_OPENAI_API_VERSION`
- Local development can provide those values through `Backend/.env` because the backend now loads `dotenv` at startup.
- Keep prompt assembly in `assistantService.js` so the Azure integration still remains one backend boundary.
- Preserve the retrieval result shape from `retrievalService.js` if Azure AI Search or embeddings are introduced later.
- Forward assistant security metadata to Application Insights or Azure Monitor alongside the existing logger output.
- For Azure App Service, store the Azure OpenAI settings in Application Settings or Key Vault references rather than source-controlled files.