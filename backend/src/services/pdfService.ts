/**
 * PDF generation service — acknowledgement & IO dossier.
 */
import PDFDocument from "pdfkit";
import type { IIncident } from "../models/Incident";

const NAVY = "#1e3a5f";
const CHARCOAL = "#1c1c1c";
const GRAY = "#6b7280";

function header(doc: PDFKit.PDFDocument, title: string, subtitle: string): void {
  doc.rect(0, 0, doc.page.width, 90).fill(NAVY);
  doc.fill("#ffffff").font("Helvetica-Bold").fontSize(16).text("NCRP 2.0 — e-FIR Jan-Sahayak", 48, 26);
  doc.font("Helvetica").fontSize(9).text(
    "Indian Cyber Crime Coordination Centre · DEMONSTRATION DOCUMENT (synthetic data)",
    48,
    50
  );
  doc.fill(CHARCOAL).font("Helvetica-Bold").fontSize(18).text(title, 48, 120);
  doc.font("Helvetica").fontSize(10).fill(GRAY).text(subtitle, 48, 144);
  doc.moveDown(1);
}

function section(doc: PDFKit.PDFDocument, name: string): void {
  doc.moveDown(0.8).font("Helvetica-Bold").fontSize(11).fillColor(NAVY).text(name.toUpperCase());
  doc.moveTo(48, doc.y + 3).lineTo(doc.page.width - 48, doc.y + 3).lineWidth(0.7).strokeColor("#d1d5db").stroke();
  doc.moveDown(0.4).font("Helvetica").fontSize(10).fillColor(CHARCOAL);
}

function kv(doc: PDFKit.PDFDocument, key: string, value: string | number | undefined | null): void {
  const v = value === undefined || value === null || value === "" ? "—" : String(value);
  doc.font("Helvetica").fillColor(GRAY).text(key, { continued: true }).fillColor(CHARCOAL).font("Helvetica-Bold").text(`  ${v}`);
}

export function renderDossier(incident: IIncident): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margins: { top: 48, bottom: 56, left: 48, right: 48 } });
  const ack = incident.acknowledgementNumber ?? "(draft)";

  header(doc, `Case Dossier — ${ack}`, `Generated ${new Date().toLocaleString("en-IN")} · Status: ${incident.status} · Readiness: ${incident.statutory_readiness_score}%`);

  section(doc, "Overview");
  kv(doc, "Acknowledgement:", ack);
  kv(doc, "Category:", incident.incident_category);
  kv(doc, "Language:", incident.language ?? "en");
  kv(doc, "Anonymous mode:", incident.anonymousMode ? "On" : "Off");
  kv(doc, "Signature:", incident.signature_status);

  section(doc, "Complaint narrative");
  if (incident.narrative_summary) doc.font("Helvetica-Oblique").fillColor(GRAY).text(incident.narrative_summary);
  doc.moveDown(0.3);
  doc.font("Helvetica").fillColor(CHARCOAL).text(incident.narrative_raw || "—", { lineGap: 2 });

  section(doc, "Financial transactions");
  if (incident.financial_transactions.length === 0) {
    doc.text("None recorded.");
  }
  for (const t of incident.financial_transactions) {
    kv(doc, "UTR:", t.utr);
    kv(doc, "Amount:", t.amount ? `₹${t.amount.toLocaleString("en-IN")}` : undefined);
    kv(doc, "Time:", t.timestamp);
    kv(doc, "Sender bank:", t.senderBank);
    kv(doc, "Beneficiary VPA:", t.beneficiaryVpa);
    kv(doc, "Source:", `${t.source}${t.verifiedByCitizen ? " (citizen verified)" : ""}`);
    doc.moveDown(0.3);
  }

  section(doc, "Suspect identifiers");
  if (incident.suspect_identifiers.length === 0) doc.text("None recorded.");
  for (const s of incident.suspect_identifiers) {
    doc.font("Helvetica").fillColor(CHARCOAL).text(`${s.type.toUpperCase()}   ${s.value}`, { continued: false });
    if (s.context) doc.fontSize(9).fillColor(GRAY).text(s.context).fontSize(10);
  }

  section(doc, "Provisional legal mapping");
  for (const m of incident.bns_sections_mapped) {
    doc.font("Helvetica-Bold").text(`${m.section} — ${m.title}`);
    doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(m.rationale).fontSize(10);
  }

  doc.addPage();
  section(doc, "Evidence register");
  if (incident.evidence.length === 0) {
    doc.text("No evidence attached.");
  } else {
    incident.evidence.forEach((e, i) => {
      kv(doc, `#${i + 1}`, e.originalName);
      kv(doc, "Type / size:", `${e.mimeType} · ${(e.sizeBytes / 1024).toFixed(0)} KB`);
      kv(doc, "SHA-256:", e.sha256);
      kv(doc, "Server hash verified:", e.hashVerifiedServer ? "Yes" : "Not checked");
      kv(doc, "Metadata scrubbed:", e.exifScrubbed ? "Yes" : "N/A");
      doc.moveDown(0.4);
    });
  }

  section(doc, "Golden hour (financial fraud)");
  if (incident.goldenHour) {
    kv(doc, "Window started:", incident.goldenHour.startedAt?.toISOString());
    kv(doc, "Bank notified:", incident.goldenHour.bankNotifiedAt?.toISOString() ?? "pending");
    kv(doc, "Hold requested:", incident.goldenHour.holdRequestedAt?.toISOString() ?? "pending");
    kv(doc, "Freeze confirmed:", incident.goldenHour.freezeConfirmedAt?.toISOString() ?? "pending");
  } else {
    doc.text("Not applicable.");
  }

  section(doc, "Status history");
  for (const h of incident.statusHistory) {
    kv(doc, h.status, h.at?.toISOString());
  }

  section(doc, "Audit trail");
  for (const a of incident.audit_trail.slice(-25)) {
    doc.fontSize(9).fillColor(GRAY).text(`${a.at?.toISOString()}  [${a.actor}]  ${a.action}${a.detail ? ` — ${a.detail}` : ""}`);
  }

  doc.fontSize(8).fillColor(GRAY).text(
    "This document is generated by a hackathon prototype. All data is synthetic. It holds no legal validity.",
    48,
    doc.page.height - 60,
    { width: doc.page.width - 96 }
  );
  doc.end();
  return doc;
}

