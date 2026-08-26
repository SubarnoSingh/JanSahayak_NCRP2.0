# NCRP 2.0 — e-FIR Jan-Sahayak

A citizen-first prototype of India's **National Cyber Crime Reporting Portal**, built for the **Build What Moves India Hackathon**. It pairs a redesigned, calm citizen experience with an operational Investigating-Officer command center — connected by real-time events, AI extraction, and honest simulated government integrations.

> **Prototype.** All integrations (CFCFRMS freeze requests, e-Pramaan identity, CEIR IMEI blocking, Bhashini translation, TAFCOP lookups) are clearly-labelled simulations running against local MongoDB. No real PII is collected; demo data is synthetic. Not affiliated with any government body.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Features — Citizen Portal](#features--citizen-portal)
- [Features — IO Command Center](#features--io-command-center)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Frontend Routes](#frontend-routes)
- [AI Layer](#ai-layer)
- [Government Integrations (Simulated)](#government-integrations-simulated)
- [Internationalization (i18n)](#internationalization-i18n)
- [Security & Privacy](#security--privacy)
- [Design System](#design-system)
- [Demo Credentials & Shortcuts](#demo-credentials--shortcuts)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Honest Limitations](#honest-limitations)

---

## Overview

India loses over ₹10,000 crore annually to cybercrime. The existing reporting portals are intimidating, jargon-heavy, and slow — especially during the critical **golden hour** when stolen funds can still be frozen. NCRP 2.0 addresses this with:

- **Plain-language guided complaint filing** — "describe it like you'd tell a friend"
- **AI-powered categorization and extraction** — UTR, amount, VPA pulled from raw text
- **Client-side SHA-256 evidence hashing** — integrity before upload
- **Simulated e-Pramaan digital signing** — Verifiable, auditable complaint submission
- **Real-time IO Command Center** — live queue, golden-hour countdown, one-click 1930 freeze
- **Multilingual support** — 10 Indian languages with graceful fallback
- **Crowd-sourced suspect repository** — community protection through shared intelligence

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Citizen Portal                           │
│              Next.js 14 · Tailwind · Socket.io                  │
│   Landing → Report Wizard → e-Sign → Track → Protect → Learn   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST + Socket.io
┌──────────────────────────▼──────────────────────────────────────┐
│                       API Server                                │
│            Express · Mongoose · Socket.io · pdfkit              │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Incident  │ │  Officer │ │   Misc   │ │  Integrations    │   │
│  │Controller │ │Controller│ │Controller│ │  (all simulated) │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │             │            │                 │             │
│  ┌────▼─────────────▼────────────▼─────────────────▼──────────┐ │
│  │  Services: AI · BNS Mapper · Evidence · PDF · Readiness    │ │
│  │            Speech · Suspect · Translation · Notification   │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │                                     │
│  ┌────────────────────────▼───────────────────────────────────┐ │
│  │              MongoDB (ncrp2)                                │ │
│  │  Incidents · Suspects · Resources · ScamAlerts · Officers  │ │
│  │  Volunteers · AuditLogs                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   IO Command Center                             │
│              Next.js · Socket.io · Tailwind                    │
│      Login → Live Queue → Case Review → Freeze → Dossier PDF  │
└─────────────────────────────────────────────────────────────────┘
```

**Status flow:** `draft → submitted → verified → assigned → investigation → fir_registered → closed`

Every status transition is validated server-side, audit-logged, and broadcast via Socket.io in real-time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS 3 |
| **Backend** | Express 4, Mongoose 8, Socket.io 4, TypeScript 5 |
| **Database** | MongoDB |
| **PDF Generation** | pdfkit |
| **Validation** | Zod |
| **File Uploads** | Multer |
| **Real-time** | Socket.io (bidirectional events) |
| **Security** | Helmet, express-rate-limit, CORS, JWT |
| **AI** | Heuristic engine (built-in) / OpenAI GPT-4o-mini (optional) |
| **Browser APIs** | Web Crypto (SHA-256), Web Speech (dictation), MediaRecorder |
| **Monorepo** | npm workspaces + concurrently |

---

## Directory Structure

```
NCRP_test_3/
├── package.json                    # Root: monorepo scripts
├── run.sh                          # One-command setup + launch
├── README.md                       # This file
├── WORKING.md                      # Judge-facing walkthrough
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example                # All environment variables documented
│   ├── .env                        # Active config (git-ignored)
│   └── src/
│       ├── index.ts                # Express + Socket.io server entry
│       ├── config.ts               # Environment config loader
│       ├── seed.ts                 # Database seeder (synthetic data)
│       ├── models/                 # Mongoose schemas
│       │   ├── Incident.ts         # Core complaint document
│       │   ├── Suspect.ts          # Crowd-sourced suspect repo
│       │   ├── Resource.ts         # Learning corner articles
│       │   ├── ScamAlert.ts        # Active scam warnings
│       │   ├── Officer.ts          # IO accounts
│       │   ├── Volunteer.ts        # Cyber volunteer signups
│       │   └── AuditLog.ts         # Immutable audit entries
│       ├── controllers/
│       │   ├── incidentController.ts   # Citizen complaint lifecycle
│       │   ├── officerController.ts    # IO command center
│       │   └── miscController.ts       # Suspects, content, speech, translation
│       ├── services/
│       │   ├── aiService.ts            # AI category + extraction orchestrator
│       │   ├── heuristicEngine.ts      # Built-in regex/NLP (no API key needed)
│       │   ├── bnsMapper.ts            # BNS section mapping
│       │   ├── evidenceService.ts      # Hash verification + EXIF scrub
│       │   ├── incidentService.ts      # Case CRUD + status transitions
│       │   ├── notificationService.ts  # Socket.io broadcast helpers
│       │   ├── pdfService.ts           # Acknowledgement + dossier PDFs
│       │   ├── readinessService.ts     # Statutory readiness scoring
│       │   ├── speechService.ts        # STT routing (OpenAI/external/browser)
│       │   ├── suspectService.ts       # Suspect search + normalization
│       │   └── translationService.ts   # Bhashini / mock translation
│       ├── integrations/
│       │   ├── cfcfrms.ts              # Central Financial Cyber Fraud Response (simulated)
│       │   ├── epramaan.ts             # e-Pramaan identity + signing (simulated)
│       │   ├── ceir.ts                 # CEIR IMEI blocking (simulated)
│       │   ├── bhashini.ts             # Bhashini translation (simulated)
│       │   └── tafcop.ts              # TAFCOP mobile lookup (simulated)
│       ├── middleware/
│       │   ├── officerAuth.ts         # JWT verification for /hq
│       │   └── upload.ts              # Multer config (images + audio)
│       ├── validators/
│       │   └── index.ts               # Zod schemas for request validation
│       └── routes/
│           └── index.ts               # All API route definitions
│
├── frontend/
│   ├── package.json
│   ├── next.config.mjs               # Security headers, Permissions-Policy
│   ├── tailwind.config.ts            # Custom design tokens
│   ├── tsconfig.json
│   ├── public/
│   │   ├── emblem_logo.webp          # Ashoka Emblem (Government of India)
│   │   └── ashoka-emblem.svg         # SVG fallback
│   └── src/
│       ├── app/                      # Next.js App Router pages
│       │   ├── page.tsx              # Landing page
│       │   ├── layout.tsx            # Root layout + providers
│       │   ├── globals.css           # Tailwind + design system
│       │   ├── report/               # Complaint wizard
│       │   ├── track/                # Complaint tracking
│       │   ├── hq/                   # IO Command Center
│       │   ├── protect/              # Suspect check + report
│       │   ├── learn/                # Learning corner
│       │   │   └── [slug]/           # Individual article pages
│       │   ├── volunteers/           # Cyber volunteer signup
│       │   ├── contact/              # Contact I4C
│       │   ├── about/                # About I4C
│       │   ├── help/                 # Help & support
│       │   ├── privacy/              # Privacy policy
│       │   ├── terms/                # Terms of use
│       │   └── accessibility/        # Accessibility statement
│       ├── components/
│       │   ├── layout/               # GovHeader, Footer
│       │   ├── landing/              # StartReportingCta, Emergency1930, ServiceCard, SuspectCheck
│       │   ├── report/               # Step components, VoiceDescribe, EvidenceUpload
│       │   ├── hq/                   # Officer dashboard components
│       │   └── ui/                   # Card, Badge, Button, Misc (shared primitives)
│       ├── lib/
│       │   ├── api.ts                # API client (fetch wrapper)
│       │   ├── types.ts              # TypeScript interfaces
│       │   ├── socket.ts             # Socket.io client singleton
│       │   ├── i18n.tsx              # i18n provider + hook
│       │   ├── hash.ts               # Client-side SHA-256 hashing
│       │   └── speech.ts             # Web Speech API + MediaRecorder fallback
│       └── locales/                  # Translation files
│           ├── en.json               # English (complete)
│           ├── hi.json               # Hindi (complete)
│           ├── bn.json               # Bengali
│           ├── gu.json               # Gujarati
│           ├── kn.json               # Kannada
│           ├── ml.json               # Malayalam
│           ├── mr.json               # Marathi
│           ├── pa.json               # Punjabi
│           ├── ta.json               # Tamil
│           └── te.json               # Telugu
│
└── mockdata/                         # Seed data, sample images, test files
```

---

## Features — Citizen Portal

### Landing Page
- **Plain-language hero:** "What happened? Describe it like you'd tell a friend."
- **Web Speech dictation:** Speak your complaint in English (with MediaRecorder fallback for restricted networks)
- **Calm 1930 emergency module:** Immediate "money gone? call 1930" guidance
- **Suspect quick-check:** Verify phone numbers, UPI IDs, URLs before filing
- **Trending scams:** Featured Digital Arrest + Boss Scam cards with learning links
- **Government services:** Direct links to CEIR, GAC, CPGRAMS, CCTNS, RTI
- **Learning preview:** Latest guides and scam alerts

### Complaint Wizard (5 Steps)

**Step 01 — Describe What Happened**
- Free-text narrative input (type or speak)
- AI proposes crime category with confidence score (e.g., "Financial fraud · UPI — 92% confidence")
- "Looks correct / Not quite" — choosing "Not quite" reveals all category cards for manual selection
- Category options: Financial Fraud, Identity Theft, Cyber Stalking, Data Breach, Ransomware, Cryptocurrency Crime, Other

**Step 02 — Evidence & Transactions**
- Auto-extraction from raw text: UTR number, transaction amount, VPA address (each editable)
- Drag-and-drop evidence upload (images, PDFs, screenshots)
- **Client-side SHA-256 hashing** before upload — hash shown to user, travels with the file
- Server-side re-verification + EXIF/GPS metadata scrubbing for images
- Expandable technical detail per file (hash, server verification status, scrubbing status)

**Step 03 — Review & Sign**
- Full complaint summary for review
- **Anonymous mode toggle** — honest disclosure of what still gets stored and that follow-up contact becomes impossible (no dark patterns)
- Suspect identifier capture (phone, UPI, URL, email, wallet address)

**Step 04 — e-Sign (Simulated e-Pramaan)**
- Enter Virtual ID → mock challenge issued
- OTP verification (demo OTP: `123456`)
- Only a synthetic VID reference stored — never the raw ID
- Digital signature artifact recorded in the audit trail

**Step 05 — Submission**
- ACK number issued (e.g., `NCRP-2026-XXXXXX`)
- Downloadable acknowledgement PDF
- "What happens next" panel with golden-hour advice
- Real-time status tracking via `/track`

### Complaint Tracking (`/track`)
- Enter ACK number to view status timeline
- Live updates via Socket.io — status changes appear instantly
- Status flow: submitted → verified → assigned → investigation → fir_registered → closed

### Protect (`/protect`)
- **Check tab:** Search suspect repository by phone, UPI, URL, email, or wallet
- **Report tab:** Submit new suspect identifiers to the crowd-sourced database
- Results show report count, risk level, recent activity, and guidance

### Learning Corner (`/learn`)
- **Trending scams:** Featured articles (Digital Arrest, Boss Scam)
- **Scam alerts:** Active warnings with severity levels
- **Guides:** Practical prevention articles (Phishing, UPI Fraud, Fake Support, Job Scams, Investment Scams, Account Takeover)
- Individual article pages at `/learn/[slug]`

### Volunteers (`/volunteers`)
- Cyber volunteer signup form
- Community-driven cybercrime prevention

### Informational Pages
- **Contact** (`/contact`) — I4C contact details, downloadable directory PDF
- **About I4C** (`/about`) — Organization information
- **Help & Support** (`/help`) — FAQ and guidance
- **Privacy Policy** (`/privacy`) — Data handling practices
- **Terms of Use** (`/terms`) — Portal usage terms
- **Accessibility** (`/accessibility`) — WCAG compliance statement

---

## Features — IO Command Center

Access at `/hq` (login required).

### Authentication
- JWT-based login gate
- Demo credentials: `io@ncrp.demo` / `JaiHind2026`

### Live Queue
- Real-time incident feed via `incident:new` Socket.io events
- Amber banner for financial fraud cases
- Golden-hour countdown with response window timer
- Quick-glance metadata: category, ACK number, time since submission

### Case Review (Split View)
**Left panel — Citizen evidence:**
- Raw narrative + machine-translated English summary
- Evidence files with SHA-256 hashes and verification status
- EXIF scrubbing status per file
- Transaction details (UTR, amount, VPA, bank)

**Right panel — AI extraction:**
- Extracted entities (UTR, amount, VPA, phone numbers)
- Provisional BNS (Bharatiya Nyaya Sanhita) legal section mapping with rationale
- Statutory readiness score (percentage + breakdown)
- Evidence integrity verification

### Golden Hour Management
- 120-minute response window for financial fraud
- Ticking countdown bar with intervention stages
- One-click **"Confirm & Trigger 1930 Freeze"** — simulated CFCFRMS request
- Money-trail visualization (victim → mule hops) with frozen status indicators

### Case Actions
- **Status advancement** (verified → assigned → investigation → fir_registered → closed)
- **Dossier PDF generation** — server-rendered PDF with narrative, extraction, evidence hashes, legal mapping, and full audit trail
- **Evidence file serving** — secure file access for officer review

### Audit Trail
Every action is logged with actor, timestamp, and detail:
```
citizen   → Complaint started
ai        → AI analysis applied (provider=heuristic, confidence=0.92)
citizen   → Evidence added (1)
system    → Digital signature applied (mock e-Pramaan)
citizen   → Complaint submitted
officer   → Status changed to verified
officer   → 1930 Freeze triggered (CFCFRMS ref: FREEZE-2026-XXXXX)
```

---

## Database Models

### Incident (Core Complaint)
| Field | Description |
|---|---|
| `acknowledgementNumber` | Unique ACK (e.g., NCRP-2026-A1B2C3) |
| `incident_category` | AI-classified category |
| `categoryConfidence` | AI confidence score (0–1) |
| `categorySource` | `ai_auto` / `citizen_confirmed` / `citizen_selected` |
| `language` | Submission language code |
| `narrative_raw` | Original citizen text |
| `narrative_summary` | AI/translated summary |
| `financial_transactions[]` | UTR, amount, VPA, bank, timestamps |
| `suspect_identifiers[]` | Type + value + context |
| `evidence[]` | File metadata, SHA-256 hashes, verification status |
| `bns_sections_mapped[]` | BNS sections with rationale |
| `statutory_readiness_score` | Readiness percentage |
| `readiness_breakdown` | Per-requirement scoring |
| `anonymousMode` | Boolean — anonymous submission flag |
| `citizenContact` | Name, phone, state, district (omitted if anonymous) |
| `signature_status` | `unsigned` / `signed` |
| `signature` | Provider, method, artifact, signed hash, timestamp |
| `status` | Current status in workflow |
| `statusHistory[]` | All status transitions with timestamps |
| `goldenHour` | Start time + window duration |
| `moneyTrail` | CFCFRMS trace result (nodes + hops) |
| `audit_trail[]` | Immutable log of all actions |

### Suspect (Crowd-sourced Repository)
| Field | Description |
|---|---|
| `identifier` | Raw identifier (phone, UPI, URL, email, wallet) |
| `normalizedIdentifier` | Cleaned/normalized form |
| `type` | `phone` / `upi` / `url` / `email` / `wallet` / `social` |
| `reportCount` | Number of crowd-sourced reports |
| `categories[]` | Associated crime categories |
| `status` | `active` / `flagged` / `action_taken` / `monitoring` |
| `recentActivity[]` | Recent reports with timestamps and notes |

### Resource (Learning Corner Articles)
| Field | Description |
|---|---|
| `slug` | URL-safe identifier |
| `title` / `titleHi` | Article titles (English + Hindi) |
| `category` | `trending` / `guide` |
| `scamType` | Classification label |
| `trending` | Boolean — featured on landing page |
| `readMinutes` | Estimated reading time |
| `summary` / `summaryHi` | Article previews |
| `body` | Full article content (Markdown) |
| `tags[]` | Searchable tags |

### ScamAlert
| Field | Description |
|---|---|
| `title` | Alert headline |
| `severity` | `critical` / `warning` / `info` |
| `region` | Geographic scope |
| `summary` | Alert description |
| `publishedAt` | Publication timestamp |

### Officer
| Field | Description |
|---|---|
| `email` | Login credential |
| `name` | Full name |
| `rank` | Designation |
| `unit` | Station/unit assignment |
| `passwordHash` | Stored password (demo only) |

### Volunteer
| Field | Description |
|---|---|
| Standard signup fields | Name, contact, motivation, availability |

### AuditLog
| Field | Description |
|---|---|
| `incidentId` | Associated complaint |
| `actor` | Who performed the action |
| `action` | Description of the action |
| `detail` | Additional context |
| `timestamp` | When it occurred |

---

## API Endpoints

### Citizen — Complaint Lifecycle
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/incidents` | Create new complaint |
| `GET` | `/api/incidents/:id` | Get complaint details |
| `PATCH` | `/api/incidents/:id` | Update complaint |
| `POST` | `/api/incidents/:id/analyze` | Trigger AI analysis |
| `POST` | `/api/incidents/:id/evidence` | Upload evidence files (max 6) |
| `POST` | `/api/incidents/:id/evidence/:eid/vision` | AI vision extraction on evidence |
| `POST` | `/api/incidents/:id/sign/challenge` | Initiate e-Sign challenge |
| `POST` | `/api/incidents/:id/sign/complete` | Complete e-Sign with OTP |
| `POST` | `/api/incidents/:id/submit` | Submit complaint |
| `GET` | `/api/incidents/:id/acknowledgement.pdf` | Download ACK PDF |

### Citizen — Tracking
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/complaints/track/:ackNumber` | Track complaint by ACK number |

### Suspect Repository
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/suspects/search` | Search by identifier |
| `POST` | `/api/suspects/report` | Report new suspect |
| `GET` | `/api/suspects/stats` | Repository statistics |

### Speech & Translation
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/speech/transcribe` | Audio → text (Whisper/browser) |
| `POST` | `/api/translation/translate` | Translate text (Bhashini/mock) |
| `GET` | `/api/languages` | Supported languages list |

### Content
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/resources` | List learning articles |
| `GET` | `/api/scam-alerts` | List active scam alerts |
| `POST` | `/api/volunteers` | Submit volunteer signup |

### Government Lookups (Simulated)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/gov/tafcop-lookup` | TAFCOP mobile connection check |
| `POST` | `/api/gov/ceir-block` | CEIR IMEI block request |

### Misc
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/directory.pdf` | Download I4C contact directory |
| `GET` | `/api/mockdata/test-evidence` | Download sample evidence file |

### Officer — Command Center (JWT Required)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/officer/login` | Officer authentication |
| `GET` | `/api/officer/queue` | Get incident queue |
| `GET` | `/api/officer/incidents/:id` | Full case detail |
| `POST` | `/api/officer/incidents/:id/freeze` | Trigger 1930 freeze |
| `POST` | `/api/officer/incidents/:id/status` | Advance case status |
| `GET` | `/api/officer/incidents/:id/dossier.pdf` | Generate dossier PDF |
| `GET` | `/api/officer/incidents/:id/evidence/:eid/file` | Serve evidence file |

### Socket.io Events
| Event | Direction | Description |
|---|---|---|
| `incident:new` | Server → Client | New complaint filed |
| `incident:statusChanged` | Server → Client | Status updated |
| `incident:freezeTriggered` | Server → Client | 1930 freeze initiated |

---

## Frontend Routes

| Path | Description | Auth |
|---|---|---|
| `/` | Landing page with hero, services, trending scams, government links | Public |
| `/report` | Guided complaint wizard (5 steps) | Public |
| `/track` | Complaint status tracker | Public |
| `/hq` | IO Command Center | Officer JWT |
| `/protect` | Suspect check + report (tabbed) | Public |
| `/learn` | Learning corner — guides + scam alerts | Public |
| `/learn/[slug]` | Individual learning article | Public |
| `/volunteers` | Cyber volunteer signup | Public |
| `/contact` | Contact I4C | Public |
| `/about` | About I4C | Public |
| `/help` | Help & support | Public |
| `/privacy` | Privacy policy | Public |
| `/terms` | Terms of use | Public |
| `/accessibility` | Accessibility statement | Public |

---

## AI Layer

### Dual-mode Architecture
The AI layer operates in two modes with seamless fallback:

**Heuristic Engine (default, no API key needed):**
- Regex-based extraction of UTR numbers, amounts, VPA addresses, phone numbers
- Keyword-based crime category classification
- Pattern matching for common scam narratives
- Works fully offline — no external API calls

**GPT Mode (when `OPENAI_API_KEY` is set):**
- Upgrades to GPT-4o-mini for classification and extraction
- Vision API for evidence image analysis
- Higher accuracy on complex narratives
- Automatic fallback to heuristic engine on API errors

### BNS Legal Mapping
The `bnsMapper` service maps crime categories to relevant **Bharatiya Nyaya Sanhita (BNS)** sections with rationale, providing officers with provisional legal grounding for each case.

### Statutory Readiness Score
Computed by `readinessService` based on:
- Category confirmation status
- Transaction details completeness
- Suspect identifier availability
- Evidence count and integrity
- Contact information presence

---

## Government Integrations (Simulated)

All integrations in `backend/src/integrations/` return `simulated: true` and operate against local mock data. Each can be switched to `production` mode via environment variables.

| Integration | Purpose | Mock Behavior |
|---|---|---|
| **CFCFRMS** | Central Financial Cyber Fraud Response — fund freeze requests | Returns synthetic freeze reference IDs, generates money-trail with mule hops |
| **e-Pramaan** | Aadhaar-based identity verification + digital signing | Issues mock challenge/OTP, stores synthetic signature artifact |
| **CEIR** | Central Equipment Identity Register — IMEI blocking | Returns synthetic block confirmation |
| **Bhashini** | AI-powered multilingual translation | Returns mock translated text |
| **TAFCOP** | Telecom Analytics for Fraud Prevention — mobile connection lookup | Returns mock connection data |

---

## Internationalization (i18n)

### Supported Languages (10)
| Language | Code | Status |
|---|---|---|
| English | `en` | Complete |
| Hindi | `hi` | Complete |
| Bengali | `bn` | Partial (core strings) |
| Gujarati | `gu` | Partial (core strings) |
| Kannada | `kn` | Partial (core strings) |
| Malayalam | `ml` | Partial (core strings) |
| Marathi | `mr` | Partial (core strings) |
| Punjabi | `pa` | Partial (core strings) |
| Tamil | `ta` | Partial (core strings) |
| Telugu | `te` | Partial (core strings) |

### i18n Behavior
- Language selector in the header (GovHeader component)
- All UI strings sourced from locale JSON files
- Partial locales fall back gracefully to English for missing keys
- Complaints can be filed in any supported language
- Machine-translated English summary generated for IO review (mock Bhashini)
- Translation files located at `frontend/src/locales/*.json`

---

## Security & Privacy

### Backend Security
- **Helmet** — HTTP security headers
- **express-rate-limit** — API rate limiting
- **CORS** — Configured origin (default: `http://localhost:3000`)
- **JWT** — Officer authentication with configurable secret
- **Input validation** — Zod schemas on all endpoints
- **File upload limits** — 10MB max, audio + image only

### Evidence Integrity
- **Client-side SHA-256** — Hash computed in-browser via Web Crypto API before upload
- **Server-side re-verification** — Hash re-computed after upload, immutable record created
- **EXIF/GPS scrubbing** — Image metadata stripped on upload for privacy
- **Immutable hash chain** — Evidence hashes stored in the case document, tamper-evident

### Privacy
- **Anonymous mode** — Honest disclosure of limitations (no dark patterns)
- **Suspect normalization** — Identifiers stored in normalized + partially redacted form
- **Synthetic demo data** — No real PII in seed data
- **Permissions-Policy** — Microphone access restricted to self-origin only

### Frontend Security Headers (next.config.mjs)
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(self), geolocation=()
Content-Security-Policy: ... (restricted)
```

---

## Design System

### Custom Tailwind Tokens
The project uses a custom design system defined in `tailwind.config.ts` and `globals.css`:

| Token | Usage |
|---|---|
| `navy` / `navy-deep` | Primary brand color (deep blue) |
| `saffron` / `saffron-deep` | Accent / warning accent |
| `ink` / `ink-soft` / `ink-faint` | Text hierarchy |
| `surface` / `paper` | Background layers |
| `line` / `line-strong` | Borders |
| `ok` / `warn` / `danger` | Status colors |
| `shadow-card` / `shadow-raised` | Elevation system |
| `rounded-card` / `rounded-control` | Border radius tokens |

### Component Library
- **Card** — Base container with border, shadow, background
- **Badge** — Status/category labels with tone variants (ok, warn, danger, info, neutral, saffron)
- **Button** — Variants: primary, ghost, saffron, danger
- **SectionHeading** — Consistent section headers with eyebrow, title, subtitle
- **Skeleton** — Loading placeholder components
- **ServiceCard** — Landing page service links
- **StatusBadge** — Complaint status indicators

### Responsive Breakpoints
- Mobile-first design
- `sm:` — 640px (small tablets)
- `lg:` — 1024px (desktop)
- `xl:` — 1280px (wide screens)

---

## Demo Credentials & Shortcuts

| What | Value |
|---|---|
| Officer login (`/hq`) | `io@ncrp.demo` / `JaiHind2026` |
| e-Sign OTP (any VID) | `123456` |
| Seeded ACK number | `NCRP-2026-A1B2C3` |
| Known suspect (phone) | `+91-98765-43210` (47 reports) |
| Known suspect (UPI) | `scammer.refund@okaxis` (23 reports) |
| Known suspect (URL) | `http://secure-sbi-kyc.xyz` (61 reports) |
| Sample UTR in seed case | `421598761234` (₹35,000) |
| Sample VPA in seed case | `scammer.refund@okaxis` |

---

## Setup & Installation

### Prerequisites
- **Node.js** 18+ (recommended: 20 LTS)
- **MongoDB** 6+ running locally on default port (27017)
- **npm** 9+

### Quick Start (One Command)

```bash
./run.sh
```

This single command will:
1. Install all dependencies (root + backend + frontend)
2. Copy `.env.example` to `backend/.env` if not present
3. Start MongoDB if running as a systemd service
4. Seed the database with synthetic demo data
5. Start both servers (backend on :4000, frontend on :3000)

### Manual Setup

```bash
# 1. Install all dependencies
npm run install:all

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env as needed (all sane defaults are built in)

# 3. Seed the database
npm run seed

# 4. Start development servers
npm run dev
```

### Available Scripts

| Script | Description |
|---|---|
| `npm run install:all` | Install root + backend + frontend dependencies |
| `npm run dev` | Start both servers concurrently (backend :4000 + frontend :3000) |
| `npm run dev:backend` | Start only the backend server |
| `npm run dev:frontend` | Start only the frontend server |
| `npm run seed` | Seed MongoDB with synthetic demo data |
| `npm run build` | Build both backend and frontend for production |
| `npm run typecheck` | Run TypeScript type checking on both projects |

### Backend-Only Scripts

```bash
cd backend
npm run dev          # Start with tsx watch (hot reload)
npm run build        # Compile TypeScript
npm run start        # Run compiled JS
npm run seed         # Seed database
npm run typecheck    # Type check only
npm run selftest     # Run integration self-test
```

### Frontend-Only Scripts

```bash
cd frontend
npm run dev          # Start Next.js dev server on :3000
npm run build        # Production build
npm run start        # Start production server on :3000
npm run typecheck    # Type check only
npm run lint         # Run ESLint
```

### Access Points

| Service | URL |
|---|---|
| Citizen Portal | http://localhost:3000 |
| IO Command Center | http://localhost:3000/hq |
| API Server | http://localhost:4000/api |
| MongoDB | mongodb://localhost:27017/ncrp2 |

### Optional: OpenAI API Key

Set `OPENAI_API_KEY` in `backend/.env` to upgrade the AI layer from the built-in heuristic engine to GPT-4o-mini for classification, extraction, and vision. Everything works without it.

---

## Environment Variables

All configuration is in `backend/.env` (copy from `backend/.env.example`):

### Server
| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | API server port |
| `NODE_ENV` | `development` | Environment mode |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |

### Database (Required)
| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/ncrp2` | MongoDB connection string |

### AI
| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | _(empty)_ | OpenAI API key (empty = heuristic engine) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model for classification/extraction |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | API base URL (for proxies) |

### Speech-to-Text
| Variable | Default | Description |
|---|---|---|
| `WHISPER_PROVIDER` | `auto` | `auto` / `openai` / `external` / `off` |
| `WHISPER_API_URL` | _(empty)_ | External Whisper endpoint |
| `WHISPER_API_KEY` | _(empty)_ | External Whisper API key |

### Bhashini Translation
| Variable | Default | Description |
|---|---|---|
| `BHASHINI_ENABLED` | `false` | Enable real Bhashini API |
| `BHASHINI_API_KEY` | _(empty)_ | Bhashini API key |
| `BHASHINI_API_URL` | _(empty)_ | Bhashini endpoint |

### Government Integrations
| Variable | Default | Description |
|---|---|---|
| `CFCFRMS_MODE` | `mock` | `mock` / `production` |
| `CFCFRMS_API_URL` | _(empty)_ | CFCFRMS endpoint (production mode) |
| `EPRAMAAN_MODE` | `mock` | `mock` / `production` |
| `EPRAMAAN_API_URL` | _(empty)_ | e-Pramaan endpoint |
| `CEIR_MODE` | `mock` | `mock` / `production` |
| `CEIR_API_URL` | _(empty)_ | CEIR endpoint |
| `TAFCOP_MODE` | `mock` | `mock` / `production` |
| `TAFCOP_API_URL` | _(empty)_ | TAFCOP endpoint |

### Security
| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `change-me-in-production` | JWT signing secret |
| `OFFICER_DEMO_EMAIL` | `io@ncrp.demo` | Demo officer email |
| `OFFICER_DEMO_PASSWORD` | `JaiHind2026` | Demo officer password |

### Uploads
| Variable | Default | Description |
|---|---|---|
| `MAX_UPLOAD_MB` | `10` | Maximum file upload size |
| `UPLOAD_DIR` | `uploads` | Upload storage directory |

---

## Honest Limitations

This is a hackathon prototype. Every simulated boundary is documented in `backend/src/integrations/` — each returns `simulated: true`.

**What's real:**
- Full complaint lifecycle with audit trail
- Client-side SHA-256 evidence hashing
- Server-side hash re-verification
- EXIF/GPS metadata scrubbing
- Real-time Socket.io communication
- Multilingual UI (10 languages)
- Comprehensive learning content
- Crowd-sourced suspect repository
- PDF generation (acknowledgement + dossier)

**What's simulated:**
- All government API integrations (CFCFRMS, e-Pramaan, CEIR, Bhashini, TAFCOP)
- Digital signature (mock e-Pramaan OTP)
- 1930 freeze trigger (returns synthetic reference IDs)
- Money-trail tracing (synthetic mule hop data)
- Speech-to-text (browser Web Speech API or mock)
- Translation (mock provider when Bhashini disabled)

**What's missing (production requirements):**
- Real Aadhaar-based e-Pramaan integration
- Actual CFCFRMS freeze request pipeline
- CEIR IMEI blocking integration
- Bhashini translation API
- Production MongoDB with authentication
- HTTPS / TLS termination
- Real officer authentication (not demo credentials)
- Rate limiting per-user (currently per-IP)
- Data retention policies
- Legal compliance review

See `WORKING.md` for the complete judge-facing walkthrough with step-by-step demo instructions.

---

## License

Prototype for the **Build What Moves India Hackathon**. Not affiliated with any government body. Synthetic demo data only — no real PII collected or stored.
