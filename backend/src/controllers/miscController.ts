import type { Request, Response, NextFunction } from "express";
import { suspectSearchSchema, suspectReportSchema, volunteerSchema, validationError } from "../validators";
import { searchSuspects, reportSuspect } from "../services/suspectService";
import { Suspect } from "../models/Suspect";
import { Volunteer, ScamAlert, Resource } from "../models";
import { translate } from "../services/translationService";
import { transcribeAudio } from "../services/speechService";
import { lookupConnections } from "../integrations/tafcop";
import { requestImeiBlock } from "../integrations/ceir";
import { SUPPORTED_LANGUAGES } from "../integrations/bhashini";
import type { IncomingFile } from "../middleware/upload";

const asyncH = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

/** POST /api/suspects/search */
export const searchSuspectsCtrl = asyncH(async (req, res) => {
  const parsed = suspectSearchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION", message: "Enter a phone number, UPI ID, URL or handle." } });
    return;
  }
  const out = await searchSuspects(parsed.data);
  res.json({
    results: out.results,
    queryType: (out as { query?: { type?: string } }).query?.type ?? null,
    notice:
      (out.results.length ?? 0) > 0
        ? "Synthetic demonstration data. Report counts reflect demo activity only."
        : undefined,
  });
});

/** POST /api/suspects/report */
export const reportSuspectCtrl = asyncH(async (req, res) => {
  const parsed = suspectReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION", ...validationError("request", parsed.error) } });
    return;
  }
  const suspect = await reportSuspect({
    rawIdentifier: parsed.data.identifier,
    category: parsed.data.category,
    note: parsed.data.note,
    reporterContact: req.body?.reporterContact,
  });
  res.status(201).json({
    reported: true,
    suspect: {
      identifier: suspect.identifier,
      type: suspect.type,
      reportCount: suspect.reportCount,
      status: suspect.status,
    },
    message:
      suspect.reportCount > 1
        ? `This identifier now has ${suspect.reportCount} reports. Your report strengthens the case for action.`
        : "Thank you — this is the first report for this identifier. It is now visible to monitoring.",
  });
});

/** GET /api/suspects/stats */
export const suspectStats = asyncH(async (_req, res) => {
  const [total, active] = await Promise.all([
    Suspect.countDocuments(),
    Suspect.countDocuments({ status: { $in: ["active", "flagged"] } }),
  ]);
  res.json({ totalTracked: total, activeFlagged: active });
});

/** GET /api/resources */
export const listResources = asyncH(async (_req, res) => {
  const resources = await Resource.find().sort({ trending: -1, updatedAt: -1 }).lean();
  res.json({ resources });
});

/** GET /api/scam-alerts */
export const listScamAlerts = asyncH(async (_req, res) => {
  const alerts = await ScamAlert.find({ active: true }).sort({ publishedAt: -1 }).limit(6).lean();
  res.json({ alerts, emptyMessage: alerts.length === 0 ? "No current scam alerts. Stay careful, stay updated." : undefined });
});

/** POST /api/volunteers */
export const joinVolunteers = asyncH(async (req, res) => {
  const parsed = volunteerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION", ...validationError("request", parsed.error) } });
    return;
  }
  await Volunteer.create(parsed.data);
  res.status(201).json({ ok: true, message: "Application received. The state nodal officer will reach out on your email." });
});

/** POST /api/translation/translate */
export const translateCtrl = asyncH(async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body ?? {};
  if (!text || !targetLanguage) {
    res.status(422).json({ error: { code: "VALIDATION", message: "text and targetLanguage are required." } });
    return;
  }
  const result = await translate({ text: String(text).slice(0, 4000), sourceLanguage: sourceLanguage ?? "en", targetLanguage });
  res.json(result);
});

/** POST /api/speech/transcribe */
export const transcribeCtrl = asyncH(async (req, res) => {
  const file = (req as Request & { file?: IncomingFile }).file;
  if (!file) {
    res.status(422).json({ error: { code: "NO_AUDIO", message: "Attach an audio file under the 'audio' field." } });
    return;
  }
  if (!/^audio\//.test(file.mimetype)) {
    res.status(415).json({ error: { code: "UNSUPPORTED_FILE_TYPE", message: "Only audio recordings are accepted here." } });
    return;
  }
  const result = await transcribeAudio(file, String(req.body?.language ?? "hi"));
  if (!result.ok) {
    res.status(501).json({ error: { code: "SPEECH_UNAVAILABLE", message: result.reason } });
    return;
  }
  res.json({ text: result.text, language: result.language });
});

/** GET /api/languages — supported language registry */
export const languages = asyncH(async (_req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES, uiLocalesAvailable: ["en", "hi", "bn", "ta", "mr", "te", "gu", "kn", "ml", "pa"] });
});

/** POST /api/gov/tafcop-lookup */
export const tafcopLookup = asyncH(async (req, res) => {
  const { phone } = req.body ?? {};
  const result = await lookupConnections(String(phone ?? ""));
  if (!result.ok) {
    res.status(422).json({ error: { code: "VALIDATION", message: result.error } });
    return;
  }
  res.json(result.result);
});

/** POST /api/gov/ceir-block */
export const ceirBlock = asyncH(async (req, res) => {
  const { imei } = req.body ?? {};
  const result = await requestImeiBlock(String(imei ?? ""));
  if (!result.ok) {
    res.status(422).json({ error: { code: "VALIDATION", message: result.error } });
    return;
  }
  res.json(result.result);
});
