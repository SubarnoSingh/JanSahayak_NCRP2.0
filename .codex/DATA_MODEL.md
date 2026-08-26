# DATA_MODEL.md — Database Schemas

All models defined in `backend/src/models/`.

## Incident (Core Complaint)

**File**: `backend/src/models/Incident.ts`
**Collection**: `incidents`

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `acknowledgementNumber` | String | No | — | Unique, sparse. Format: `NCRP-YYYY-XXXXXX` |
| `incident_category` | String (enum) | Yes | — | `financial_fraud` \| `harassment_extortion` \| `women_child_safety` \| `other_cyber_crime` |
| `categoryConfidence` | Number | No | — | 0–1, AI confidence score |
| `categorySource` | String | No | — | `citizen` \| `ai` \| `citizen_confirmed` |
| `language` | String | No | `"en"` | ISO language code |
| `narrative_raw` | String | Yes | — | Citizen's original description (10–8000 chars) |
| `narrative_summary` | String | No | — | AI-generated English summary |
| `financial_transactions` | Array\<ITransaction\> | No | `[]` | See ITransaction below |
| `suspect_identifiers` | Array\<ISuspectIdentifier\> | No | `[]` | See ISuspectIdentifier below |
| `bns_sections_mapped` | Array | No | `[]` | `{ section, title, rationale }` |
| `statutory_readiness_score` | Number | No | `0` | 0–100 percentage |
| `readiness_breakdown` | Array | No | `[]` | `{ field, label, present }` |
| `evidence` | Array\<IEvidenceMeta\> | No | `[]` | See IEvidenceMeta below |
| `anonymousMode` | Boolean | No | `false` | Anonymous filing flag |
| `citizenContact` | Object | No | — | `{ fullName?, phone?, email?, state?, district? }` |
| `signature_status` | String (enum) | No | `"pending"` | `pending` \| `signed` |
| `signature` | Object | No | — | See ISignature below |
| `status` | String (enum) | No | `"draft"` | See status flow below |
| `statusHistory` | Array\<IStatusEvent\> | No | `[]` | All status transitions |
| `goldenHour` | Object | No | — | `{ startedAt, windowMinutes(120), bankNotifiedAt?, holdRequestedAt?, freezeConfirmedAt? }` |
| `moneyTrail` | Object | No | — | `{ nodes[], edges[] }` — CFCFRMS trace result |
| `audit_trail` | Array\<IAuditEntry\> | No | `[]` | Immutable action log |
| `acknowledgementIssuedAt` | Date | No | — | When ACK was generated |
| `createdAt` / `updatedAt` | Date | Auto | — | Mongoose timestamps |

### ITransaction
```typescript
{
  utr?: string;              // 12-digit UTR/RRN
  amount?: number;           // INR amount
  currency?: string;         // Default "INR"
  timestamp?: string;        // ISO date string
  senderBank?: string;       // Bank name
  senderAccount?: string;    // Masked account
  beneficiaryVpa?: string;   // Receiver VPA
  beneficiaryAccount?: string;
  method?: string;           // "UPI", "NEFT", etc.
  source: "citizen" | "ai_vision" | "ai_text" | "sms_parse";
  verifiedByCitizen?: boolean;
}
```

### ISuspectIdentifier
```typescript
{
  type: "phone" | "upi" | "url" | "social" | "email" | "wallet" | "ip" | "other";
  value: string;
  context?: string;          // e.g., "detected in description"
}
```

### IEvidenceMeta
```typescript
{
  evidenceId: string;        // UUID
  originalName: string;      // User's filename
  storedName: string;        // Server filename: `{incidentId}-{timestamp}-{random}{ext}`
  mimeType: string;
  sizeBytes: number;
  sha256: string;            // Server-computed hash
  hashVerifiedServer?: boolean;
  exifScrubbed?: boolean;
  aiExtraction?: Record<string, unknown> | null;  // Vision extraction result
  uploadedAt: Date;
}
```

