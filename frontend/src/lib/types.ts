export type IncidentCategory =
  | "financial_fraud"
  | "harassment_extortion"
  | "women_child_safety"
  | "other_cyber_crime";

export type IncidentStatus =
  | "draft"
  | "signed"
  | "submitted"
  | "verified"
  | "assigned"
  | "investigation"
  | "fir_registered"
  | "closed";

export interface Transaction {
  utr?: string;
  amount?: number;
  currency?: string;
  timestamp?: string;
  senderBank?: string;
  beneficiaryVpa?: string;
  method?: string;
  source: "citizen" | "ai_vision" | "ai_text" | "sms_parse";
  verifiedByCitizen?: boolean;
}

export interface SuspectIdentifier {
  type: string;
  value: string;
  context?: string;
}

export interface ReadinessField {
  field: string;
  label: string;
  present: boolean;
}

export interface EvidenceMeta {
  evidenceId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  hashVerifiedServer?: boolean;
  exifScrubbed?: boolean;
  hasAiExtraction?: boolean;
  uploadedAt?: string;
}

export interface BnsSection {
  section: string;
  title: string;
  rationale: string;
}

export interface Incident {
  id: string;
  acknowledgementNumber?: string;
  incident_category: IncidentCategory;
  categoryConfidence?: number;
  categorySource?: "citizen" | "ai" | "citizen_confirmed";
  narrative_raw: string;
  narrative_summary?: string;
  financial_transactions: Transaction[];
  suspect_identifiers: SuspectIdentifier[];
  bns_sections_mapped: BnsSection[];
  statutory_readiness_score: number;
  readiness_breakdown: ReadinessField[];
  evidenceCount: number;
  evidence: EvidenceMeta[];
  anonymousMode: boolean;
  citizenContact?: {
    fullName?: string;
    phone?: string;
    email?: string;
    state?: string;
    district?: string;
  } | null;
  signature_status: "pending" | "signed";
  status: IncidentStatus;
}

export interface TrackStatusEvent {
  status: IncidentStatus;
  label: string;
  at: string;
  note?: string;
}

export interface TrackedComplaint {
  acknowledgementNumber: string;
  category: IncidentCategory;
  status: IncidentStatus;
  statusHistory: TrackStatusEvent[];
  flow: { status: IncidentStatus; label: string; citizenLabel: string }[];
  submittedAt: string;
  lastUpdate: string;
  goldenHourActive: boolean;
  evidenceCount: number;
  anonymousMode: boolean;
}

export interface SuspectResult {
  identifier: string;
  normalizedIdentifier: string;
  type: string;
  reportCount: number;
  categories: string[];
  firstReportedAt?: string;
  lastReportedAt?: string;
  status: string;
  recentActivity: { at: string; category?: string; note?: string }[];
}

export interface Resource {
  slug: string;
  title: string;
  titleHi?: string;
  category: "guide" | "trending" | "alert";
  scamType?: string;
  summary: string;
  summaryHi?: string;
  body: string;
  readMinutes: number;
  trending: boolean;
  tags: string[];
}

export interface ScamAlert {
  title: string;
  severity: "info" | "warning" | "critical";
  region?: string;
  summary: string;
  publishedAt: string;
}

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  financial_fraud: "Financial fraud",
  harassment_extortion: "Cyber harassment / extortion",
  women_child_safety: "Women & child safety",
  other_cyber_crime: "Other cyber crime",
};

export const STATUS_META: Record<string, { label: string; tone: "ok" | "info" | "warn" | "neutral" }> = {
  draft: { label: "Draft", tone: "neutral" },
  signed: { label: "Signed", tone: "info" },
  submitted: { label: "Submitted", tone: "info" },
  verified: { label: "Verified", tone: "ok" },
  assigned: { label: "Assigned", tone: "info" },
  investigation: { label: "Under investigation", tone: "warn" },
  fir_registered: { label: "FIR registered", tone: "ok" },
  closed: { label: "Closed", tone: "neutral" },
};
