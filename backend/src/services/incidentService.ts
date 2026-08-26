/**
 * Incident service — core complaint lifecycle business logic.
 * Controllers stay thin; all rules live here.
 */
import crypto from "crypto";
import { Incident, type IIncident, type IncidentCategory, type IncidentStatus } from "../models/Incident";
import { AuditLog } from "../models/AuditLog";
import { computeReadiness } from "./readinessService";
import { mapBnsSections } from "./bnsMapper";
import { analyzeIncident } from "./aiService";
import { upsertSuspectFromIdentifiers } from "./suspectService";
import { emitToRoom, ROOMS, EVENTS } from "./notificationService";

export const STATUS_FLOW: { status: IncidentStatus; label: string; citizenLabel: string }[] = [
  { status: "submitted", label: "Complaint submitted", citizenLabel: "Submitted" },
  { status: "verified", label: "Information verified", citizenLabel: "Information verified" },
  { status: "assigned", label: "Assigned for review", citizenLabel: "Assigned to an officer" },
  { status: "investigation", label: "Investigation initiated", citizenLabel: "Investigation in progress" },
  { status: "fir_registered", label: "FIR registered / further action", citizenLabel: "Action taken" },
];

export function generateAcknowledgementNumber(): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `NCRP-${year}-${rand}`;
}

