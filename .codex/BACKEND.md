# BACKEND.md — Backend Architecture

## Framework

- **Express 4** (HTTP server)
- **Mongoose 8** (MongoDB ODM)
- **Socket.io 4** (real-time)
- **TypeScript 5**

## Entry Point

**File**: `backend/src/index.ts`

Startup sequence:
1. Validate environment variables
2. Connect to MongoDB
3. Create Express app with Helmet, CORS, JSON body parser (1mb limit)
4. Apply rate limiter (120 req/min on `/api`)
5. Mount routes at `/api`
6. Add error handlers (404 + 500)
7. Create HTTP server
8. Initialize Socket.io on path `/ws`
9. Listen on configured port (default 4000)

## Routes

**File**: `backend/src/routes/index.ts`

All routes are flat — no nested routers. Three controller modules:

| Controller | File | Handles |
|---|---|---|
| `incidentController` | `controllers/incidentController.ts` | Complaint CRUD, evidence, e-sign, submit, tracking |
| `officerController` | `controllers/officerController.ts` | Login, queue, case review, freeze, status, dossier |
| `miscController` | `controllers/miscController.ts` | Suspects, resources, volunteers, speech, translation, gov lookups |

## Services

| Service | File | Purpose |
|---|---|---|
| `aiService` | `services/aiService.ts` | Central AI orchestrator — OpenAI or heuristic fallback |
| `heuristicEngine` | `services/heuristicEngine.ts` | Regex/NLP extraction, category classification |
| `incidentService` | `services/incidentService.ts` | Status transitions, readiness computation, ACK generation, payload hashing |
| `evidenceService` | `services/evidenceService.ts` | File persistence, SHA-256 verification, EXIF scrubbing |
| `pdfService` | `services/pdfService.ts` | ACK PDF + dossier PDF + directory PDF generation |
| `bnsMapper` | `services/bnsMapper.ts` | Crime category → BNS section mapping |
| `readinessService` | `services/readinessService.ts` | Statutory readiness score computation |
| `suspectService` | `services/suspectService.ts` | Suspect search + normalization + report |
| `speechService` | `services/speechService.ts` | STT routing (OpenAI Whisper / external / browser-only) |
| `translationService` | `services/translationService.ts` | Bhashini or mock translation |
| `notificationService` | `services/notificationService.ts` | Socket.io broadcast helpers |

## Integrations (Simulated)

All in `backend/src/integrations/`:

| Integration | File | Simulates |
|---|---|---|
| CFCFRMS | `cfcfrms.ts` | Fund freeze requests, money trail tracing |
| e-Pramaan | `epramaan.ts` | Aadhaar-based identity + digital signing |
| CEIR | `ceir.ts` | IMEI blocking |
| Bhashini | `bhashini.ts` | Multilingual translation |
| TAFCOP | `tafcop.ts` | Mobile connection lookup |

Each integration returns `{ simulated: true }` in mock mode. Switchable via `*_MODE=production` env vars.

## Middleware

### officerAuth (`middleware/officerAuth.ts`)
- `signOfficerToken(payload)`: Creates JWT with 8-hour expiry
- `requireOfficer(req, res, next)`: Validates `Authorization: Bearer` header
- `errorHandler`: Global 500 error handler
- `notFoundHandler`: Global 404 handler

### upload (`middleware/upload.ts`)
- `upload`: Multer memory storage, max 10MB, 6 files, accepts images/PDFs/docs/text
- `uploadAudio`: Multer memory storage, audio/* only
- `uploadErrorHandler`: Friendly error responses for multer errors

## Validators

**File**: `backend/src/validators/index.ts`

Zod schemas for all request validation:
- `createIncidentSchema`: narrative (10-8000), category enum, language, anonymousMode
- `updateIncidentSchema`: All optional fields for PATCH
- `signChallengeSchema`: virtualId (12-24 chars)
- `signCompleteSchema`: challengeId + OTP (6 digits)
- `suspectSearchSchema`, `suspectReportSchema`, `volunteerSchema`

Validation errors return humanized messages with optional field-level details in dev mode.

## How a Complaint Moves Through Backend

1. **Create**: `POST /api/incidents` → `incidentController.createIncident` → `Incident.create()` → optional `runAiAnalysis()`
2. **Analyze**: `POST /api/incidents/:id/analyze` → `runAiAnalysis()` → AI/heuristic classification + extraction → save
3. **Update**: `PATCH /api/incidents/:id` → merge transaction, contact, category → `recomputeReadiness()` → save
4. **Evidence**: `POST /api/incidents/:id/evidence` → multer → scrub → hash verify → persist → save
5. **Sign**: `POST /api/incidents/:id/sign/complete` → `epramaan.verifyOtpAndSign()` → store signature → save
6. **Submit**: `POST /api/incidents/:id/submit` → `submitIncident()` → generate ACK → set golden hour → broadcast Socket.io
7. **IO Review**: `GET /api/officer/incidents/:id` → full incident data
8. **Freeze**: `POST /api/officer/incidents/:id/freeze` → `cfcfrmsRequestFreeze()` → update money trail → save
9. **Dossier**: `GET /api/officer/incidents/:id/dossier.pdf` → `renderDossier()` → PDF stream

## Database Connection

- URI: `MONGODB_URI` env var (default: `mongodb://localhost:27017/ncrp2`)
- Connected once at startup in `index.ts`
- Graceful shutdown on SIGINT/SIGTERM
