import fs from "fs/promises";
import path from "path";
import type { Request, Response, NextFunction } from "express";
import { Incident } from "../models/Incident";
import { Officer } from "../models/Officer";
import { signOfficerToken, requireOfficer } from "../middleware/officerAuth";
import { advanceStatus, audit } from "../services/incidentService";
import { cfcfrmsRequestFreeze, cfcfrmsTraceTransaction } from "../integrations/cfcfrms";
import { renderDossier } from "../services/pdfService";
import { config } from "../config";

const asyncH = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

const officer = (req: Request) => (req as Request & { officer?: { email: string; name: string; unit: string } }).officer;

/** POST /api/officer/login */
export const login = asyncH(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(422).json({ error: { code: "VALIDATION", message: "Email and password are required." } });
    return;
  }
  const normalized = String(email).trim().toLowerCase();
  const demoMatch =
    normalized === config.officerDemo.email.toLowerCase() && password === config.officerDemo.password;

  let profile = { name: "Demo Investigating Officer", rank: "Inspector", unit: "Cyber Police Station — Demo Range" };
  if (!demoMatch) {
    const dbOfficer = await Officer.findOne({ email: normalized });
    // Demo build: only the configured demo credential pair is accepted.
    if (!dbOfficer || password !== config.officerDemo.password) {
      res.status(401).json({ error: { code: "BAD_CREDENTIALS", message: "Incorrect credentials. Use the demo credentials from WORKING.md." } });
      return;
    }
    profile = { name: dbOfficer.name, rank: dbOfficer.rank, unit: dbOfficer.unit };
  }
  await audit("officer", normalized, normalized, "hq_login");
  res.json({
    token: signOfficerToken({ sub: normalized, email: normalized, ...profile }),
    officer: { email: normalized, ...profile },
  });
});

/** GET /api/officer/queue — triage list */
export const queue = asyncH(async (req, res) => {
  await requireOfficer(req, res, () => undefined);
  if (!(req as Request & { officer?: unknown }).officer) return;
  const incidents = await Incident.find({ status: { $in: ["submitted", "verified", "assigned", "investigation"] } })
    .sort({ createdAt: -1 })
    .limit(60)
    .select(
      "acknowledgementNumber incident_category categoryConfidence status statutory_readiness_score financial_transactions suspect_identifiers evidence anonymousMode language goldenHour createdAt narrative_raw"
    )
    .lean();
  res.json({
    queue: incidents.map((i) => ({
      id: String(i._id),
      acknowledgementNumber: i.acknowledgementNumber,
      category: i.incident_category,
      confidence: i.categoryConfidence,
      status: i.status,
      readinessScore: i.statutory_readiness_score,
      amount: i.financial_transactions?.[0]?.amount,
      utr: i.financial_transactions?.[0]?.utr,
      vpa: i.financial_transactions?.[0]?.beneficiaryVpa,
      suspects: i.suspect_identifiers?.slice(0, 3).map((s) => s.value),
      evidenceCount: i.evidence?.length ?? 0,
      anonymousMode: i.anonymousMode,
      language: i.language,
      goldenHourActive: Boolean(i.goldenHour),
      goldenHourStartedAt: i.goldenHour?.startedAt,
      preview: i.narrative_raw?.slice(0, 160),
      createdAt: i.createdAt,
    })),
  });
});

/** GET /api/officer/incidents/:id — full split-view payload */
export const incidentDetail = asyncH(async (req, res) => {
  await requireOfficer(req, res, () => undefined);
  if (!(req as Request & { officer?: unknown }).officer) return;
  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Incident not found." } });
    return;
  }
  res.json({ incident: incident.toObject() });
});

