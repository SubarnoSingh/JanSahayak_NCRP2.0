# TESTING.md — Practical Testing Guide

## Running the Application

```bash
# Quick start
./run.sh

# Manual
npm run install:all
cp backend/.env.example backend/.env
npm run seed
npm run dev
```

- Citizen portal: http://localhost:3000
- IO Command Center: http://localhost:3000/hq
- API: http://localhost:4000/api

## Build Verification

```bash
npm run typecheck    # TypeScript check both projects
npm run build        # Production build (backend tsc + frontend next build)
```

## End-to-End Test Scenario

### 1. Start Application
```bash
./run.sh
```
Verify: Both servers start, MongoDB connects, seed data loaded.

### 2. Landing Page
- Open http://localhost:3000
- Verify: Hero text, CTA button, emergency 1930 banner, trending scam cards (Digital Arrest + Boss Scam), government services
- Click "Check" on suspect widget → enter `+91-98765-43210` → verify 47 reports shown

### 3. File Complaint
- Click "Begin your complaint" → `/report`
- **Step 01**: Type: "I received a call from someone claiming to be from my bank. They asked me to verify my account by making a small UPI transaction. After I entered the PIN, ₹35,000 was debited. UTR 421598761234 to scammer.refund@okaxis"
- Verify: AI classifies as "financial_fraud" with confidence score
- Verify: UTR `421598761234` extracted, amount `₹35,000` extracted, VPA `scammer.refund@okaxis` extracted
- **Step 02**: Upload `mockdata/telegram_job_scam.png` as evidence
- Verify: SHA-256 hash shown, "server hash ✓" after upload
- Verify: Transaction details show extracted values
- **Step 03**: Fill personal details (or toggle anonymous mode)
- Verify: Readiness score updates
- **Step 04**: Enter VID `234567890123`, OTP `123456`
- Verify: Signature applied
- **Step 05**: Submit
- Verify: ACK number (NCRP-2026-XXXXXX) generated
- Verify: Download acknowledgement PDF → verify it renders with ACK number

### 4. Track Complaint
- Go to `/track`
- Enter ACK number from step 3
- Verify: Status shows "Submitted", timeline visible

### 5. Voice Dictation
- Go to `/report` → click microphone button
- Speak: "Someone stole money from my bank account"
- Verify: Text appears in textarea
- If Web Speech API fails (network error), verify MediaRecorder fallback activates

### 6. IO Command Center
- Go to `/hq`
- Login: `io@ncrp.demo` / `JaiHind2026`
- Verify: Complaint from step 3 appears in queue
- Click on complaint
- Verify: Split view — narrative + evidence on left, AI extraction on right
- Verify: Transaction details (UTR, amount, VPA) visible
- Verify: BNS legal sections mapped
- Click "Generate Dossier"
- Verify: PDF downloads, contains narrative, evidence hashes, audit trail

### 7. Learning Corner
- Go to `/learn`
- Verify: Trending scams section with Digital Arrest + Boss Scam cards
- Click Boss Scam card
- Verify: `/learn/boss-scam` loads with full article content
- Click "← All guides" → verify returns to `/learn`

### 8. Protect / Suspect Check
- Go to `/protect`
- Search `+91-98765-43210` → verify flagged suspect with 47 reports
- Search `scammer.refund@okaxis` → verify 23 reports
- Search `unknown-number-123` → verify "No reports found"

### 9. Multilingual
- Click language selector in header → switch to Hindi
- Verify: UI strings change to Hindi
- Switch back to English
- Verify: All strings restore

### 10. Contact PDF
- Go to `/contact`
- Click "Download Directory"
- Verify: PDF downloads, landscape A4, table of state/UT officers
- Verify: ₹ symbol not needed in this PDF

## API Testing (curl)

```bash
# Create incident
curl -X POST http://localhost:4000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"narrative":"Test complaint about UPI fraud. UTR 421598761234 amount ₹35000 to scammer@okaxis","category":"financial_fraud"}'

# Returns incident ID — use it in subsequent calls

# Upload evidence
curl -X POST http://localhost:4000/api/incidents/{ID}/evidence \
  -F "files=@mockdata/telegram_job_scam.png"

# Submit
curl -X POST http://localhost:4000/api/incidents/{ID}/submit

# Officer login
curl -X POST http://localhost:4000/api/officer/login \
  -H "Content-Type: application/json" \
  -d '{"email":"io@ncrp.demo","password":"JaiHind2026"}'
# Returns JWT token — use in Authorization header for /hq endpoints
```
