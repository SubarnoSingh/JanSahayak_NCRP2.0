import mongoose, { Schema, type Document, type Model } from "mongoose";

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

export interface ITransaction {
  utr?: string;
  amount?: number;
  currency?: string;
  timestamp?: string;
  senderBank?: string;
  senderAccount?: string;
  beneficiaryVpa?: string;
  beneficiaryAccount?: string;
  method?: string;
  source: "citizen" | "ai_vision" | "ai_text" | "sms_parse";
  verifiedByCitizen?: boolean;
}

export interface ISuspectIdentifier {
  type: "phone" | "upi" | "url" | "social" | "email" | "wallet" | "ip" | "other";
  value: string;
  context?: string;
}

export interface IEvidenceMeta {
  evidenceId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  hashVerifiedServer?: boolean;
  exifScrubbed?: boolean;
  aiExtraction?: Record<string, unknown> | null;
  uploadedAt: Date;
}

export interface IAuditEntry {
  at?: Date;
  actor: "citizen" | "system" | "ai" | "officer";
  action: string;
  detail?: string;
}

export interface IStatusEvent {
  status: IncidentStatus;
  label: string;
  at?: Date;
  note?: string;
}

export interface ISignature {
  provider: "epramaan_mock";
  method: "aadhaar_otp_demo" | "demo";
  aadhaarVirtualIdMasked?: string;
  artifact: string;
  signedHash: string;
  signedAt: Date;
}

export interface IIncident extends Document {
  acknowledgementNumber: string;
  incident_category: IncidentCategory;
  categoryConfidence?: number;
  categorySource?: "citizen" | "ai" | "citizen_confirmed";
  language?: string;
  narrative_raw: string;
  narrative_summary?: string;
  financial_transactions: ITransaction[];
  suspect_identifiers: ISuspectIdentifier[];
  bns_sections_mapped: { section: string; title: string; rationale: string }[];
  statutory_readiness_score: number;
  readiness_breakdown: { field: string; label: string; present: boolean }[];
  evidence: IEvidenceMeta[];
  anonymousMode: boolean;
  citizenContact?: {
    fullName?: string;
    phone?: string;
    email?: string;
    state?: string;
    district?: string;
  };
  signature_status: "pending" | "signed";
  signature?: ISignature;
  status: IncidentStatus;
  statusHistory: IStatusEvent[];
  goldenHour?: {
    startedAt: Date;
    windowMinutes: number;
    bankNotifiedAt?: Date;
    holdRequestedAt?: Date;
    freezeConfirmedAt?: Date;
  };
  moneyTrail?: {
    nodes: { id: string; label: string; bank?: string; accountMasked?: string; vpa?: string; amount?: number; at?: string; status: string }[];
    edges: { from: string; to: string; amount?: number; utr?: string; channel?: string }[];
  };
  audit_trail: IAuditEntry[];
  acknowledgementIssuedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    utr: String,
    amount: Number,
    currency: { type: String, default: "INR" },
    timestamp: String,
    senderBank: String,
    senderAccount: String,
    beneficiaryVpa: String,
    beneficiaryAccount: String,
    method: String,
    source: { type: String, enum: ["citizen", "ai_vision", "ai_text", "sms_parse"], required: true },
    verifiedByCitizen: Boolean,
  },
  { _id: false }
);

const SuspectIdentifierSchema = new Schema<ISuspectIdentifier>(
  { type: { type: String, required: true }, value: { type: String, required: true }, context: String },
  { _id: false }
);

const EvidenceSchema = new Schema<IEvidenceMeta>(
  {
    evidenceId: { type: String, required: true },
    originalName: String,
    storedName: String,
    mimeType: String,
    sizeBytes: Number,
    sha256: { type: String, required: true },
    hashVerifiedServer: Boolean,
    exifScrubbed: Boolean,
    aiExtraction: Schema.Types.Mixed,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AuditSchema = new Schema<IAuditEntry>(
  { at: { type: Date, default: Date.now }, actor: String, action: String, detail: String },
  { _id: false }
);

const StatusEventSchema = new Schema<IStatusEvent>(
  { status: String, label: String, at: { type: Date, default: Date.now }, note: String },
  { _id: false }
);

const MoneyTrailSchema = new Schema(
  {
    nodes: [{ id: String, label: String, bank: String, accountMasked: String, vpa: String, amount: Number, at: String, status: String }],
    edges: [{ from: String, to: String, amount: Number, utr: String, channel: String }],
  },
  { _id: false }
);

const IncidentSchema = new Schema<IIncident>(
  {
    acknowledgementNumber: { type: String, unique: true, sparse: true, index: true },
    incident_category: { type: String, index: true, required: true },
    categoryConfidence: Number,
    categorySource: String,
    language: { type: String, default: "en" },
    narrative_raw: { type: String, required: true },
    narrative_summary: String,
    financial_transactions: [TransactionSchema],
    suspect_identifiers: [SuspectIdentifierSchema],
    bns_sections_mapped: [{ section: String, title: String, rationale: String }],
    statutory_readiness_score: { type: Number, default: 0 },
    readiness_breakdown: [{ field: String, label: String, present: Boolean }],
    evidence: [EvidenceSchema],
    anonymousMode: { type: Boolean, default: false },
    citizenContact: {
      fullName: String,
      phone: String,
      email: String,
      state: String,
      district: String,
    },
    signature_status: { type: String, enum: ["pending", "signed"], default: "pending", index: true },
    signature: {
      provider: String,
      method: String,
      aadhaarVirtualIdMasked: String,
      artifact: String,
      signedHash: String,
      signedAt: Date,
    },
    status: { type: String, index: true, default: "draft" },
    statusHistory: [StatusEventSchema],
    goldenHour: {
      startedAt: Date,
      windowMinutes: { type: Number, default: 120 },
      bankNotifiedAt: Date,
      holdRequestedAt: Date,
      freezeConfirmedAt: Date,
    },
    moneyTrail: MoneyTrailSchema,
    audit_trail: [AuditSchema],
    acknowledgementIssuedAt: Date,
  },
  { timestamps: true }
);

IncidentSchema.index({ status: 1, createdAt: -1 });

export const Incident: Model<IIncident> =
  mongoose.models.Incident || mongoose.model<IIncident>("Incident", IncidentSchema);
