# NCRP 2.0 — e-FIR Jan-Sahayak

A citizen-first prototype of the National Cyber Crime Reporting Portal, built for the
**Build What Moves India Hackathon**. It pairs a redesigned, calm citizen experience with an
operational Investigating-Officer command center — connected by real-time events, AI extraction,
and honest simulated integrations.

> ⚠️ **Prototype.** All integrations (CFCFRMS freeze requests, e-Pramaan identity, CEIR IMEI,
> Bhashini translation, TAFCOP) are clearly-labelled simulations running against local MongoDB.
> No real PII is collected; demo data is synthetic. Not affiliated with any government body.

## Quick start

```bash
./run.sh            # installs, seeds, and starts both servers
```

- Citizen portal → http://localhost:3000
- IO Command Center → http://localhost:3000/hq (`io@ncrp.demo` / `JaiHind2026`)
- API → http://localhost:4000/api · MongoDB → `mongodb://localhost:27017/ncrp2`

Manual setup:

```bash
npm run install:all     # root + backend + frontend deps
cp backend/.env.example backend/.env   # optional; sane defaults built in
npm run seed            # synthetic suspects, guides, alerts, demo complaint
npm run dev             # backend :4000 + frontend :3000 via concurrently
```

Optional: set `OPENAI_API_KEY` in `backend/.env` to upgrade the AI layer from the built-in
heuristic engine to GPT classification/extraction/vision. Everything works without it.

## Demo credentials & shortcuts

| What | Value |
|---|---|
| Officer login (`/hq`) | `io@ncrp.demo` / `JaiHind2026` |
| e-Sign OTP (any VID) | `123456` |
| Seeded ACK number | `NCRP-2026-A1B2C3` |
| Known suspect | `+91-98765-43210`, `scammer.refund@okaxis`, `http://secure-sbi-kyc.xyz` |
| Sample UTR in seed case | `421598761234` (₹35,000) |

## Feature map

**Citizen side**
- Landing page with plain-language launcher ("describe it like you'd tell a friend"), Web Speech
  dictation, calm 1930 emergency module, suspect check, learning preview.
- Guided complaint wizard: AI category confirmation, transaction details with auto-extracted
  UTR/amount/VPA, suspect identifier capture, anonymous mode, drag-and-drop evidence with
  client-side SHA-256 hashing before upload, server-side EXIF scrubbing + hash re-verification.
- e-Sign flow (mock e-Pramaan): Virtual ID → OTP → signed submission → acknowledgment number +
  downloadable PDF.
- Track by acknowledgment number with live socket.io status timeline.
- Protect tab: check identifiers against the crowd-sourced suspect repository, report new ones.
- Learning Corner: scam-alert strip + practical guides; Volunteers signup.

**Officer side (`/hq`)**
- Login gate, live queue fed by `incident:new` socket events with golden-hour toast.
- Split review view: citizen evidence/transcript/metadata on the left; AI extraction, provisional
  BNS legal mapping, evidence hashes/readiness on the right.
- Golden-hour countdown bar with intervention stages.
- Money-trail tree (victim → mule hops) rendered from CFCFRMS simulation.
- One-click "Confirm & Trigger 1930 Freeze" (updates trail to FROZEN), status advancement,
  PDF dossier generation with full audit chain.

## Stack

Next.js (App Router, TypeScript, Tailwind) · Express + Mongoose · Socket.io · pdfkit · zod ·
Web Crypto / Web Speech APIs. i18n across 10 Indian languages (en/hi complete, others partial
with graceful fallback).

## Honest limitations

See `WORKING.md` for the judge-facing walkthrough and `backend/src/integrations/` for every
simulated boundary (each returns `simulated: true`).
