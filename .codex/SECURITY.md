# SECURITY.md — Security Constraints

## Authentication

### Officer Authentication
- **Method**: JWT (JSON Web Token)
- **Secret**: `JWT_SECRET` environment variable
- **Expiry**: 8 hours
- **Header**: `Authorization: Bearer <token>`
- **Demo password**: Compared as plaintext against env var (demo-only — not production-safe)
- **File**: `backend/src/middleware/officerAuth.ts`

### Citizen Authentication
- **None required** — complaints can be filed anonymously or with contact info
- **No login system** for citizens
- **Tracking**: By ACK number only (no user account)

## Environment Variables — NEVER Commit

**DO NOT** place actual values in `.codex/` files, source code, or commits:

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | JWT signing secret |
| `OPENAI_API_KEY` | OpenAI API key for GPT classification/vision |
| `BHASHINI_API_KEY` | Bhashini translation API key |
| `WHISPER_API_KEY` | Whisper speech-to-text API key |
| `MONGODB_URI` | Database connection string (may contain credentials) |
| `OFFICER_DEMO_PASSWORD` | Demo officer password |

Store these only in `backend/.env` (git-ignored via `.gitignore`).

## File Upload Security

- **Size limit**: 10MB per file (configurable via `MAX_UPLOAD_MB`)
- **File count limit**: 6 files per upload
- **MIME validation**: Checked via `mimeAllowed()` in `evidenceService.ts`
- **Extension validation**: Checked via regex in `upload.ts`
- **Storage**: Memory storage (Multer) → written to disk after processing
- **EXIF scrubbing**: GPS/device metadata stripped from JPEG/PNG before storage

## Evidence Integrity

- **Client-side SHA-256**: Computed in browser via Web Crypto API before upload
- **Server-side re-verification**: Hash recomputed after upload, compared with client hash
- **Hash mismatch**: Returns 409 error, file not persisted
- **Immutable record**: Hash stored in `incident.evidence[].sha256`

## Rate Limiting

- **API rate limit**: 120 requests per minute per IP
- **Applied to**: All `/api` routes
- **Error response**: `{ error: { code: "RATE_LIMITED", message: "..." } }`

## CORS

- **Production**: Only `CORS_ORIGIN` allowed
- **Development**: All origins allowed (`origin: true`)
- **Methods**: GET, POST, PATCH, OPTIONS

## HTTP Security Headers (Helmet)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Cross-Origin-Resource-Policy: cross-origin`

## Frontend Security Headers (next.config.mjs)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(self), geolocation=()`
- Content-Security-Policy (restricted)

## PII Handling

- **Complaint data**: Stored in MongoDB, accessible only via API
- **Evidence files**: Stored on disk, served only to authenticated officers
- **Anonymous mode**: `citizenContact` omitted from storage
- **Suspect identifiers**: Stored normalized + partially redacted
- **No tracking cookies**: Only essential session cookies
- **No analytics**: No third-party tracking

## Input Validation

- **Zod schemas**: All API inputs validated via `backend/src/validators/index.ts`
- **Narrative length**: 10–8000 characters
- **Amount limits**: 0–100,000,000 INR
- **Email validation**: Standard email format
- **OTP format**: Exactly 6 digits

## Known Security Limitations (Demo)

- **Officer password**: Compared as plaintext (demo only — not production-safe)
- **No HTTPS**: Development server uses HTTP
- **No CSRF protection**: Stateless API design mitigates this
- **No account lockout**: Demo credentials only
- **JWT secret**: Default secret in dev mode
