import { z } from "zod";
import { isProd } from "../config";

export const createIncidentSchema = z.object({
  narrative: z.string().trim().min(10, "Please describe what happened (at least a sentence).").max(8000),
  category: z.enum(["financial_fraud", "harassment_extortion", "women_child_safety", "other_cyber_crime"]).optional(),
  language: z.string().max(8).default("en"),
  anonymousMode: z.boolean().default(false),
});

export const updateIncidentSchema = z.object({
  narrative: z.string().trim().min(10).max(8000).optional(),
  category: z.enum(["financial_fraud", "harassment_extortion", "women_child_safety", "other_cyber_crime"]).optional(),
  categoryConfirmedByCitizen: z.boolean().optional(),
  anonymousMode: z.boolean().optional(),
  transaction: z
    .object({
      utr: z.string().regex(/^\d{12}$/).optional().or(z.literal("")),
      amount: z.number().positive().max(100_000_000).optional(),
      timestamp: z.string().max(64).optional(),
      senderBank: z.string().max(80).optional(),
      beneficiaryVpa: z.string().max(120).optional(),
      method: z.string().max(40).optional(),
    })
    .optional(),
  suspectIdentifiers: z.array(z.object({ type: z.string(), value: z.string().min(2).max(300), context: z.string().optional() })).max(30).optional(),
  citizenContact: z
    .object({
      fullName: z.string().max(120).optional(),
      phone: z.string().max(20).optional(),
      email: z.string().email().optional().or(z.literal("")),
      state: z.string().max(60).optional(),
      district: z.string().max(60).optional(),
    })
    .optional(),
});

export const signChallengeSchema = z.object({
  virtualId: z.string().min(12).max(24),
});

export const signCompleteSchema = z.object({
  challengeId: z.string().min(6),
  otp: z.string().regex(/^\d{6}$/),
});

export const suspectSearchSchema = z.object({
  identifier: z.string().trim().max(200).optional(),
});

export const suspectReportSchema = z.object({
  identifier: z.string().trim().min(3, "Enter a phone number, UPI ID, URL or handle.").max(200),
  category: z.string().max(60).optional(),
  note: z.string().max(500).optional(),
});

export const volunteerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal("")),
  state: z.string().trim().min(2).max(60),
  languages: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
});

export const transcribeSchema = z.object({
  language: z.string().max(8).default("hi"),
});

/**
 * Builds a 422 error body from a Zod failure.
 * - Bare Zod "Required" is humanized (e.g. "Narrative is required.") so the UI
 *   never shows a cryptic fieldless message.
 * - Development only: per-field details are returned AND logged server-side.
 */
export function validationError(scope: string, error: z.ZodError): { message: string; fields?: { field: string; message: string }[] } {
  const fields = error.issues.map((i) => ({
    field: i.path.length > 0 ? i.path.join(".") : "(body)",
    message: i.message,
  }));
  const first = error.issues[0];
  let message = first?.message ?? "Invalid input.";
  if (first && first.message === "Required") {
    const label = first.path.length > 0 ? String(first.path[0]) : "request body";
    message = `${label.charAt(0).toUpperCase()}${label.slice(1)} is required.`;
  }
  if (!isProd) {
    console.warn(`[validate] ${scope} rejected → ${fields.map((f) => `${f.field}: ${f.message}`).join("; ")}`);
    return { message, fields };
  }
  return { message };
}