export function computePayloadHash(incident: Partial<IIncident>): string {
  const canonical = JSON.stringify({
    narrative: incident.narrative_raw,
    category: incident.incident_category,
    txns: incident.financial_transactions,
    suspects: incident.suspect_identifiers,
    evidence: incident.evidence?.map((e) => e.sha256),
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export async function audit(
  entity: "incident" | "suspect" | "officer" | "system",
  entityId: string,
  actor: string,
  action: string,
  detail?: Record<string, unknown>
): Promise<void> {
  await AuditLog.create({ entity, entityId, actor, action, detail });
}

export async function runAiAnalysis(incidentId: string): Promise<IIncident> {
  const incident = await Incident.findById(incidentId);
  if (!incident) throw new Error("Incident not found");

  const analysis = await analyzeIncident(incident.narrative_raw);
  incident.categoryConfidence = analysis.categoryConfidence;
  incident.categorySource = "ai";
  incident.incident_category = analysis.category;
  incident.narrative_summary = analysis.narrativeSummary;
  incident.language = analysis.languageHints[0] ?? incident.language ?? "en";

  // Merge AI-extracted data — never overwrite citizen-provided values
  for (const t of analysis.transactions as Record<string, unknown>[]) {
    const existing = incident.financial_transactions.find((x) => x.utr && x.utr === (t.utr as string));
    if (!existing) {
      incident.financial_transactions.push({
        utr: (t.utr as string) || undefined,
        amount: (t.amount as number) || undefined,
        timestamp: (t.timestamp as string) || undefined,
        senderBank: (t.senderBank as string) || undefined,
        beneficiaryVpa: (t.beneficiaryVpa as string) || undefined,
        method: (t.method as string) || undefined,
        source: "ai_text",
      });
    }
  }
  for (const s of analysis.suspectIdentifiers) {
    if (!incident.suspect_identifiers.some((x) => x.value === s.value)) {
      incident.suspect_identifiers.push(s);
    }
  }

  incident.bns_sections_mapped = mapBnsSections(analysis.category, {});
  recomputeReadiness(incident);
  incident.audit_trail.push({ actor: "ai", action: "AI analysis applied", detail: `provider=${analysis.provider}, confidence=${analysis.categoryConfidence}` });
  await incident.save();
  return incident;
}

export function recomputeReadiness(incident: IIncident): void {
  const txn = incident.financial_transactions[0];
  const result = computeReadiness({
    category: incident.incident_category,
    narrative: incident.narrative_raw ?? "",
    categoryConfirmedByCitizen: incident.categorySource === "citizen_confirmed",
    transactionDetails:
      incident.incident_category === "financial_fraud"
        ? { utr: txn?.utr, amount: txn?.amount, timestamp: txn?.timestamp }
        : null,
    suspectIdentifiers: incident.suspect_identifiers,
    evidenceCount: incident.evidence.length,
    hasContact: Boolean(incident.anonymousMode) || Boolean(incident.citizenContact?.phone || incident.citizenContact?.email),
  });
  incident.statutory_readiness_score = result.score;
  incident.readiness_breakdown = result.breakdown;
}

export async function submitIncident(incidentId: string): Promise<IIncident> {
  const incident = await Incident.findById(incidentId);
  if (!incident) throw new Error("Incident not found");
  if (incident.signature_status !== "signed") throw new Error("Complaint must be digitally signed before submission.");
  if (incident.status !== "draft") throw new Error("Complaint already submitted.");

  // ── Anonymous submission: only Women & Child Safety ──
  if (incident.anonymousMode && incident.incident_category !== "women_child_safety") {
    throw Object.assign(
      new Error("Anonymous submission is only available for Women & Child Safety complaints."),
      { code: "ANONYMOUS_NOT_ALLOWED" }
    );
  }

  // ── Contact details required for non-anonymous complaints ──
  if (!incident.anonymousMode) {
    const c = incident.citizenContact;
    if (!c?.fullName?.trim() || !c?.phone?.trim() || !c?.email?.trim() || !c?.state?.trim() || !c?.district?.trim()) {
      throw Object.assign(
        new Error("Please provide your full name, mobile number, email, state and district before submitting."),
        { code: "CONTACT_REQUIRED" }
      );
    }
  }

  incident.acknowledgementNumber = generateAcknowledgementNumber();
  incident.status = "submitted";
  incident.acknowledgementIssuedAt = new Date();

  if (incident.incident_category === "financial_fraud") {
    incident.goldenHour = { startedAt: new Date(), windowMinutes: 120 };
  }
  incident.statusHistory.push({ status: "submitted", label: STATUS_FLOW[0].label });
  incident.audit_trail.push({ actor: "citizen", action: "Complaint submitted" });

  // Register suspect identifiers in the repository
  try {
    await upsertSuspectFromIdentifiers(incident.suspect_identifiers, incident.incident_category, incident.acknowledgementNumber);
  } catch {
    /* non-fatal */
  }

  await audit("incident", String(incident._id), "citizen", "submit");
  await incident.save();

  // Real-time IO notification
  const primaryTxn = incident.financial_transactions[0];
  emitToRoom(ROOMS.hq, EVENTS.incidentNew, {
    id: String(incident._id),
    acknowledgementNumber: incident.acknowledgementNumber,
    category: incident.incident_category,
    amount: primaryTxn?.amount,
    utr: primaryTxn?.utr,
    readinessScore: incident.statutory_readiness_score,
    language: incident.language,
    anonymousMode: incident.anonymousMode,
    goldenHour: incident.incident_category === "financial_fraud",
    createdAt: incident.createdAt,
    preview: (incident.narrative_raw ?? "").slice(0, 140),
  });

  return incident;
}

export async function advanceStatus(incidentId: string, target: IncidentStatus, officer: string, note?: string): Promise<IIncident> {
  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    {
      $set: { status: target },
      $push: {
        statusHistory: { status: target, label: STATUS_FLOW.find((s) => s.status === target)?.label ?? target, note },
        audit_trail: { actor: "officer", action: `status → ${target}`, detail: officer },
      },
    },
    { new: true }
  );
  if (!incident) throw new Error("Incident not found");
  if (incident.acknowledgementNumber) {
    emitToRoom(
      ROOMS.incident(incident.acknowledgementNumber),
      EVENTS.incidentStatusUpdate,
      { acknowledgementNumber: incident.acknowledgementNumber, status: incident.status, at: new Date() }
    );
  }
  return incident;
}
