# API_CONTRACTS.md — API Endpoint Reference

All routes defined in `backend/src/routes/index.ts`, mounted at `/api`.

Base URL: `http://localhost:4000/api`

Error format: `{ error: { code: string, message: string, fields?: Array<{field, message}> } }`

---

## Citizen: Complaint Lifecycle

### POST /api/incidents
**Purpose**: Create a new complaint draft
**Auth**: None
**Request**:
```json
{
  "narrative": "string (10-8000 chars, required)",
  "category": "financial_fraud | harassment_extortion | women_child_safety | other_cyber_crime (optional)",
  "language": "en (default)",
  "anonymousMode": false
}
```
**Response (201)**:
```json
{
  "incident": {
    "id": "...",
    "acknowledgementNumber": null,
    "incident_category": "financial_fraud",
    "categoryConfidence": 0.92,
    "categorySource": "ai",
    "narrative_raw": "...",
    "narrative_summary": "...",
    "financial_transactions": [...],
    "suspect_identifiers": [...],
    "bns_sections_mapped": [...],
    "statutory_readiness_score": 45,
    "readiness_breakdown": [...],
    "evidenceCount": 0,
    "anonymousMode": false,
    "signature_status": "pending",
    "status": "draft"
  }
}
```

### GET /api/incidents/:id
**Purpose**: Get complaint details
**Auth**: None
**Response**: `{ incident: { ...full incident data } }`

### PATCH /api/incidents/:id
**Purpose**: Update complaint (transaction, contact, category, etc.)
**Auth**: None
**Request**:
```json
{
  "narrative": "optional",
  "category": "optional",
  "categoryConfirmedByCitizen": true,
  "anonymousMode": false,
  "transaction": {
    "utr": "421598761234",
    "amount": 35000,
    "timestamp": "ISO string",
    "senderBank": "HDFC Bank",
    "beneficiaryVpa": "scammer@okaxis",
    "method": "UPI"
  },
  "suspectIdentifiers": [
    { "type": "phone", "value": "+91-98765-43210", "context": "caller's number" }
  ],
  "citizenContact": {
    "fullName": "Demo Citizen",
    "phone": "+91-90000-00001",
    "email": "",
    "state": "Delhi",
    "district": "New Delhi"
  }
}
```
**Important**: Transaction merge logic:
- If citizen-source transaction exists → merge into it
- Else if AI-source transaction exists → merge into it
- Else → create new transaction

### POST /api/incidents/:id/analyze
**Purpose**: Trigger AI classification + extraction
**Auth**: None
**Response**: `{ incident: {...}, aiNotice: "..." }`

### POST /api/incidents/:id/evidence
**Purpose**: Upload evidence files
**Auth**: None
**Content-Type**: `multipart/form-data`
**Fields**: `files` (max 6), `sha256` (client hash, optional), `smsText` (optional)
**Response (201)**:
```json
{
  "evidence": [ { "evidenceId", "originalName", "sha256", "hashVerifiedServer", ... } ],
  "transactions": [ {...} ],
  "readinessScore": 65,
  "readinessBreakdown": [...]
}
```

### POST /api/incidents/:id/evidence/:evidenceId/vision
**Purpose**: AI vision extraction from evidence image
**Auth**: None
**Response**:
```json
{
  "extraction": { "utr": "...", "amount": 35000, "senderBank": "...", "beneficiaryVpa": "..." },
  "available": true,
  "reason": null,
  "notice": "We found these details..."
}
```

### POST /api/incidents/:id/sign/challenge
**Purpose**: Initiate e-Sign challenge
**Auth**: None
**Request**: `{ "virtualId": "12-24 chars (required)" }`
**Response**: `{ "challengeId": "...", "expiresIn": 300, "demo": true }`

### POST /api/incidents/:id/sign/complete
**Purpose**: Complete e-Sign with OTP
**Auth**: None
**Request**: `{ "challengeId": "...", "otp": "6-digit string (required)" }`
**Response**: `{ "signatureStatus": "signed", "signedHash": "...", "demo": true }`
**Error (401)**: `{ error: { code: "OTP_INVALID", message: "..." } }`

### POST /api/incidents/:id/submit
**Purpose**: Submit complaint and generate ACK
**Auth**: None
**Response**:
```json
{
  "acknowledgementNumber": "NCRP-2026-A1B2C3",
  "submittedAt": "ISO date",
  "category": "financial_fraud",
  "goldenHourActive": true
}
```
**Error (422)**: `ANONYMOUS_NOT_ALLOWED` or `CONTACT_REQUIRED`

### GET /api/incidents/:id/acknowledgement.pdf
**Purpose**: Download ACK PDF
**Auth**: None
**Response**: PDF binary stream (`Content-Type: application/pdf`)

