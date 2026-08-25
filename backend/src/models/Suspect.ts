import mongoose, { Schema, type Document, type Model } from "mongoose";

export type SuspectType = "phone" | "upi" | "url" | "social" | "email" | "wallet" | "ip" | "other";

export interface ISuspect extends Document {
  identifier: string;
  normalizedIdentifier: string;
  type: SuspectType;
  reportCount: number;
  categories: string[];
  firstReportedAt: Date;
  lastReportedAt: Date;
  status: "active" | "monitoring" | "action_taken" | "flagged";
  recentActivity: {
    at: Date;
    category?: string;
    note?: string;
  }[];
  sourceReports: string[];
}

const SuspectSchema = new Schema<ISuspect>({
  identifier: { type: String, required: true },
  normalizedIdentifier: { type: String, required: true, unique: true, index: true, sparse: true },
  type: { type: String, required: true, index: true },
  reportCount: { type: Number, default: 0 },
  categories: [String],
  firstReportedAt: { type: Date, default: Date.now },
  lastReportedAt: { type: Date, default: Date.now },
  status: { type: String, default: "active", index: true },
  recentActivity: [{ at: Date, category: String, note: String }],
  sourceReports: [String],
});

export const Suspect: Model<ISuspect> =
  mongoose.models.Suspect || mongoose.model<ISuspect>("Suspect", SuspectSchema);
