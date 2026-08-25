import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IVolunteer extends Document {
  fullName: string;
  email: string;
  phone?: string;
  state: string;
  languages: string[];
  interests: string[];
  status: "applied" | "shortlisted" | "active";
  createdAt: Date;
}

const VolunteerSchema = new Schema<IVolunteer>({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  state: { type: String, required: true },
  languages: [String],
  interests: [String],
  status: { type: String, enum: ["applied", "shortlisted", "active"], default: "applied" },
  createdAt: { type: Date, default: Date.now },
});

export const Volunteer: Model<IVolunteer> =
  mongoose.models.Volunteer || mongoose.model<IVolunteer>("Volunteer", VolunteerSchema);
