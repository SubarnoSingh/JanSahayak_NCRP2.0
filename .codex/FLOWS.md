# FLOWS.md — Complete Complaint Lifecycle

This is the most important documentation file. It traces a complaint from landing page to IO dossier.

## Flow Overview

```
LANDING PAGE (/)
    │
    ▼
START REPORTING → /report
    │
    ▼
STEP 01: TELL US WHAT HAPPENED
    │  - Free-text narrative (type or speak)
    │  - AI auto-classifies category (or citizen selects)
    │  - POST /api/incidents (create draft)
    │  - POST /api/incidents/:id/analyze (AI classification + extraction)
    │
    ▼
STEP 02: EVIDENCE & TRANSACTIONS
    │  - Auto-extracted UTR/amount/VPA shown (from AI analysis)
    │  - Citizen can edit/override extracted values
    │  - Drag-and-drop evidence upload
    │  - Client-side SHA-256 hash computed in browser
    │  - POST /api/incidents/:id/evidence (upload + server hash verify)
    │  - POST /api/incidents/:id (PATCH: persist transaction details)
    │
    ▼
STEP 03: REVIEW & PERSONAL DETAILS
    │  - Full complaint summary
    │  - Anonymous mode toggle (honest disclosure)
    │  - Citizen contact info (name, phone, email, state, district)
    │  - Complaint readiness score displayed
    │  - PATCH /api/incidents/:id (persist contact + category confirmation)
    │
    ▼
STEP 04: E-SIGN
    │  - Enter Virtual ID (mock Aadhaar VID)
    │  - POST /api/incidents/:id/sign/challenge
    │  - Enter OTP (always 123456 in demo)
    │  - POST /api/incidents/:id/sign/complete
    │  - Signature artifact + signed hash stored
    │
    ▼
STEP 05: SUBMIT
    │  - POST /api/incidents/:id/submit
    │  - ACK number issued (e.g., NCRP-2026-A1B2C3)
    │  - Golden hour window started for financial fraud
    │  - Download acknowledgement PDF
    │  - POST /api/incidents/:id/acknowledgement.pdf
    │  - Socket.io broadcasts `incident:new` to IO queue
    │
    ▼
TRACK COMPLAINT (/track)
    │  - Enter ACK number
    │  - GET /api/complaints/track/:ackNumber
    │  - Live status updates via Socket.io
    │
    ▼
IO COMMAND CENTER (/hq)
    │  - Login: POST /api/officer/login
    │  - Live queue: GET /api/officer/queue
    │  - Case review: GET /api/officer/incidents/:id
    │  - Trigger freeze: POST /api/officer/incidents/:id/freeze
    │  - Advance status: POST /api/officer/incidents/:id/status
    │  - Generate dossier: GET /api/officer/incidents/:id/dossier.pdf
    │
    ▼
DOSSIER PDF
    - Rendered server-side with pdfkit
    - Contains: narrative, AI summary, evidence, hashes, BNS mapping, audit trail
```

## Detailed Step Documentation

### Step 01: Tell Us What Happened

**Frontend**: `frontend/src/app/report/page.tsx` — first step of the wizard
**Component**: The wizard is a multi-step form within a single page component

**What happens**:
1. User types narrative or uses voice dictation (Web Speech API / MediaRecorder fallback)
2. On submission, `POST /api/incidents` creates a draft with `narrative_raw`
3. Backend runs AI analysis: `POST /api/incidents/:id/analyze` → `runAiAnalysis()`
4. AI returns: category, confidence, extracted transactions, suspect identifiers, narrative summary
5. User sees proposed category with confidence chip; can confirm or change
6. Category options: `financial_fraud`, `harassment_extortion`, `women_child_safety`, `other_cyber_crime`

**State**: `incidentId` (MongoDB `_id`) created at this step — used by all subsequent steps

### Step 02: Evidence & Transactions

**What happens**:
1. Auto-extracted fields displayed (UTR, amount, VPA, timestamp) — editable by citizen
2. User uploads evidence files (drag-and-drop or file picker, max 6)
3. Client-side SHA-256 computed via `computeFileHash()` in `frontend/src/lib/hash.ts`
4. Hash sent with file to `POST /api/incidents/:id/evidence`
5. Backend: multer receives file → EXIF scrub (JPEG/PNG) → server re-hashes → compare → persist → store metadata
6. Optional: vision extraction on images (`POST /api/incidents/:id/evidence/:eid/vision`)
7. **Critical**: Transaction details MUST be persisted via `PATCH /api/incidents/:id` with `transaction` field

**Data produced**: `financial_transactions[]`, `evidence[]`, `suspect_identifiers[]`

### Step 03: Review & Personal Details

**What happens**:
1. Full complaint summary displayed with readiness score
2. Anonymous mode toggle — honest disclosure of limitations
3. Citizen contact info entered (if not anonymous)
4. Category confirmation recorded
5. PATCH request persists: `citizenContact`, `anonymousMode`, `category`, `categoryConfirmedByCitizen`

**Data produced**: `citizenContact`, `anonymousMode`, `categorySource`

### Step 04: E-Sign

**What happens**:
1. User enters Virtual ID (12-24 chars)
2. `POST /api/incidents/:id/sign/challenge` → mock e-Pramaan challenge issued
3. User enters OTP (always `123456` in demo)
4. `POST /api/incidents/:id/sign/complete` → OTP verified, payload hash computed, signature artifact stored
5. Signature stored: `provider: "epramaan_mock"`, `method: "aadhaar_otp_demo"`, `signedHash`, `artifact`

**Data produced**: `signature_status: "signed"`, `signature: { ... }`

### Step 05: Submit

**What happens**:
1. `POST /api/incidents/:id/submit` → `submitIncident()`
2. ACK number generated: `NCRP-YYYY-XXXXXX`
3. Status transitions: `draft` → `submitted`
4. Golden hour window set for `financial_fraud` (120 minutes from submission)
5. Audit trail entry added
6. Socket.io broadcasts `incident:new` to all `/hq` clients
7. Response: `acknowledgementNumber`, `submittedAt`, `category`, `goldenHourActive`
8. Frontend offers ACK PDF download

### IO Desk

**Frontend**: `frontend/src/app/hq/page.tsx`
**Auth**: JWT from `POST /api/officer/login`

**Case review (split view)**:
- Left: citizen narrative, evidence files, hashes, transaction details
- Right: AI extraction, BNS legal sections, readiness score, evidence verification

**Actions**:
- **Trigger 1930 Freeze**: `POST /api/officer/incidents/:id/freeze` → simulated CFCFRMS → money trail updated
- **Advance Status**: `POST /api/officer/incidents/:id/status` → `verified` → `assigned` → `investigation` → `fir_registered` → `closed`
- **Generate Dossier**: `GET /api/officer/incidents/:id/dossier.pdf` → server-rendered PDF

### Dossier PDF

Generated by `backend/src/services/pdfService.ts` → `renderDossier()`. Contains:
- Header with case ACK, status, readiness score
- Overview (category, language, anonymous mode, signature)
- Complaint narrative + AI summary
- Financial transaction details (UTR, amount, VPA)
- Suspect identifiers
- Provisional BNS legal mapping
- Evidence register with images, hashes, verification status
- Golden hour status
- Status history
- Audit trail