### ISignature
```typescript
{
  provider: "epramaan_mock";
  method: "aadhaar_otp_demo" | "demo";
  aadhaarVirtualIdMasked?: string;
  artifact: string;          // Mock e-Pramaan artifact
  signedHash: string;        // SHA-256 of complaint payload
  signedAt: Date;
}
```

### Status Flow
```
draft → signed → submitted → verified → assigned → investigation → fir_registered → closed
```
Transitions validated in `backend/src/services/incidentService.ts` (`STATUS_FLOW` constant).

---

## Suspect

**File**: `backend/src/models/Suspect.ts`
**Collection**: `suspects`

| Field | Type | Required | Notes |
|---|---|---|---|
| `identifier` | String | Yes | Raw identifier as reported |
| `normalizedIdentifier` | String | Yes | Unique, indexed. Cleaned form |
| `type` | String (enum) | Yes | `phone` \| `upi` \| `url` \| `social` \| `email` \| `wallet` \| `ip` \| `other` |
| `reportCount` | Number | No | Default 0 |
| `categories` | Array\<String\> | No | Crime categories associated |
| `firstReportedAt` | Date | No | Default `Date.now` |
| `lastReportedAt` | Date | No | Default `Date.now` |
| `status` | String (enum) | No | `active` \| `monitoring` \| `action_taken` \| `flagged` |
| `recentActivity` | Array | No | `{ at, category?, note? }` |
| `sourceReports` | Array\<String\> | No | Incident IDs that reported this suspect |

---

## Resource (Learning Articles)

**File**: `backend/src/models/Resource.ts`
**Collection**: `resources`

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | String | Yes | Unique URL-safe identifier |
| `title` | String | Yes | Article title |
| `titleHi` | String | No | Hindi title |
| `category` | String (enum) | No | `guide` \| `trending` \| `alert` |
| `scamType` | String | No | Classification label |
| `summary` | String | Yes | Preview text |
| `summaryHi` | String | No | Hindi summary |
| `body` | String | Yes | Full article (Markdown) |
| `readMinutes` | Number | No | Default 3 |
| `trending` | Boolean | No | Default false. Featured on landing page |
| `tags` | Array\<String\> | No | Searchable tags |

---

## ScamAlert

**File**: `backend/src/models/ScamAlert.ts`
**Collection**: `scamalerts`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | String | Yes | Alert headline |
| `severity` | String (enum) | No | `info` \| `warning` \| `critical` |
| `region` | String | No | Geographic scope |
| `summary` | String | Yes | Description |
| `publishedAt` | Date | No | Default `Date.now` |
| `active` | Boolean | No | Default true, indexed |

---

## Officer

**File**: `backend/src/models/Officer.ts`
**Collection**: `officers`

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | String | Yes | Unique, indexed |
| `name` | String | Yes | Full name |
| `rank` | String | No | Default "Inspector" |
| `unit` | String | No | Default "Cyber Police Station — Demo Range" |
| `passwordHash` | String | Yes | Demo-only plaintext comparison |

---

## Volunteer

**File**: `backend/src/models/Volunteer.ts`
**Collection**: `volunteers`

| Field | Type | Required | Notes |
|---|---|---|---|
| `fullName` | String | Yes | |
| `email` | String | Yes | |
| `phone` | String | No | |
| `state` | String | Yes | |
| `languages` | Array\<String\> | No | |
| `interests` | Array\<String\> | No | |
| `status` | String (enum) | No | `applied` \| `shortlisted` \| `active` |

---

## AuditLog

**File**: `backend/src/models/AuditLog.ts`
**Collection**: `auditlogs`

| Field | Type | Required | Notes |
|---|---|---|---|
| `entity` | String | Yes | `incident` \| `suspect` \| `officer` \| `system` |
| `entityId` | String | No | MongoDB ObjectId of the entity |
| `actor` | String | Yes | Who performed the action |
| `action` | String | Yes | Description |
| `detail` | Mixed | No | Additional context |
| `at` | Date | No | Default `Date.now`, descending index |