---

## Citizen: Tracking

### GET /api/complaints/track/:ackNumber
**Purpose**: Track complaint status
**Auth**: None
**Response**:
```json
{
  "complaint": {
    "acknowledgementNumber": "NCRP-2026-A1B2C3",
    "category": "financial_fraud",
    "status": "submitted",
    "statusHistory": [...],
    "flow": ["draft", "submitted", "verified", ...],
    "submittedAt": "ISO date",
    "lastUpdate": "ISO date",
    "goldenHourActive": true,
    "evidenceCount": 1,
    "anonymousMode": false
  }
}
```

---

## Suspect Repository

### POST /api/suspects/search
**Purpose**: Search suspect by identifier
**Request**: `{ "identifier": "phone / UPI / URL / email" }`
**Response**:
```json
{
  "results": [
    {
      "identifier": "+91-98765-43210",
      "normalizedIdentifier": "+919876543210",
      "type": "phone",
      "reportCount": 47,
      "categories": ["financial_fraud"],
      "status": "flagged",
      "recentActivity": [...]
    }
  ],
  "queryType": "phone",
  "notice": "Synthetic demonstration data..."
}
```

### POST /api/suspects/report
**Purpose**: Report a new suspect
**Request**: `{ "identifier": "...", "category": "optional", "note": "optional" }`
**Response (201)**: `{ "reported": true, "suspect": {...}, "message": "..." }`

### GET /api/suspects/stats
**Response**: `{ "totalTracked": 5, "activeFlagged": 3 }`

---

## Speech & Translation

### POST /api/speech/transcribe
**Purpose**: Audio → text
**Content-Type**: `multipart/form-data`
**Fields**: `audio` (audio/* file, required), `language` (default "hi")
**Response**: `{ "text": "...", "language": "hi" }`
**Error (501)**: `{ error: { code: "SPEECH_UNAVAILABLE", message: "..." } }`

### POST /api/translation/translate
**Request**: `{ "text": "...", "sourceLanguage": "hi", "targetLanguage": "en" }`
**Response**: `{ "translated": "...", "sourceLanguage": "hi", "targetLanguage": "en" }`

### GET /api/languages
**Response**: `{ "languages": [...], "uiLocalesAvailable": ["en", "hi", ...] }`

---

## Content

### GET /api/resources
**Response**: `{ "resources": [ { slug, title, category, scamType, trending, body, ... } ] }`

### GET /api/scam-alerts
**Response**: `{ "alerts": [ { title, severity, region, summary, ... } ] }`

### POST /api/volunteers
**Request**: `{ "fullName", "email", "phone?", "state", "languages": [], "interests": [] }`
**Response (201)**: `{ "ok": true, "message": "Application received..." }`

---

## Government Lookups (Simulated)

### POST /api/gov/tafcop-lookup
**Request**: `{ "phone": "+91..." }`
**Response**: Mock connection data or error

### POST /api/gov/ceir-block
**Request**: `{ "imei": "..." }`
**Response**: Mock block confirmation

---

## Officer (JWT Required)

### POST /api/officer/login
**Request**: `{ "email": "io@ncrp.demo", "password": "JaiHind2026" }`
**Response**: `{ "token": "JWT...", "officer": { "email", "name", "rank", "unit" } }`
**Error (401)**: `{ error: { code: "BAD_CREDENTIALS", message: "..." } }`

### GET /api/officer/queue
**Auth**: `Authorization: Bearer <token>`
**Response**: `{ "queue": [ { id, acknowledgementNumber, category, status, amount, utr, suspects, evidenceCount, goldenHourActive, ... } ] }`

### GET /api/officer/incidents/:id
**Auth**: JWT
**Response**: `{ incident: {...full incident} }`

### POST /api/officer/incidents/:id/freeze
**Auth**: JWT
**Response**: `{ freeze: {...}, goldenHour: {...}, moneyTrail: {...} }`

### POST /api/officer/incidents/:id/status
**Auth**: JWT
**Request**: `{ "status": "verified", "note": "optional" }`
**Allowed statuses**: `verified`, `assigned`, `investigation`, `fir_registered`, `closed`

### GET /api/officer/incidents/:id/dossier.pdf
**Auth**: JWT
**Response**: PDF binary stream

### GET /api/officer/incidents/:id/evidence/:evidenceId/file
**Auth**: JWT
**Response**: Evidence file binary stream with original MIME type

---

## Misc

### GET /api/directory.pdf
**Response**: PDF binary stream (officer directory, landscape A4)

### GET /api/mockdata/test-evidence
**Response**: PNG binary stream (`telegram_job_scam.png`)

### GET /healthz
**Response**: `{ "ok": true, "service": "ncrp2-api", "ts": "..." }`
