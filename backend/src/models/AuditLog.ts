import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAuditLog extends Document {
  entity: "incident" | "suspect" | "officer" | "system";
  entityId?: string;
  actor: string;
  action: string;
  detail?: Record<string, unknown>;
  at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  entity: { type: String, required: true, index: true },
  entityId: String,
  actor: { type: String, required: true },
  action: { type: String, required: true },
  detail: Schema.Types.Mixed,
  at: { type: Date, default: Date.now },
});

AuditLogSchema.index({ at: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
