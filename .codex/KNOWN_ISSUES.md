# KNOWN_ISSUES.md — Pitfalls & Past Bugs

## 1. UTR Extraction vs. Persistence

**Problem**: UTR extracted by AI/heuristic but lost when navigating between steps.
**Root cause**: Extracted data stored only in React state, not persisted to backend.
**Correct implementation**: PATCH `/api/incidents/:id` with `transaction` field before advancing to next step.
**What NOT to do**: Never keep extracted UTR/amount/VPA only in component state. Always persist.

## 2. Transaction Merge Logic

**Problem**: Overwriting citizen-entered values with AI-extracted values.
**Root cause**: Simple replace instead of merge.
**Correct implementation**: Backend `updateIncident` merges into existing transaction — citizen source takes priority over AI source.
**What NOT to do**: Never blindly replace `financial_transactions[0]`. Use the merge logic in `incidentController.ts`.

## 3. PDF ₹ (U+20B9) Rendering

**Problem**: ₹ symbol shows as blank or box in generated PDFs.
**Root cause**: Helvetica font does not include ₹ glyph.
**Correct implementation**: Noto Sans fonts registered via `registerNoto()`. Requires fonts at `/usr/share/fonts/noto/`.
**What NOT to do**: Never assume Helvetica renders ₹. Always use `F(weight)` helper for font selection.

## 4. PDF Evidence Image Overlap

**Problem**: Evidence images in dossier PDF overlap with subsequent text.
**Root cause**: `doc.image()` does not auto-advance `doc.y`.
**Correct implementation**: After placing image, manually advance: `doc.y = imgY + renderedHeight + 8`.
**What NOT to do**: Never add content after `doc.image()` without advancing `doc.y` first.

## 5. PDF Footer Placement

**Problem**: Footer text overlaps with content on long pages.
**Root cause**: Footer placed at hardcoded `doc.page.height - 60`.
**Correct implementation**: Place footer after content using `doc.y` position, with page-break check.
**What NOT to do**: Never hardcode footer Y position.

## 6. Speech Recognition Network Error

**Problem**: Web Speech API fires `network` error even with internet connection.
**Root cause**: Google's speech servers may be unreachable in some Indian network environments.
**Correct implementation**: MediaRecorder fallback → records audio → POST `/api/speech/transcribe`.
**What NOT to do**: Never show "no internet" as the only error message. Always offer fallback.

## 7. Evidence Hash Mismatch

**Problem**: Client hash and server hash don't match after upload.
**Root cause**: File corruption during upload, or browser modified the file.
**Correct implementation**: Return 409 `HASH_MISMATCH` error. File not persisted.
**What NOT to do**: Never silently accept mismatched hashes.

## 8. Anonymous Mode + Contact Info

**Problem**: Citizen enters contact info then enables anonymous mode.
**Root cause**: No validation that anonymous mode clears contact info.
**Correct implementation**: Backend skips storing `citizenContact` when `anonymousMode: true`. UI warns that follow-up becomes impossible.
**What NOT to do**: Never store contact info when anonymous mode is active.

## 9. Socket.io Connection Path

**Problem**: Frontend Socket.io client cannot connect to backend.
**Root cause**: Mismatched path configuration.
**Correct implementation**: Both use path `/ws`. Backend: `new SocketServer(server, { path: "/ws" })`. Frontend: `io(API_URL, { path: "/ws" })`.
**What NOT to do**: Never change Socket.io path in one place without updating the other.

## 10. Incident State Between Wizard Steps

**Problem**: Wizard loses state on page refresh or navigation.
**Root cause**: No persistence mechanism for intermediate wizard state.
**Correct implementation**: Each step persists to backend via API. On reload, fetch incident by ID.
**What NOT to do**: Never assume wizard state survives page refresh without backend persistence.

## 11. Evidence File Serving (Officer)

**Problem**: Officer cannot view evidence files.
**Root cause**: Wrong content-type or file path.
**Correct implementation**: `GET /api/officer/incidents/:id/evidence/:eid/file` reads from disk, serves with original MIME type.
**What NOT to do**: Never serve evidence files without officer authentication.

## 12. Dossier PDF Large Images

**Problem**: Very large evidence images cause PDF rendering issues or huge file sizes.
**Root cause**: No image size limiting before embedding.
**Correct implementation**: Scale images to fit within page width and maxHeight=350 using `image-size` package for dimensions.
**What NOT to do**: Never embed original-resolution images without scaling.

## 13. i18n Missing Keys

**Problem**: UI shows raw key strings (e.g., `hero.title`) instead of translated text.
**Root cause**: Key missing from non-English locale file.
**Correct implementation**: i18n system falls back to English for missing keys. Partial locales are expected.
**What NOT to do**: Never assume all keys exist in all locale files.

## 14. Config Validation Startup Errors

**Problem**: Server crashes on startup with missing environment variables.
**Root cause**: `validateEnvironment()` throws on required missing vars.
**Correct implementation**: Copy `backend/.env.example` to `backend/.env` before starting. Check console output for `[env]` messages.
**What NOT to do**: Never bypass `validateEnvironment()`.
