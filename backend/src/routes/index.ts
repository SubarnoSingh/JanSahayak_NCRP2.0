import { Router } from "express";
import { upload, uploadAudio, uploadErrorHandler } from "../middleware/upload";
import * as ic from "../controllers/incidentController";
import * as oc from "../controllers/officerController";
import * as mc from "../controllers/miscController";

const router = Router();

/* ── Citizen: incident lifecycle ─────────────────────────── */
router.post("/incidents", ic.createIncident);
router.get("/incidents/:id", ic.getIncident);
router.patch("/incidents/:id", ic.updateIncident);
router.post("/incidents/:id/analyze", ic.analyze);
router.post(
  "/incidents/:id/evidence",
  upload.array("files", 6),
  uploadErrorHandler,
  ic.addEvidence
);
router.post("/incidents/:id/evidence/:evidenceId/vision", ic.visionExtract);
router.post("/incidents/:id/sign/challenge", ic.signChallenge);
router.post("/incidents/:id/sign/complete", ic.signComplete);
router.post("/incidents/:id/submit", ic.submit);
router.get("/incidents/:id/acknowledgement.pdf", ic.downloadAckPdf);

/* ── Citizen: tracking ───────────────────────────────────── */
router.get("/complaints/track/:ackNumber", ic.trackByAck);

/* ── Suspect repository ──────────────────────────────────── */
router.post("/suspects/search", mc.searchSuspectsCtrl);
router.post("/suspects/report", mc.reportSuspectCtrl);
router.get("/suspects/stats", mc.suspectStats);

/* ── Speech / translation / languages ────────────────────── */
router.post("/speech/transcribe", uploadAudio.single("audio"), uploadErrorHandler, mc.transcribeCtrl);
router.post("/translation/translate", mc.translateCtrl);
router.get("/languages", mc.languages);

/* ── Content ─────────────────────────────────────────────── */
router.get("/resources", mc.listResources);
router.get("/scam-alerts", mc.listScamAlerts);
router.post("/volunteers", mc.joinVolunteers);

/* ── Mock gov lookups ────────────────────────────────────── */
router.post("/gov/tafcop-lookup", mc.tafcopLookup);
router.post("/gov/ceir-block", mc.ceirBlock);

/* ── IO Command Center (officer-authenticated) ───────────── */
router.post("/officer/login", oc.login);
router.get("/officer/queue", oc.queue);
router.get("/officer/incidents/:id", oc.incidentDetail);
router.post("/officer/incidents/:id/freeze", oc.triggerFreeze);
router.post("/officer/incidents/:id/status", oc.setStatus);
router.get("/officer/incidents/:id/dossier.pdf", oc.dossier);

export default router;