export function renderAcknowledgement(incident: IIncident): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margins: { top: 48, bottom: 56, left: 48, right: 48 } });
  header(doc, "Complaint Acknowledgement", `Issued ${new Date().toLocaleString("en-IN")}`);

  section(doc, "Acknowledgment Number");
  doc.font("Helvetica-Bold").fontSize(22).fillColor(NAVY).text(incident.acknowledgementNumber ?? "—");

  section(doc, "What you reported");
  kv(doc, "Incident type:", incident.incident_category.replace(/_/g, " "));
  kv(doc, "Submitted at:", incident.acknowledgementIssuedAt?.toISOString());
  kv(doc, "Language:", incident.language ?? "en");

  section(doc, "What happens next");
  doc.text("1. Your complaint enters the review queue of the concerned cyber police unit.", { lineGap: 3 });
  doc.text("2. An officer verifies the details and may contact you on the channel you provided.", { lineGap: 3 });
  doc.text("3. You can track every status change with your acknowledgment number.", { lineGap: 3 });
  if (incident.incident_category === "financial_fraud") {
    doc.moveDown(0.4).font("Helvetica-Bold").fillColor(CHARCOAL)
      .text("Financial fraud: call 1930 immediately if you have not already. Early reporting improves recovery chances.");
  }

  section(doc, "Integrity summary");
  kv(doc, "Evidence files:", incident.evidence.length);
  kv(doc, "Digital signature:", "Verified (demo)");
  incident.evidence.forEach((e, i) => {
    doc.fontSize(8.5).fillColor(GRAY).text(`#${i + 1} ${e.originalName} → sha256 ${e.sha256.slice(0, 32)}…`);
  });

  doc.fontSize(8).fillColor(GRAY).text(
    "Demonstration document from a hackathon prototype. Synthetic data only; not legally valid.",
    48,
    doc.page.height - 60,
    { width: doc.page.width - 96 }
  );
  doc.end();
  return doc;
}
