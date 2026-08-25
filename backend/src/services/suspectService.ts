/**
 * Suspect repository service — normalize, search, aggregate.
 */
import { Suspect, type ISuspect } from "../models/Suspect";
import type { ISuspectIdentifier } from "../models/Incident";
import type { SuspectType } from "../models/Suspect";

export function normalizeIdentifier(raw: string): { type: SuspectType; normalized: string } | null {
  const value = raw.trim();
  if (!value) return null;

  // UPI VPA
  const vpa = value.match(/^[\w.-]{2,}@(?:ok(?:axis|hdfcbank|icici|sbi|biz)|paytm|ybl|pay|upi|apl|ibl|ib)$/i);
  if (vpa) return { type: "upi", normalized: value.toLowerCase() };

  // URL
  if (/^(https?:\/\/|www\.)/i.test(value)) return { type: "url", normalized: value.toLowerCase() };

  // Phone (Indian)
  const digits = value.replace(/\D/g, "");
  if (/^((0|91)?[6-9]\d{9})$/.test(digits)) {
    const last10 = digits.slice(-10);
    return { type: "phone", normalized: `+91-${last10}` };
  }
  if (/^\d{15}$/.test(digits) && value.toLowerCase().includes("imei")) {
    return { type: "other", normalized: `IMEI:${digits}` };
  }

  // Email
  if (/^[\w.+-]+@[\w-]+\.[\w.]{2,}$/.test(value)) return { type: "email", normalized: value.toLowerCase() };

  // Social handle
  if (/^@[\w.]{3,30}$/.test(value)) return { type: "social", normalized: value.toLowerCase() };

  // Crypto wallet
  if (/^(0x[a-fA-F0-9]{40}|bc1[a-z0-9]{20,})$/.test(value)) return { type: "wallet", normalized: value.toLowerCase() };

  return { type: "other", normalized: value };
}

export async function searchSuspects(query: {
  identifier?: string;
  limit?: number;
}): Promise<{ results: Partial<ISuspect>[]; query: unknown }> {
  if (!query.identifier) {
    const recent = await Suspect.find().sort({ lastReportedAt: -1 }).limit(8).lean();
    return { results: recent.map(redact), query };
  }
  const norm = normalizeIdentifier(query.identifier);
  if (!norm) return { results: [], query };

  const variants = [norm.normalized];
  if (norm.type === "phone") {
    const d = norm.normalized.replace(/\D/g, "").slice(-10);
    variants.push(d, `+91-${d}`, `91${d}`, `0${d}`);
  }
  const docs = await Suspect.find({ normalizedIdentifier: { $in: variants } })
    .sort({ reportCount: -1 })
    .limit(query.limit ?? 5)
    .lean();
  return { results: docs.map(redact), query: { identifier: norm.normalized, type: norm.type } };
}

/** Never expose full account numbers or raw personal data. */
function redact(doc: ISuspect | (Record<string, unknown> & { identifier: string; normalizedIdentifier: string; type: SuspectType; reportCount: number; categories: string[]; firstReportedAt?: Date; lastReportedAt?: Date; status: string; recentActivity: unknown[] })): Record<string, unknown> {
  return {
    identifier: doc.identifier,
    normalizedIdentifier: doc.normalizedIdentifier,
    type: doc.type,
    reportCount: doc.reportCount,
    categories: doc.categories,
    firstReportedAt: doc.firstReportedAt,
    lastReportedAt: doc.lastReportedAt,
    status: doc.status,
    recentActivity: (doc.recentActivity ?? []).slice(-3),
  };
}

export async function reportSuspect(input: {
  rawIdentifier: string;
  category?: string;
  note?: string;
  reporterContact?: string;
}): Promise<ISuspect> {
  const norm = normalizeIdentifier(input.rawIdentifier);
  if (!norm) throw new Error("Could not interpret the identifier.");

  const existing = await Suspect.findOne({ normalizedIdentifier: norm.normalized });
  if (existing) {
    existing.reportCount += 1;
    existing.lastReportedAt = new Date();
    if (input.category && !existing.categories.includes(input.category)) existing.categories.push(input.category);
    existing.recentActivity.push({ at: new Date(), category: input.category, note: input.note?.slice(0, 200) });
    await existing.save();
    return existing;
  }
  return Suspect.create({
    identifier: input.rawIdentifier.trim(),
    normalizedIdentifier: norm.normalized,
    type: norm.type,
    reportCount: 1,
    categories: input.category ? [input.category] : [],
    status: "active",
    recentActivity: [{ at: new Date(), category: input.category, note: input.note?.slice(0, 200) }],
  });
}

export async function upsertSuspectFromIdentifiers(
  identifiers: ISuspectIdentifier[],
  category: string,
  ackNumber: string
): Promise<void> {
  for (const idf of identifiers.slice(0, 20)) {
    try {
      await reportSuspect({
        rawIdentifier: idf.value,
        category,
        note: `Linked to complaint ${ackNumber}`,
      });
    } catch {
      /* continue */
    }
  }
}
