import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IResource extends Document {
  slug: string;
  title: string;
  titleHi?: string;
  category: "guide" | "trending" | "alert";
  scamType?: string;
  summary: string;
  summaryHi?: string;
  body: string;
  readMinutes: number;
  trending?: boolean;
  tags: string[];
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  titleHi: String,
  category: { type: String, enum: ["guide", "trending", "alert"], index: true },
  scamType: String,
  summary: { type: String, required: true },
  summaryHi: String,
  body: { type: String, required: true },
  readMinutes: { type: Number, default: 3 },
  trending: { type: Boolean, default: false },
  tags: [String],
  updatedAt: { type: Date, default: Date.now },
});

export const Resource: Model<IResource> =
  mongoose.models.Resource || mongoose.model<IResource>("Resource", ResourceSchema);
