import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { Incident, type IIncident, type ITransaction, type ISuspectIdentifier } from "../models/Incident";
import { createIncidentSchema, updateIncidentSchema, signChallengeSchema, signCompleteSchema, validationError } from "../validators";
import { runAiAnalysis, recomputeReadiness, computePayloadHash, audit, STATUS_FLOW } from "../services/incidentService";
import { evidenceHashOk, persistEvidence, scrubImageMetadata, sha256Buffer } from "../services/evidenceService";
import { extractFromImage } from "../services/aiService";
import { parseTransactionSms } from "../services/heuristicEngine";
import * as epramaan from "../integrations/epramaan";
import { renderAcknowledgement } from "../services/pdfService";
import type { IncomingFile } from "../middleware/upload";

const asyncH = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

/** POST /api/incidents — start a complaint */
export const createIncident = asyncH(async (req, res) => {
  const parsed = createIncidentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION", ...validationError("createIncident", parsed.error) } });
    return;
  }
  const d = parsed.data;
  const created = await Incident.create({
    narrative_raw: d.narrative,
    incident_category: d.category ?? "other_cyber_crime",
    categorySource: d.category ? "citizen" : undefined,
    language: d.language,
    anonymousMode: d.anonymousMode,
    status: "draft",
    audit_trail: [{ actor: "citizen", action: "Complaint started" }],
  });
  const incident = d.category
    ? (await (async () => {
        recomputeReadiness(created);
        await created.save();
        return created;
      })())
    : await runAiAnalysis(String(created._id));
  res.status(201).json({ incident: publicIncident(incident.toObject()) });
});

/** GET /api/incidents/:id */
export const getIncident = asyncH(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "This complaint could not be found." } });
    return;
  }
  res.json({ incident: publicIncident(incident) });
});

/** PATCH /api/incidents/:id */
export const updateIncident = asyncH(async (req, res) => {
  const parsed = updateIncidentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION", ...validationError("updateIncident", parsed.error) } });
    return;
  }
  const incident = await Incident.findById(req.params.id);
  if (!incident) throw Object.assign(new Error("Incident not found"), { statusCode: 404 });
  const d = parsed.data;

  if (d.narrative !== undefined) incident.narrative_raw = d.narrative;
  if (d.anonymousMode !== undefined) incident.anonymousMode = d.anonymousMode;
  if (d.category !== undefined && d.category !== incident.incident_category) {
    incident.incident_category = d.category;
    incident.categorySource = d.categoryConfirmedByCitizen ? "citizen_confirmed" : "citizen";
    incident.audit_trail.push({ actor: "citizen", action: `Category set to ${d.category}` });
  } else if (d.categoryConfirmedByCitizen) {
    incident.categorySource = "citizen_confirmed";
  }
  if (d.citizenContact) {
    const clean = Object.fromEntries(Object.entries(d.citizenContact).filter(([, v]) => v));
    // Anonymous mode intentionally stores no identifying contact details.
    if (!incident.anonymousMode) incident.citizenContact = { ...incident.citizenContact, ...clean };
  }
  if (d.transaction) {
    const t = d.transaction;
    const clean: Partial<ITransaction> = {};
    if (t.utr !== undefined && t.utr !== "") clean.utr = t.utr;
    if (t.amount != null) clean.amount = t.amount;
    if (t.timestamp !== undefined && t.timestamp !== "") clean.timestamp = t.timestamp;
    if (t.senderBank !== undefined && t.senderBank !== "") clean.senderBank = t.senderBank;
    if (t.beneficiaryVpa !== undefined && t.beneficiaryVpa !== "") clean.beneficiaryVpa = t.beneficiaryVpa;
    if (t.method !== undefined && t.method !== "") clean.method = t.method;
    clean.source = "citizen";

    // Merge into existing citizen transaction, or find any transaction to enrich, or create new
    const citizenIdx = incident.financial_transactions.findIndex((x) => x.source === "citizen");
    if (citizenIdx >= 0) {
      incident.financial_transactions[citizenIdx] = { ...incident.financial_transactions[citizenIdx], ...clean };
      console.log(`[complaint] transaction merged into existing citizen txn #${citizenIdx}`);
    } else {
      // Try to merge into an existing AI-sourced transaction
      const aiIdx = incident.financial_transactions.findIndex((x) => x.source === "ai_vision" || x.source === "ai_text");
      if (aiIdx >= 0) {
        incident.financial_transactions[aiIdx] = { ...incident.financial_transactions[aiIdx], ...clean };
        console.log(`[complaint] transaction merged into existing AI txn #${aiIdx}`);
      } else {
        incident.financial_transactions.push(clean as ITransaction);
        console.log(`[complaint] new transaction created with source=${clean.source}`);
      }
    }
    incident.audit_trail.push({ actor: "citizen", action: "Transaction details updated" });
  }
  if (d.suspectIdentifiers) {
    for (const s of d.suspectIdentifiers as ISuspectIdentifier[]) {
      if (!incident.suspect_identifiers.some((x) => x.value === s.value)) incident.suspect_identifiers.push(s);
    }
  }

  recomputeReadiness(incident);
  await incident.save();
  res.json({ incident: publicIncident(incident.toObject()) });
});

