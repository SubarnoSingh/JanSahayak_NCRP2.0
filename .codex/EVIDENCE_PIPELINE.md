# EVIDENCE_PIPELINE.md — Evidence Flow

This is a critical data flow document. Evidence integrity and UTR propagation are the most sensitive parts of the system.

## Complete Evidence Pipeline

```
CITIZEN UPLOADS FILE (browser)
    │
    ├─► Client-side SHA-256 computed via Web Crypto API
    │   File: frontend/src/lib/hash.ts → computeFileHash()
    │
    ├─► Hash shown to user in UI
    │
    ▼
POST /api/incidents/:id/evidence
    │
    ├─► Multer receives file (memory storage, max 10MB)
    │   File: backend/src/middleware/upload.ts
    │
    ├─► EXIF/GPS metadata scrubbed (JPEG APP1 segments, PNG tEXt chunks)
    │   File: backend/src/services/evidenceService.ts → scrubImageMetadata()
    │
    ├─► Server re-computes SHA-256 of received buffer
    │   File: backend/src/services/evidenceService.ts → sha256Buffer()
    │
    ├─► Compare server hash with client hash
    │   File: backend/src/services/evidenceService.ts → evidenceHashOk()
    │   If mismatch → 409 HASH_MISMATCH error
    │
    ├─► File persisted to disk: uploads/{incidentId}-{timestamp}-{random}{ext}
    │   File: backend/src/services/evidenceService.ts → persistEvidence()
    │
    ├─► Evidence metadata stored on Incident document:
    │   { evidenceId, originalName, storedName, mimeType, sizeBytes, sha256,
    │     hashVerifiedServer, exifScrubbed, uploadedAt }
    │
    ├─► If text file: parseTransactionSms() extracts UTR/amount/VPA
    │   File: backend/src/services/heuristicEngine.ts
    │
    ├─► Readiness score recomputed
    │   File: backend/src/services/readinessService.ts
    │
    ├─► Audit trail entry added
    │
    ▼
DATABASE (incident.evidence[], incident.financial_transactions[])
    │
    ├─► Evidence metadata available to:
    │   - Citizen: complaint review step
    │   - IO: case review in /hq
    │   - Dossier PDF: evidence register section
    │
    ▼
IO DESK / DOSSIER PDF
    - Evidence images served via GET /api/officer/incidents/:id/evidence/:eid/file
    - Evidence hashes displayed in case review
    - Images embedded in dossier PDF (for image types)
    - Extracted data shown if aiExtraction exists
```

## UTR/RRN Propagation (CRITICAL)

UTR extraction happens at multiple points. The canonical source of truth is `incident.financial_transactions[]`.

```
EXTRACTION SOURCES:
    │
    ├─► AI text analysis (step 01)
    │   heuristicEngine.extractStructuredHeuristic() → 12-digit pattern
    │   Source field: "ai_text"
    │
    ├─► AI vision extraction (step 02)
    │   aiService.extractFromImage() → reads screenshot
    │   Source field: "ai_vision"
    │   Stored on: evidence.aiExtraction
    │
    ├─► SMS text file upload
    │   heuristicEngine.parseTransactionSms() → regex extraction
    │   Source field: "sms_parse"
    │
    ├─► Citizen manual entry (step 02)
    │   Source field: "citizen"
    │
    ▼
PERSISTENCE (PATCH /api/incidents/:id with transaction field):
    │
    ├─► Backend merge logic in incidentController.updateIncident:
    │   1. If citizen-source transaction exists → merge into it
    │   2. Else if AI-source transaction exists → merge into it
    │   3. Else → create new transaction
    │
    ├─► This ensures citizen overrides take priority
    │
    ▼
CANONICAL STATE: incident.financial_transactions[]
    │
    ├─► Used by:
    │   - Readiness score computation
    │   - Dossier PDF (financial details section)
    │   - IO case review display
    │   - CFCFRMS freeze request (first transaction)
    │   - Money trail visualization
    │
    ▼
CRITICAL RULE:
    Extracted data MUST be persisted to incident.financial_transactions[]
    BEFORE navigating to the next step. Never keep it only in React state.
```

## Vision Extraction Flow

```
POST /api/incidents/:id/evidence/:evidenceId/vision
    │
    ├─► Read image from disk
    ├─► Convert to base64
    ├─► Call aiService.extractFromImage() → OpenAI GPT-4o-mini vision
    ├─► Result stored on evidence.aiExtraction
    ├─► Saved to database
    │
    ▼
Response: { extraction: { utr, amount, senderBank, beneficiaryVpa, timestamp } }
    │
    ├─► Frontend displays extracted fields
    ├─► Citizen can accept or override
    ├─► On acceptance: PATCH /api/incidents/:id with transaction field
    │
    ▼
If no OpenAI key: returns { available: false, reason: "..." }
    → Citizen enters details manually
    → Complaint is equally valid without vision extraction
```

## Allowed File Types

From `evidenceService.ts` → `mimeAllowed()`:
- image/png, image/jpeg, image/webp
- application/pdf
- text/plain, text/csv
- application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
- message/rfc822, application/vnd.ms-outlook
- application/json

From `upload.ts` → `ALLOWED_EXT`:
- .png, .jpg, .jpeg, .webp, .pdf, .txt, .csv, .doc, .docx, .eml, .msg, .json

## Storage Location

Files stored in: `{process.cwd()}/{UPLOAD_DIR}/` (default: `uploads/`)
Naming: `{incidentId}-{timestamp}-{randomHex}{ext}`
