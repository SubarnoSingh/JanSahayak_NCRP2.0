# PDF_SYSTEM.md — PDF Generation

## Library

**pdfkit** (`pdfkit` npm package) — server-side PDF generation.

## PDF Types

### 1. Acknowledgement PDF
**Function**: `renderAcknowledgement(incident)` in `backend/src/services/pdfService.ts`
**Triggered by**: `GET /api/incidents/:id/acknowledgement.pdf`
**Content**:
- Header: "NCRP 2.0 — e-FIR Jan-Sahayak" with navy banner
- Acknowledgement number (large, bold)
- Incident type, submission time, language
- "What happens next" panel (3 steps + financial fraud 1930 note)
- Evidence integrity summary (file count, SHA-256 hashes)
- Demo disclaimer footer

### 2. Dossier PDF
**Function**: `renderDossier(incident)` in `backend/src/services/pdfService.ts`
**Triggered by**: `GET /api/officer/incidents/:id/dossier.pdf`
**Content** (multi-page):
- Page 1: Header → Overview → Complaint narrative (AI summary box + raw statement) → Financial details (UTR, amount, VPA) → Suspect identifiers → BNS legal mapping
- Page 2+: Evidence register (images embedded, hashes, verification status, extracted data) → Golden hour status → Status history → Audit trail
- Footer: Demo disclaimer

### 3. Directory PDF
**Function**: `renderDirectoryPdf()` in `backend/src/services/pdfService.ts`
**Triggered by**: `GET /api/directory.pdf`
**Content**: Landscape A4 table of state/UT nodal officers (mock data from `backend/src/data/officerDirectory.ts`)

## Unicode ₹ Support

**Critical requirement**: PDF must render ₹ (U+20B9) correctly.

**Font registration**:
- Noto Sans font files expected at `/usr/share/fonts/noto/NotoSans-{Regular,Bold,Medium,Italic}.ttf`
- Falls back to Helvetica if Noto fonts not found
- `registerNoto(doc)` called at start of each PDF document
- `F(weight)` helper returns correct font name based on Noto availability

**If Noto fonts are missing**: `useNoto = false`, Helvetica is used. ₹ may not render on Helvetica — this is a known limitation on systems without Noto fonts installed.

## Page Layout

- **Size**: A4
- **Margins**: top 48, bottom 56, left 48, right 48
- **Colors**: NAVY (#1e3a5f), CHARCOAL (#1c1c1c), GRAY (#6b7280), GREEN (#16a34a), RED (#dc2626)

## Image Handling

Evidence images embedded in dossier PDF:
- Read from disk via `readEvidenceImage(storedName)`
- Dimensions obtained via `image-size` package
- Scaled to fit within page width and maxHeight=350
- Border drawn around image
- Page-break check before embedding (`checkPageBreak`)

## Known PDF Pitfalls

- **₹ rendering**: Requires Noto Sans fonts installed on server. Without them, ₹ shows as blank.
- **Image overlap**: `doc.y` must be manually advanced after `doc.image()` — pdfkit does not auto-advance.
- **Page breaks**: Must call `checkPageBreak(doc, neededHeight)` before content blocks.
- **Large images**: Scaled down proportionally. Max rendered height: 350px.
- **PDF evidence files**: Not embedded — shown as "[PDF document — refer to original file]".
- **Footer placement**: Must not hardcode `doc.page.height - 60` — use `doc.y` position after content.
