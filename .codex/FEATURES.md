# FEATURES.md — Feature Inventory

## Citizen Side

### Landing Page (`/`)
- **File**: `frontend/src/app/page.tsx`
- **Components**: StartReportingCta, Emergency1930, ServiceCard, SuspectCheck
- **Content**: Hero text, 4 secondary service cards, proactive defense section, learning preview, volunteer CTA, government services row
- **Trending scams**: Digital Arrest + Boss Scam (from API `GET /api/resources`, filtered by `trending: true`)
- **State**: `resources` and `alerts` fetched from API via `useEffect`

### Report Complaint (`/report`)
- **File**: `frontend/src/app/report/page.tsx`
- **5-step wizard**: Describe → Evidence → Review → Sign → Success
- **Step 01 — Tell us what happened**: Free-text narrative, voice dictation (Web Speech + MediaRecorder fallback), AI category classification
- **Step 02 — Evidence**: File upload (max 6), client-side SHA-256, auto-extracted UTR/amount/VPA (editable), vision extraction
- **Step 03 — Review**: Summary, anonymous mode toggle, personal details, readiness score
- **Step 04 — e-Sign**: Virtual ID → OTP (123456) → signature
- **Step 05 — Success**: ACK number, PDF download, "what happens next"

### Complaint Tracking (`/track`)
- **File**: `frontend/src/app/track/page.tsx`
- **Input**: ACK number (e.g., `NCRP-2026-A1B2C3`)
- **Output**: Status timeline with live Socket.io updates
- **API**: `GET /api/complaints/track/:ackNumber`

### Protect (`/protect`)
- **File**: `frontend/src/app/protect/page.tsx`
- **Tab 1 — Check**: Search suspect repository by phone/UPI/URL/email/wallet
- **Tab 2 — Report**: Submit new suspect identifier
- **Component**: `SuspectCheck` (`frontend/src/components/landing/SuspectCheck.tsx`)
- **API**: `POST /api/suspects/search`, `POST /api/suspects/report`

### Learning Corner (`/learn`)
- **File**: `frontend/src/app/learn/page.tsx`
- **Content**: Scam alerts strip, trending scam cards, guide cards
- **API**: `GET /api/resources`, `GET /api/scam-alerts`

### Learning Article (`/learn/[slug]`)
- **File**: `frontend/src/app/learn/[slug]/page.tsx`
- **Content**: Individual article with MarkdownLite renderer
- **Slugs in seed**: `digital-arrest-scams`, `boss-scam`, `phishing-guide`, `upi-fraud-guide`, `fake-customer-support`, `job-scam-guide`, `investment-scam-guide`, `account-takeover-guide`

### Volunteers (`/volunteers`)
- **File**: `frontend/src/app/volunteers/page.tsx`
- **Content**: Roles description + application form
- **API**: `POST /api/volunteers`

### Contact (`/contact`)
- **File**: `frontend/src/app/contact/page.tsx`
- **Content**: Officer directory with search/filter, desktop table + mobile cards, PDF download
- **API**: `GET /api/directory.pdf`

### Informational Pages
- **About** (`/about`): I4C info, NCRP 2.0 purpose, mission, features
- **Help** (`/help`): FAQ cards, emergency 1930 banner
- **Privacy** (`/privacy`): Data collection, usage, security, retention
- **Terms** (`/terms`): Usage terms, evidence rules, liability
- **Accessibility** (`/accessibility`): WCAG 2.1 AA commitment, features list

## Officer Side

### IO Command Center (`/hq`)
- **File**: `frontend/src/app/hq/page.tsx`
- **Auth**: JWT (`POST /api/officer/login`)
- **Live queue**: Real-time incident feed via Socket.io `incident:new`
- **Case review**: Split view — citizen evidence (left) + AI extraction (right)
- **Golden hour**: Countdown bar with intervention stages for financial fraud
- **Actions**: Trigger 1930 freeze, advance status, generate dossier PDF
- **Evidence serving**: `GET /api/officer/incidents/:id/evidence/:eid/file`

## Shared Features

### Multilingual Support (i18n)
- **File**: `frontend/src/lib/i18n.tsx`
- **10 languages**: en, hi, bn, ta, mr, te, gu, kn, ml, pa
- **Complete**: en, hi. Others partial with English fallback.
- **Persistence**: localStorage
- **Translation API**: `POST /api/translation/translate` (mock Bhashini)

### Voice Dictation
- **File**: `frontend/src/lib/speech.ts`
- **Primary**: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Fallback**: MediaRecorder → POST `/api/speech/transcribe` → backend Whisper/browser

### Real-time Updates
- **File**: `frontend/src/lib/socket.ts`
- **Library**: Socket.io client
- **Path**: `/ws`
- **Rooms**: `hq` (all IO clients), `incident:{ackNumber}` (specific case tracking)
