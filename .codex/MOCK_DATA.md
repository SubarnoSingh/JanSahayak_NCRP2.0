# MOCK_DATA.md — Mock Data & Testing Helpers

## Directory: `mockdata/`

### Files

| File | Purpose |
|---|---|
| `emblem_logo.webp` | Ashoka Emblem (338×433 WebP, ~40KB). Copied to `frontend/public/emblem_logo.webp` for GovHeader logo. |
| `telegram_job_scam.png` | Sample evidence image — Telegram job scam screenshot. Used for testing evidence upload. Also served by `GET /api/mockdata/test-evidence`. |
| `telegram_job_scam_sms.txt` | Sample SMS text evidence. Tests SMS parsing for UTR/amount extraction. |
| `sample_evidence_*.png` | Additional test evidence images of varying sizes. |

### Backend Mock Data Endpoint

**`GET /api/mockdata/test-evidence`**
- Serves `mockdata/telegram_job_scam.png` as a downloadable PNG
- Used by frontend testing helpers to provide downloadable test evidence
- Not available in production (returns 404 if file missing)

## Seed Data

**File**: `backend/src/seed.ts`
**Command**: `npm run seed`

### Seeded Data

**Officer**: 1 demo officer
- Email: `io@ncrp.demo` (from env `OFFICER_DEMO_EMAIL`)
- Name: Inspector A. Verma

**Suspects**: 5 synthetic suspects
| Identifier | Type | Reports | Status |
|---|---|---|---|
| `+91-98765-43210` | phone | 47 | flagged |
| `scammer.refund@okaxis` | upi | 23 | active |
| `http://secure-sbi-kyc.xyz` | url | 61 | action_taken |
| `+91-81234-56780` | phone | 12 | monitoring |
| `@quickprofit_trades` | social | 9 | active |

**Resources**: 8 learning articles
| Slug | Type | Trending |
|---|---|---|
| `digital-arrest-scams` | trending | Yes |
| `boss-scam` | trending | Yes |
| `phishing-guide` | guide | No |
| `upi-fraud-guide` | guide | No |
| `fake-customer-support` | guide | No |
| `job-scam-guide` | guide | No |
| `investment-scam-guide` | guide | No |
| `account-takeover-guide` | guide | No |

**Scam Alerts**: 3 alerts (critical, warning, info)

**Demo Incident**: 1 pre-filed complaint
- ACK: `NCRP-2026-A1B2C3`
- Category: financial_fraud
- Status: submitted
- Narrative: Bank KYC scam, ₹35,000 debited
- UTR: `421598761234`
- VPA: `scammer.refund@okaxis`
- Evidence: 1 synthetic image
- Money trail: Pre-computed CFCFRMS trace
- Signature: Mock e-Pramaan signed

## Demo Credentials

| What | Value |
|---|---|
| Officer login | `io@ncrp.demo` / `JaiHind2026` |
| e-Sign OTP | `123456` (any VID) |
| Seeded ACK | `NCRP-2026-A1B2C3` |

## Testing Helpers

### Evidence Testing
The mock evidence file can be downloaded from the API or accessed directly from `mockdata/telegram_job_scam.png`. Upload it via the complaint wizard's evidence step to test:
- File upload flow
- SHA-256 hashing (client + server)
- EXIF scrubbing (PNG → metadata chunks removed)
- Evidence metadata storage
- Dossier PDF image embedding

### Narratives for Testing

**Financial fraud (UPI)**:
```
I received a call from someone claiming to be from my bank's KYC department. They asked me to verify my account by making a small UPI transaction. After I entered the PIN, ₹35,000 was debited in two transactions within minutes.
```

**Digital Arrest**:
```
Someone video-called me claiming to be a CBI officer. They said I was under digital arrest and must stay on camera. They demanded ₹2,00,000 to clear my name.
```

**Phishing**:
```
I got an SMS saying my SBI account will be blocked. The link went to sbi-kyc.online. I entered my login details and ₹15,000 was stolen from my account.
```

**Harassment**:
```
Someone is sending me threatening messages on WhatsApp demanding money. They have my private photos and are blackmailing me.
```

## Important Notes

- All seed data is synthetic — no real PII
- Demo incident ACK `NCRP-2026-A1B2C3` is pre-created by seed script
- Running `npm run seed` wipes and recreates all data
- Mock integrations return clearly-labelled synthetic responses
- `mockdata/` files are for testing only — never served in production builds
