import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IOfficer extends Document {
  email: string;
  name: string;
  rank: string;
  unit: string;
  passwordHash: string;
}

const OfficerSchema = new Schema<IOfficer>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  rank: { type: String, default: "Inspector" },
  unit: { type: String, default: "Cyber Police Station — Demo Range" },
  passwordHash: { type: String, required: true },
});

export const Officer: Model<IOfficer> =
  mongoose.models.Officer || mongoose.model<IOfficer>("Officer", OfficerSchema);
