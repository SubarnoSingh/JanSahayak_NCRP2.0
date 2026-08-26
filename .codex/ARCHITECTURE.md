# ARCHITECTURE.md — System Architecture

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Citizen Portal                           │
│              Next.js 14 · Tailwind · Socket.io                  │
│   Landing → Report Wizard → e-Sign → Track → Protect → Learn   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST + Socket.io (/ws)
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
│   Shares same Next.js app, different route (/hq)               │
│   JWT auth → Live Queue → Case Review → Freeze → Dossier PDF  │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Responsibilities

### `frontend/`
- **`src/app/`** — Next.js App Router pages (14 routes)
- **`src/components/layout/`** — GovHeader (navbar), Footer
- **`src/components/landing/`** — StartReportingCta, Emergency1930, ServiceCard, SuspectCheck
- **`src/components/ui/`** — Card, Badge, Button, Skeleton, SectionHeading, EmptyState, ReadinessPanel, StatusBadge
- **`src/components/report/`** — Complaint wizard step components
- **`src/components/hq/`** — IO Command Center components
- **`src/lib/`** — api.ts (fetch client), types.ts (TypeScript types), socket.ts (Socket.io singleton), hash.ts (SHA-256), speech.ts (Web Speech + MediaRecorder), i18n.tsx (10-language i18n)
- **`src/locales/`** — 10 language JSON files (en complete, hi complete, others partial)

### `backend/`
- **`src/index.ts`** — Express + Socket.io server entry point
- **`src/config.ts`** — Environment variable loader with validation
- **`src/routes/index.ts`** — All API route definitions
- **`src/controllers/`** — incidentController (citizen), officerController (IO), miscController (suspects, content, speech)
- **`src/services/`** — 11 service modules (AI, evidence, PDF, BNS, readiness, speech, suspect, translation, incident, notification)
- **`src/integrations/`** — 5 simulated government integrations (CFCFRMS, e-Pramaan, CEIR, Bhashini, TAFCOP)
- **`src/models/`** — 7 Mongoose schemas (Incident, Suspect, Resource, ScamAlert, Officer, Volunteer, AuditLog)
- **`src/middleware/`** — officerAuth (JWT), upload (Multer config)
- **`src/validators/`** — Zod schemas for all request validation
- **`src/seed.ts`** — Database seeder with synthetic demo data
- **`src/data/officerDirectory.ts`** — Mock state/UT nodal officer directory data

### `mockdata/`
- `emblem_logo.webp` — Ashoka Emblem (copied to `frontend/public/`)
- `telegram_job_scam.png` — Sample evidence image for testing
- `telegram_job_scam_sms.txt` — Sample SMS text evidence
- `sample_evidence_*.{png,jpg,pdf}` — Additional test evidence files

## Routing

### Frontend (Next.js App Router)
All routes are in `frontend/src/app/`. The citizen portal and IO Command Center share the same Next.js app — differentiated by route path.

### Backend (Express)
All routes defined in `backend/src/routes/index.ts`, mounted at `/api`.

## State Management

- **React useState/useEffect** — No Redux or external state library
- **Incident state** — Maintained in complaint wizard component, persisted to backend via PATCH `/api/incidents/:id` at each step
- **Socket.io** — Real-time updates for IO queue and complaint tracking
- **localStorage** — Only for i18n language preference persistence

## Authentication

- **Citizen** — No authentication required (anonymous or contact-based)
- **Officer** — JWT-based (`POST /api/officer/login`), token sent via `Authorization: Bearer` header, 8-hour expiry
- **Demo credentials** — `io@ncrp.demo` / `JaiHind2026`

## Socket.io Events

| Event | Direction | Purpose |
|---|---|---|
| `incident:new` | Server → All `hq` room | New complaint filed |
| `incident:statusChanged` | Server → All `hq` room | Status updated |
| `incident:freezeTriggered` | Server → All `hq` room | 1930 freeze initiated |
| `incident:subscribe` | Client → Server | Subscribe to specific ACK updates |

Socket.io runs on path `/ws` (configured in both backend `index.ts` and frontend `socket.ts`).
