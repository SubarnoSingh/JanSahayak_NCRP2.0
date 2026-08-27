# SHA-256 Usage

Where the SHA-256 algorithm is used in the codebase and what each use protects.

## Summary

| # | Location | Purpose | Mode |
|---|----------|---------|------|
| 1 | `frontend/src/lib/hash.ts` | Client-side evidence fingerprint (Web Crypto) | plain SHA-256 |
| 2 | `backend/src/services/evidenceService.ts` | Server-side evidence re-hash + verification | plain SHA-256 |
| 3 | `backend/src/controllers/incidentController.ts` | Wire-up of hash mismatch check on upload | plain SHA-256 |
| 4 | `backend/src/integrations/epramaan.ts` | Mock digital-signature artifact over the complaint hash | HMAC-SHA256 |
| 5 | `backend/src/integrations/cfcfrms.ts` | Deterministic PRNG seed for mock money-trace | plain SHA-256 |

---

## 1. Client-side evidence fingerprint — `frontend/src/lib/hash.ts`

Computed in the browser via the Web Crypto API **before any bytes leave the device** — integrity evidence travels with the file.

```ts
export async function sha256Hex(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

Consumed in `frontend/src/components/report/StepEvidence.tsx:83` during the multi-file upload flow; the hash is sent alongside each file (`fd.append("sha256", hash)` at `StepEvidence.tsx:94`) so the server can cross-check it.

---

## 2. Server-side re-hash & verification — `backend/src/services/evidenceService.ts`

The server recomputes the SHA-256 of the received buffer and, when the client supplied a hash, compares them to prove the file was not altered in transit.

```ts
export function sha256Buffer(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function evidenceHashOk(received: Buffer, clientHash: string): boolean {
  if (!clientHash) return true; // hash optional
  return sha256Buffer(received).toLowerCase() === clientHash.toLowerCase();
}
```

---

## 3. Upload wire-up & mismatch rejection — `backend/src/controllers/incidentController.ts`

`addEvidence` (line 129) runs the verification; a mismatch mid-upload aborts with HTTP 409 `HASH_MISMATCH` and the file is never persisted. The server-computed hash is stored on the incident evidence record for the immutable audit trail.

```ts
const verified = clientHash ? evidenceHashOk(buffer, String(clientHash)) : undefined;
if (clientHash && verified === false) {
  res.status(409).json({
    error: { code: "HASH_MISMATCH", message: `${f.originalname}: the file changed during upload. Please re-add this file.` },
  });
  return;
}
...
sha256: sha256Buffer(buffer),        // stored on incident.evidence[]
hashVerifiedServer: verified,
```

---

## 4. Digital signature artifact — `backend/src/integrations/epramaan.ts`

In mock e-Pramaan mode the "signature" is an **HMAC-SHA256** over the challenge + complaint payload hash, keyed by `config.jwtSecret`. It binds the OTP challenge to the exact complaint payload (`computePayloadHash` in `backend/src/services/incidentService.ts`), so any later payload change invalidates the signature.

```ts
const artifact = crypto
  .createHmac("sha256", config.jwtSecret)
  .update(`${input.challengeId}:${input.complaintPayloadHash}`)
  .digest("hex");
```

The payload hash it signs comes from `backend/src/services/incidentService.ts:28`:

```ts
export function computePayloadHash(incident: Partial<IIncident>): string {
  const canonical = JSON.stringify({
    narrative: incident.narrative_raw,
    category: incident.incident_category,
    txns: incident.financial_transactions,
    suspects: incident.suspect_identifiers,
    evidence: incident.evidence?.map((e) => e.sha256),
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}
```

---

## 5. Deterministic mock money-trace seeding — `backend/src/integrations/cfcfrms.ts`

SHA-256 seeds a small PRNG so the simulated CFCFRMS money trail is stable and reproducible for a given case (same UTR/VPA/amount → same trail) instead of being random on every call.

```ts
function seededRandom(seed: string): () => number {
  const hash = crypto.createHash("sha256").update(seed).digest();
  let state = hash.readUInt32BE(0) || 1;
  return () => { /* xorshift PRNG over `state` */ };
}
```

---

## Supporting references (no implementation)

- `backend/src/models/Incident.ts:147` — `sha256` stored as a required `String` on each evidence entry.
- `backend/src/services/autoSeed.ts:400` — sha256 of a zero-length buffer used in seed/demo data.
- `frontend/src/lib/types.ts:46` — `sha256: string` in the shared frontend types.
- `backend/src/services/pdfService.ts:216,361` — prints SHA-256 into the FIR/summary PDFs.
- Frontend displays: `StepReview.tsx:76`, `StepEvidence.tsx:390`, `hq/page.tsx:320`.
- Policy copy: `app/help/page.tsx:73`, `app/terms/page.tsx:40`, `app/privacy/page.tsx:41`.