/** POST /api/officer/incidents/:id/freeze — simulated CFCFRMS escalation */
export const triggerFreeze = asyncH(async (req, res) => {
  const auth = await new Promise<boolean>((resolve) =>
    requireOfficer(req, res, () => resolve(true))
  );
  if (!auth) return;
  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Incident not found." } });
    return;
  }
  const txn = incident.financial_transactions[0];
  const result = await cfcfrmsRequestFreeze({
    utr: txn?.utr,
    amount: txn?.amount,
    beneficiaryAccountOrVpa: txn?.beneficiaryVpa,
  });

  const now = new Date();
  incident.goldenHour = incident.goldenHour ?? { startedAt: now, windowMinutes: 120 };
  incident.goldenHour.bankNotifiedAt = incident.goldenHour.bankNotifiedAt ?? now;
  incident.goldenHour.holdRequestedAt = incident.goldenHour.holdRequestedAt ?? now;
  incident.goldenHour.freezeConfirmedAt = now;

  // Refresh money trail with freeze state
  const trace = await cfcfrmsTraceTransaction({ utr: txn?.utr, amount: txn?.amount, beneficiaryVpa: txn?.beneficiaryVpa });
  incident.moneyTrail = trace;
  incident.moneyTrail.nodes = incident.moneyTrail.nodes.map((n) =>
    n.id === "mule-a" ? { ...n, status: "frozen" } : n
  );
  incident.statusHistory.push({ status: incident.status, label: `1930 freeze confirmed (${result.referenceId})`, at: now, note: "SIMULATED CFCFRMS escalation" });
  incident.audit_trail.push({ actor: "officer", action: "CFCFRMS freeze triggered", detail: `${result.referenceId} — ${result.bank} (SIMULATED)` });
  await incident.save();
  await audit("incident", String(incident._id), officer(req)?.email ?? "officer", "cfcfrms_freeze", { referenceId: result.referenceId });

  res.json({ freeze: result, goldenHour: incident.goldenHour, moneyTrail: incident.moneyTrail });
});

/** POST /api/officer/incidents/:id/status — advance workflow */
export const setStatus = asyncH(async (req, res) => {
  await requireOfficer(req, res, () => undefined);
  if (!(req as Request & { officer?: unknown }).officer) return;
  const { status, note } = req.body ?? {};
  const allowed = ["verified", "assigned", "investigation", "fir_registered", "closed"];
  if (!allowed.includes(status)) {
    res.status(422).json({ error: { code: "VALIDATION", message: `Status must be one of: ${allowed.join(", ")}` } });
    return;
  }
  const updated = await advanceStatus(req.params.id, status, officer(req)?.name ?? "officer", note);
  res.json({ incident: updated.toObject() });
});

/** GET /api/officer/incidents/:id/dossier.pdf */
export const dossier = asyncH(async (req, res) => {
  await requireOfficer(req, res, () => undefined);
  if (!(req as Request & { officer?: unknown }).officer) return;
  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Incident not found." } });
    return;
  }
  console.log(`[pdf] dossier generation started — incident ${String(incident._id)}, ${incident.evidence.length} evidence item(s)`);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${incident.acknowledgementNumber}-dossier.pdf"`);
  renderDossier(incident).pipe(res);
});

/** GET /api/officer/incidents/:id/evidence/:evidenceId/file — serve the actual uploaded evidence file */
export const serveEvidenceFile = asyncH(async (req, res) => {
  await requireOfficer(req, res, () => undefined);
  if (!(req as Request & { officer?: unknown }).officer) return;
  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Incident not found." } });
    return;
  }
  const ev = incident.evidence.find((e) => e.evidenceId === req.params.evidenceId);
  if (!ev) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Evidence not found." } });
    return;
  }
  const filePath = path.resolve(process.cwd(), config.uploads.dir, ev.storedName);
  try {
    await fs.access(filePath);
  } catch {
    res.status(404).json({ error: { code: "FILE_MISSING", message: "Evidence file is no longer available on disk." } });
    return;
  }
  console.log(`[io] evidence served — ${ev.originalName} (${ev.mimeType}) for incident ${String(incident._id)}`);
  res.setHeader("Content-Type", ev.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${ev.originalName}"`);
  res.setHeader("Cache-Control", "private, max-age=3600");
  const stream = (await import("fs")).createReadStream(filePath);
  stream.pipe(res);
});
