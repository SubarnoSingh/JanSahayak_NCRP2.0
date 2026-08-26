/**
 * Standalone seed script — wipes and re-seeds the entire database.
 * Run: npm run seed
 */
import mongoose from "mongoose";
import { config } from "./config";
import { Incident, Suspect, Resource, ScamAlert, Officer } from "./models";
import { autoSeed } from "./services/autoSeed";

async function seed(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  console.log("[seed] connected — wiping existing data...");

  await Promise.all([
    Incident.deleteMany({}),
    Suspect.deleteMany({}),
    Resource.deleteMany({}),
    ScamAlert.deleteMany({}),
    Officer.deleteMany({}),
  ]);

  await autoSeed();
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