/** POST /api/incidents/:id/analyze — AI classification + extraction */
export const analyze = asyncH(async (req, res) => {
  const incident = await runAiAnalysis(req.params.id);
  res.json({
    incident: publicIncident(incident.toObject()),
    aiNotice:
      "These suggestions were generated automatically. Please verify everything before submitting.",
  });
});

/** POST /api/incidents/:id/evidence */
export const addEvidence = asyncH(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident) throw Object.assign(new Error("Incident not found"), { statusCode: 404 });

  const files = (req.files as IncomingFile[]) ?? [];
  const clientHashes: string[] = Array.isArray(req.body?.sha256)
    ? req.body.sha256
    : req.body?.sha256
      ? [req.body.sha256]
      : [];
  const smsTexts: string[] = req.body?.smsText ? [String(req.body.smsText)].flat() : [];

  console.log(`[evidence] upload started — ${files.length} file(s) for incident ${String(incident._id)}`);
  const saved = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    let buffer = f.buffer;
    let scrubbed = false;
    if (f.mimetype === "image/jpeg" || f.mimetype === "image/png") {
      const r = scrubImageMetadata(buffer, f.mimetype);
      buffer = r.buffer;
      scrubbed = r.scrubbed;
    }
    const clientHash = clientHashes[i];
    const verified = clientHash ? evidenceHashOk(buffer, String(clientHash)) : undefined;
    if (clientHash && verified === false) {
      res.status(409).json({
        error: { code: "HASH_MISMATCH", message: `${f.originalname}: the file changed during upload. Please re-add this file.` },
      });
      return;
    }
    const stored = await persistEvidence(String(incident._id), f.originalname || "evidence", buffer);
    const meta = {
      evidenceId: crypto.randomUUID(),
      originalName: f.originalname || "evidence",
      storedName: stored.storedName,
      mimeType: f.mimetype,
      sizeBytes: buffer.length,
      sha256: sha256Buffer(buffer),
      hashVerifiedServer: verified,
      exifScrubbed: scrubbed,
      uploadedAt: new Date(),
    };
    incident.evidence.push(meta);
    saved.push(meta);
    console.log(`[evidence] stored — ${f.originalname} (${f.mimetype}, ${buffer.length} bytes, sha256:${sha256Buffer(buffer).slice(0, 12)}…)`);

    // Opportunistic SMS parse when a transaction text is pasted alongside
    if (f.mimetype === "text/plain") {
      const text = buffer.toString("utf8").slice(0, 4000);
      const parsedTxn = parseTransactionSms(text);
      if (parsedTxn && !incident.financial_transactions.some((t) => t.utr === parsedTxn.utr)) {
        incident.financial_transactions.push(parsedTxn as ITransaction);
      }
    }
  }

  recomputeReadiness(incident);
  incident.audit_trail.push({ actor: "citizen", action: `Evidence added (${saved.length})` });
  await incident.save();

  res.status(201).json({
    evidence: incident.evidence,
    transactions: incident.financial_transactions,
    readinessScore: incident.statutory_readiness_score,
    readinessBreakdown: incident.readiness_breakdown,
  });
});

/** POST /api/incidents/:id/evidence/:evidenceId/vision — AI vision extraction */
export const visionExtract = asyncH(async (req, res) => {
  console.log(`[evidence] vision extraction started — evidence ${req.params.evidenceId}`);
  const fs = await import("fs/promises");
  const path = await import("path");
  const config = (await import("../config")).config;
  const incident = await Incident.findById(req.params.id);
  const ev = incident?.evidence.find((e) => e.evidenceId === req.params.evidenceId);
  if (!incident || !ev) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Evidence not found." } });
    return;
  }
  const abs = path.resolve(process.cwd(), config.uploads.dir, path.basename(ev.storedName));
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(abs);
  } catch {
    res.status(410).json({ error: { code: "FILE_GONE", message: "The uploaded file is no longer available on disk." } });
    return;
  }
  const result = await extractFromImage(buffer.toString("base64"), ev.mimeType);
  ev.aiExtraction = result.available ? result.fields : null;
  await incident.save();
  console.log(`[evidence] vision extraction completed — available=${result.available}, fields=${JSON.stringify(result.fields)}${result.reason ? `, reason=${result.reason}` : ""}`);
  res.json({
    extraction: result.fields,
    available: result.available,
    reason: result.reason,
    notice: result.available
      ? "We found these details in your screenshot. Please verify them."
      : undefined,
  });
});

/** POST /api/incidents/:id/sign/challenge */
export const signChallenge = asyncH(async (req, res) => {
  const parsed = signChallengeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION", ...validationError("signChallenge", parsed.error) } });
    return;
  }
  const challenge = await epramaan.createOtpChallenge(parsed.data.virtualId);
  if ("error" in challenge) {
    res.status(422).json({ error: { code: "INVALID_VID", message: challenge.error } });
    return;
  }
  const incident = await Incident.findById(req.params.id);
  if (!incident) throw new Error("Incident not found");
  await audit("incident", req.params.id, "citizen", "esign_challenge_requested");
  res.json(challenge);
});

