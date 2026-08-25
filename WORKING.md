# WORKING — Judge walkthrough

Everything below runs against local MongoDB with clearly-labelled simulations. Start with
`./run.sh`, then open http://localhost:3000.

## Demo 1 — The launcher (landing page)
1. Landing hero asks in plain language: *"What happened? Describe it like you'd tell a friend."*
2. Type or dictate (mic button uses the Web Speech API; Chrome recommended). Ctrl/Cmd+Enter proceeds.
3. Note the calm tone: no jargon, no blame, immediate reassurance + "money gone? call 1930" strip.

## Demo 2 — AI understands you
1. The launcher text carries into `/report` step 01.
2. The AI layer (heuristic engine; auto-upgrades to GPT if `OPENAI_API_KEY` is set) proposes a
   category, e.g. **Financial fraud · UPI** with a confidence chip.
3. "Looks correct / Not quite" — choosing *Not quite* reveals all category cards.

## Demo 3 — Extraction from raw text
1. Paste a real-looking SMS into the transaction field, e.g.
   `Debited Rs 35000 from A/c XX1234 UTR 421598761234 to scammer.refund@okaxis`
2. UTR, amount, VPA are extracted and shown as *"Detected automatically"* fields — each editable.

## Demo 4 — Evidence integrity
1. Drop any image on step 02. Its SHA-256 is computed **in the browser** before upload
   (DevTools → Network shows the hash travelling with the file).
2. After upload the server re-hashes and confirms `server hash ✓`; EXIF/GPS metadata is scrubbed
   for images and the technical detail is expandable per file.

## Demo 5 — Anonymous mode honesty
1. Toggle anonymous mode at step 03. The UI states plainly what still gets stored and that
   follow-up contact is impossible — no dark patterns.

## Demo 6 — e-Sign (simulated e-Pramaan)
1. Step 04: enter any Virtual ID (e.g. `234567890123`). A mock challenge is issued; OTP is
   always **123456**. Only a synthetic VID reference is stored — never the raw ID.
2. Submit → acknowledgment number (e.g. `NCRP-2026-XXXXXX`) + downloadable acknowledgement PDF,
   plus a plain-language "what happens next" panel including golden-hour advice.

## Demo 7 — Live tracking
1. Open `/track`, enter the ACK number. Timeline shows the flow stages.
2. While it's open, advance the status from `/hq` — the timeline updates live over socket.io.

## Demo 8 — Suspect repository
1. On landing or `/protect`, check `+91-98765-43210` → 47 prior reports, risk badge, guidance.
2. Report-suspect tab adds a crowd-sourced entry (normalized phone/VPA/URL/email/wallet).

## Demo 9 — IO Command Center login
1. `/hq` → sign in `io@ncrp.demo` / `JaiHind2026`. Deliberately dense operational UI — different
   design language from the citizen portal.

## Demo 10 — Real-time queue
1. Submit a fresh complaint in another tab while watching `/hq`. It appears instantly via the
   `incident:new` socket event, with an amber banner if financial fraud is detected.

## Demo 11 — Split review & readiness
1. Open the case: left = citizen evidence (narrative incl. translated summary, files with hashes);
   right = AI extraction (UTR/amount/VPA), provisional BNS sections with rationale,
   statutory-readiness score.

## Demo 12 — Golden hour & freeze
1. Financial-fraud cases show a ticking response-window bar with intervention stages.
2. Click **Confirm & Trigger 1930 Freeze** → simulated CFCFRMS request returns reference IDs;
   money-trail nodes flip to **Frozen ✓** and the trail expands with mule hops.

## Demo 13 — Dossier PDF
1. Click **Generate Dossier** — server-rendered PDF containing narrative, extraction, evidence
   hashes, legal mapping and the full audit trail.

## Demo 14 — Multilingual
1. Switch language in the header (10 Indian languages). en/hi are complete; other locales cover
   core strings and fall back gracefully. Complaints can be filed in-language; narratives get a
   machine-translated English summary (mock Bhashini) visible to the IO.

## Architecture notes

```
frontend/  Next.js App Router · Tailwind · socket.io-client · Web Crypto/Speech
backend/   Express · Mongoose · Socket.io · pdfkit · zod · multer
           integrations/ = cfcfrms | epramaan | ceir | bhashini | tafcop  (all simulated:true)
           services/     = heuristicEngine | aiService | evidenceService | incidentService ...
```

- Status flow: `submitted → verified → assigned → investigation → fir_registered → closed`
  (transitions validated server-side, every change audit-logged + socket-broadcast).
- Golden hour: 120-min window anchored at submission for financial fraud.
- Evidence: client SHA-256 → upload → server re-hash verify + image metadata scrub → immutable
  hash chain recorded in the case document.
- Privacy: suspect identifiers stored normalized + partially redacted; anonymous mode documented
  honestly; demo data synthetic throughout.
