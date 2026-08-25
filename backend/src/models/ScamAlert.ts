import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IScamAlert extends Document {
  title: string;
  severity: "info" | "warning" | "critical";
  region?: string;
  summary: string;
  publishedAt: Date;
  active: boolean;
}

const ScamAlertSchema = new Schema<IScamAlert>({
  title: { type: String, required: true },
  severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
  region: String,
  summary: { type: String, required: true },
  publishedAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true, index: true },
});

export const ScamAlert: Model<IScamAlert> =
  mongoose.models.ScamAlert || mongoose.model<IScamAlert>("ScamAlert", ScamAlertSchema);