/** POST /api/incidents/:id/sign/complete */
export const signComplete = asyncH(async (req, res) => {
  const parsed = signCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION", ...validationError("signComplete", parsed.error) } });
    return;
  }
  const incident = await Incident.findById(req.params.id);
  if (!incident) throw Object.assign(new Error("Incident not found"), { statusCode: 404 });
  const payloadHash = computePayloadHash(incident.toObject());
  const result = await epramaan.verifyOtpAndSign({ challengeId: parsed.data.challengeId, otp: parsed.data.otp, complaintPayloadHash: payloadHash });
  if (!result.ok) {
    res.status(401).json({ error: { code: "OTP_INVALID", message: result.error } });
    return;
  }
  incident.signature_status = "signed";
  incident.signature = {
    provider: "epramaan_mock",
    method: "aadhaar_otp_demo",
    aadhaarVirtualIdMasked: `XXXX XXXX ${(parsed.data.challengeId.slice(-4))}`,
    artifact: result.artifact.artifact,
    signedHash: payloadHash,
    signedAt: new Date(),
  };
  incident.audit_trail.push({ actor: "system", action: "Digital signature applied (mock e-Pramaan)" });
  await incident.save();
  res.json({ signatureStatus: "signed", signedHash: payloadHash, demo: true });
});

/** POST /api/incidents/:id/submit */
export const submit = asyncH(async (req, res) => {
  try {
    const incident = await import("../services/incidentService").then((m) => m.submitIncident(req.params.id));
    res.json({
      acknowledgementNumber: incident.acknowledgementNumber,
      submittedAt: incident.acknowledgementIssuedAt,
      category: incident.incident_category,
      goldenHourActive: Boolean(incident.goldenHour),
    });
  } catch (err: any) {
    if (err.code === "ANONYMOUS_NOT_ALLOWED") {
      res.status(422).json({ error: { code: "ANONYMOUS_NOT_ALLOWED", message: err.message } });
      return;
    }
    if (err.code === "CONTACT_REQUIRED") {
      res.status(422).json({ error: { code: "CONTACT_REQUIRED", message: err.message } });
      return;
    }
    throw err;
  }
});

/** GET /api/complaints/track/:ackNumber */
export const trackByAck = asyncH(async (req, res) => {
  const ack = decodeURIComponent(req.params.ackNumber ?? "").trim().toUpperCase();
  const incident = await Incident.findOne({
    $or: [
      { acknowledgementNumber: ack },
      ...(ack.startsWith("NCRP") ? [] : [{ _id: ack.match(/^[a-f\d]{24}$/i) ? ack : undefined }]),
    ].filter(Boolean) as object[],
  });
  if (!incident) {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "No complaint was found with this number. Check the acknowledgment number in your confirmation.",
      },
    });
    return;
  }
  res.json({
    complaint: {
      acknowledgementNumber: incident.acknowledgementNumber,
      category: incident.incident_category,
      status: incident.status,
      statusHistory: incident.statusHistory,
      flow: STATUS_FLOW,
      submittedAt: incident.acknowledgementIssuedAt ?? incident.createdAt,
      lastUpdate: incident.updatedAt,
      goldenHourActive: Boolean(incident.goldenHour),
      evidenceCount: incident.evidence.length,
      anonymousMode: incident.anonymousMode,
    },
  });
});

/** GET /api/incidents/:id/acknowledgement.pdf */
export const downloadAckPdf = asyncH(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident?.acknowledgementNumber) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Acknowledgement not available yet." } });
    return;
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${incident.acknowledgementNumber}-acknowledgement.pdf"`);
  renderAcknowledgement(incident).pipe(res);
});

function publicIncident(i: IIncident) {
  return {
    id: String(i._id),
    acknowledgementNumber: i.acknowledgementNumber,
    incident_category: i.incident_category,
    categoryConfidence: i.categoryConfidence,
    categorySource: i.categorySource,
    narrative_raw: i.narrative_raw,
    narrative_summary: i.narrative_summary,
    financial_transactions: i.financial_transactions,
    suspect_identifiers: i.suspect_identifiers,
    bns_sections_mapped: i.bns_sections_mapped,
    statutory_readiness_score: i.statutory_readiness_score,
    readiness_breakdown: i.readiness_breakdown,
    evidenceCount: i.evidence.length,
    evidence: i.evidence.map((e) => ({
      evidenceId: e.evidenceId,
      originalName: e.originalName,
      mimeType: e.mimeType,
      sizeBytes: e.sizeBytes,
      sha256: e.sha256,
      hashVerifiedServer: e.hashVerifiedServer,
      exifScrubbed: e.exifScrubbed,
      hasAiExtraction: Boolean(e.aiExtraction),
    })),
    anonymousMode: i.anonymousMode,
    citizenContact: i.citizenContact ?? null,
    signature_status: i.signature_status,
    status: i.status,
  };
}
