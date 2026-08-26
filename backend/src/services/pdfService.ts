/**
 * PDF generation service — acknowledgement & IO dossier.
 */
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { imageSize } from "image-size";
import type { IIncident } from "../models/Incident";
import { config } from "../config";

const NAVY = "#1e3a5f";
const CHARCOAL = "#1c1c1c";
const GRAY = "#6b7280";
const GREEN = "#16a34a";
const RED = "#dc2626";
const SLATE_BG = "#f0f4f8";
const SLATE_BORDER = "#b8c9d9";
const SLATE_TEXT = "#3d5a73";

/* ── Unicode font registration for ₹ and other symbols ── */
const NOTO_REGULAR = "/usr/share/fonts/noto/NotoSans-Regular.ttf";
const NOTO_BOLD = "/usr/share/fonts/noto/NotoSans-Bold.ttf";
const NOTO_MEDIUM = "/usr/share/fonts/noto/NotoSans-Medium.ttf";
const NOTO_ITALIC = "/usr/share/fonts/noto/NotoSans-Italic.ttf";

let useNoto = false;
try {
  if (fs.existsSync(NOTO_REGULAR)) useNoto = true;
} catch {
  /* Helvetica fallback */
}

/** Register Noto Sans fonts on a document instance for ₹ (U+20B9) support. */
function registerNoto(doc: PDFKit.PDFDocument): void {
  if (!useNoto) return;
  try {
    doc.registerFont("Noto", NOTO_REGULAR);
    doc.registerFont("Noto-Bold", NOTO_BOLD);
    doc.registerFont("Noto-Medium", NOTO_MEDIUM);
    doc.registerFont("Noto-Italic", NOTO_ITALIC);
  } catch {
    /* fallback to Helvetica */
  }
}

/** Returns the font name that supports ₹ (U+20B9). */
function F(weight: "n" | "b" | "m" | "o" = "n"): string {
  if (!useNoto) return weight === "b" ? "Helvetica-Bold" : weight === "o" ? "Helvetica-Oblique" : "Helvetica";
  return weight === "b" ? "Noto-Bold" : weight === "m" ? "Noto-Medium" : weight === "o" ? "Noto-Italic" : "Noto";
}

function header(doc: PDFKit.PDFDocument, title: string, subtitle: string): void {
  doc.rect(0, 0, doc.page.width, 90).fill(NAVY);
  doc.fill("#ffffff").font(F("b")).fontSize(16).text("NCRP 2.0 — e-FIR Jan-Sahayak", 48, 26);
  doc.font(F("n")).fontSize(9).text(
    "Indian Cyber Crime Coordination Centre · DEMONSTRATION DOCUMENT (synthetic data)",
    48,
    50
  );
  doc.fill(CHARCOAL).font(F("b")).fontSize(18).text(title, 48, 120);
  doc.font(F("n")).fontSize(10).fill(GRAY).text(subtitle, 48, 144);
  doc.moveDown(1);
}

function section(doc: PDFKit.PDFDocument, name: string): void {
  doc.moveDown(0.8).font(F("b")).fontSize(11).fillColor(NAVY).text(name.toUpperCase());
  doc.moveTo(48, doc.y + 3).lineTo(doc.page.width - 48, doc.y + 3).lineWidth(0.7).strokeColor("#d1d5db").stroke();
  doc.moveDown(0.4).font(F("n")).fontSize(10).fillColor(CHARCOAL);
}

function kv(doc: PDFKit.PDFDocument, key: string, value: string | number | undefined | null): void {
  const v = value === undefined || value === null || value === "" ? "—" : String(value);
  doc.font(F("n")).fillColor(GRAY).text(key, { continued: true }).fillColor(CHARCOAL).font(F("b")).text(`  ${v}`);
}

function isFinancialCategory(category?: string): boolean {
  return category === "financial_fraud";
}

function readEvidenceImage(storedName: string): Buffer | null {
  try {
    const dir = path.resolve(process.cwd(), config.uploads.dir);
    const filePath = path.join(dir, storedName);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

function getImageDimensions(buf: Buffer): { width: number; height: number } {
  try {
    const dims = imageSize(buf);
    return { width: dims.width ?? 100, height: dims.height ?? 100 };
  } catch {
    return { width: 100, height: 100 };
  }
}

function checkPageBreak(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > doc.page.height - 80) {
    doc.addPage();
  }
}

export function renderDossier(incident: IIncident): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margins: { top: 48, bottom: 56, left: 48, right: 48 } });
  registerNoto(doc);
  const ack = incident.acknowledgementNumber ?? "(draft)";
  const isFinancial = isFinancialCategory(incident.incident_category);

  header(doc, `Case Dossier — ${ack}`, `Generated ${new Date().toLocaleString("en-IN")} · Status: ${incident.status} · Readiness: ${incident.statutory_readiness_score}%`);

  section(doc, "Overview");
  kv(doc, "Acknowledgement:", ack);
  kv(doc, "Category:", incident.incident_category.replace(/_/g, " "));
  kv(doc, "Language:", incident.language ?? "en");
  kv(doc, "Anonymous mode:", incident.anonymousMode ? "On" : "Off");
  kv(doc, "Signature:", incident.signature_status);

  if (incident.citizenContact) {
    const c = incident.citizenContact;
    const parts = [c.fullName, c.phone, c.email, [c.state, c.district].filter(Boolean).join(", ")].filter(Boolean);
    if (parts.length > 0) kv(doc, "Contact (citizen-provided):", parts.join(" · "));
  }

  section(doc, "Complaint narrative");

  if (incident.narrative_summary) {
    // AI-generated summary box
    const contentW = doc.page.width - 96;
    const boxX = 48;
    const boxW = contentW;

    // Measure the text height by rendering into a temporary position
    doc.save();
    doc.font(F("o")).fontSize(9).fillColor(SLATE_TEXT);
    const textOpts = { width: boxW - 24, lineGap: 1.5 };
    const textHeight = doc.heightOfString(incident.narrative_summary, textOpts);
    const boxH = textHeight + 36; // padding top (label + gap) + padding bottom

    // Page-break guard: keep the box together
    checkPageBreak(doc, boxH + 20);

    const boxY = doc.y;

    // Background
    doc.rect(boxX, boxY, boxW, boxH).fill(SLATE_BG);

    // Left accent border
    doc.rect(boxX, boxY, 3, boxH).fill(NAVY);

    // Label
    doc.font(F("b")).fontSize(7.5).fillColor(NAVY);
    doc.text("AI-GENERATED SUMMARY", boxX + 14, boxY + 10, { width: boxW - 24, lineBreak: false });

    // Summary text
    doc.font(F("o")).fontSize(9).fillColor(SLATE_TEXT);
    doc.text(incident.narrative_summary, boxX + 14, boxY + 24, textOpts);

    doc.restore();
    doc.y = boxY + boxH + 6;
  }

  // Complainant's statement
  doc.font(F("b")).fontSize(8).fillColor(NAVY).text("COMPLAINANT'S STATEMENT", { width: doc.page.width - 96 });
  doc.moveDown(0.2);
  doc.font(F("n")).fontSize(10).fillColor(CHARCOAL).text(incident.narrative_raw || "—", { lineGap: 2 });

  if (isFinancial) {
    section(doc, "Financial transaction details");
    if (incident.financial_transactions.length === 0) {
      doc.text("None recorded.");
    }
    for (const t of incident.financial_transactions) {
      kv(doc, "UTR / RRN:", t.utr);
      kv(doc, "Amount:", t.amount ? `₹${t.amount.toLocaleString("en-IN")}` : undefined);
      kv(doc, "Timestamp:", t.timestamp ? new Date(String(t.timestamp)).toLocaleString("en-IN") : undefined);
      kv(doc, "Sender bank:", t.senderBank);
      kv(doc, "Beneficiary VPA:", t.beneficiaryVpa);
      kv(doc, "Source:", `${t.source}${t.verifiedByCitizen ? " (citizen verified)" : ""}`);
      doc.moveDown(0.3);
    }
  }

  section(doc, "Suspect identifiers");
  if (incident.suspect_identifiers.length === 0) doc.text("None recorded.");
  for (const s of incident.suspect_identifiers) {
    doc.font(F("n")).fillColor(CHARCOAL).text(`${s.type.toUpperCase()}   ${s.value}`, { continued: false });
    if (s.context) doc.fontSize(9).fillColor(GRAY).text(s.context).fontSize(10);
  }

  section(doc, "Provisional legal mapping");
  if (incident.bns_sections_mapped.length === 0) {
    doc.text("Not yet mapped.");
  } else {
    for (const m of incident.bns_sections_mapped) {
      doc.font(F("b")).fillColor(NAVY).text(`${m.section} — ${m.title}`);
      doc.font(F("n")).fontSize(9).fillColor(GRAY).text(m.rationale).fontSize(10).fillColor(CHARCOAL);
    }
  }

  doc.addPage();
  section(doc, "Evidence register");
  if (incident.evidence.length === 0) {
    doc.text("No evidence attached.");
  } else {
    for (let i = 0; i < incident.evidence.length; i++) {
      const e = incident.evidence[i];
      // Minimum space needed for metadata + integrity status (no image yet)
      checkPageBreak(doc, 120);

      doc.font(F("b")).fillColor(NAVY).text(`Evidence #${i + 1}`);
      kv(doc, "Filename:", e.originalName);
      kv(doc, "Type / size:", `${e.mimeType} · ${(e.sizeBytes / 1024).toFixed(0)} KB`);
      kv(doc, "SHA-256:", e.sha256);

      doc.font(F("n")).fontSize(9);
      if (e.hashVerifiedServer) {
        doc.fillColor(GREEN).text("  ✓ Integrity verified — server hash matches");
      } else {
        doc.fillColor(GRAY).text("  Server hash verification: not performed");
      }
      if (e.exifScrubbed) {
        doc.fillColor(GREEN).text("  ✓ EXIF / metadata scrubbed for privacy");
      }
      doc.fillColor(CHARCOAL).fontSize(10);

      if (e.mimeType.startsWith("image/")) {
        const imgBuf = readEvidenceImage(e.storedName);
        if (imgBuf) {
          try {
            const { width: origW, height: origH } = getImageDimensions(imgBuf);
            const availableWidth = doc.page.width - 96; // 48 left + 48 right margins
            const maxHeight = 350;
            const scale = Math.min(availableWidth / origW, maxHeight / origH, 1);
            const renderedWidth = origW * scale;
            const renderedHeight = origH * scale;
            const reservedHeight = renderedHeight + 16; // padding above + below

            checkPageBreak(doc, reservedHeight);

            const imgX = 48;
            const imgY = doc.y + 4;

            // Draw subtle border around the image area
            doc.save();
            doc.roundedRect(imgX, imgY, renderedWidth, renderedHeight, 4)
              .lineWidth(0.5)
              .strokeColor("#d1d5db")
              .stroke();
            doc.restore();

            // Place image with proper fit to preserve aspect ratio
            doc.image(imgBuf, imgX, imgY, {
              fit: [renderedWidth, renderedHeight],
            });

            // Advance cursor past the image — this is the critical fix for overlap
            doc.y = imgY + renderedHeight + 8;
          } catch {
            doc.fontSize(9).fillColor(RED).text("  [Image could not be embedded — file may be corrupted]").fillColor(CHARCOAL).fontSize(10);
          }
        } else {
          doc.fontSize(9).fillColor(RED).text("  [Image file no longer available on disk]").fillColor(CHARCOAL).fontSize(10);
        }
      } else if (e.mimeType === "application/pdf") {
        doc.fontSize(9).fillColor(GRAY).text("  [PDF document — refer to original file]").fillColor(CHARCOAL).fontSize(10);
      } else {
        doc.fontSize(9).fillColor(GRAY).text(`  [${e.mimeType} file — refer to original]`).fillColor(CHARCOAL).fontSize(10);
      }
      doc.moveDown(0.5);

      // Show extracted data if available
      if (e.aiExtraction && typeof e.aiExtraction === "object" && Object.keys(e.aiExtraction).length > 0) {
        const ex = e.aiExtraction as Record<string, unknown>;
        doc.font(F("b")).fontSize(9).fillColor(NAVY).text("  Extracted transaction details:");
        doc.font(F("n")).fontSize(9).fillColor(CHARCOAL);
        if (ex.utr) doc.text(`    UTR: ${String(ex.utr)}`);
        if (ex.amount != null) doc.text(`    Amount: ₹${Number(ex.amount).toLocaleString("en-IN")}`);
        if (ex.timestamp) doc.text(`    Date: ${new Date(String(ex.timestamp)).toLocaleString("en-IN")}`);
        if (ex.beneficiaryVpa) doc.text(`    Beneficiary: ${String(ex.beneficiaryVpa)}`);
        if (ex.senderBank || ex.bank) doc.text(`    Bank: ${String(ex.senderBank ?? ex.bank)}`);
        doc.fontSize(10).fillColor(CHARCOAL);
        doc.moveDown(0.3);
      }

      // Visual separator between evidence items
      if (i < incident.evidence.length - 1) {
        doc.moveDown(0.3);
        doc.moveTo(48, doc.y).lineTo(doc.page.width - 48, doc.y).lineWidth(0.3).strokeColor("#e5e7eb").stroke();
        doc.moveDown(0.5);
      }
    }
  }

  if (isFinancial) {
    section(doc, "Golden hour — financial fraud response");
    if (incident.goldenHour) {
      kv(doc, "Window started:", incident.goldenHour.startedAt?.toISOString());
      kv(doc, "Bank notified:", incident.goldenHour.bankNotifiedAt?.toISOString() ?? "pending");
      kv(doc, "Hold requested:", incident.goldenHour.holdRequestedAt?.toISOString() ?? "pending");
      kv(doc, "Freeze confirmed:", incident.goldenHour.freezeConfirmedAt?.toISOString() ?? "pending");
    } else {
      doc.text("No golden-hour window initiated.");
    }
  }

  section(doc, "Status history");
  if (incident.statusHistory.length === 0) {
    doc.text("No status changes recorded.");
  }
  for (const h of incident.statusHistory) {
    kv(doc, h.status, h.at?.toISOString());
  }

  section(doc, "Audit trail");
  if (incident.audit_trail.length === 0) {
    doc.text("No audit entries.");
  }
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
  registerNoto(doc);
  header(doc, "Complaint Acknowledgement", `Issued ${new Date().toLocaleString("en-IN")}`);

  section(doc, "Acknowledgment Number");
  doc.font(F("b")).fontSize(22).fillColor(NAVY).text(incident.acknowledgementNumber ?? "—");

  section(doc, "What you reported");
  kv(doc, "Incident type:", incident.incident_category.replace(/_/g, " "));
  kv(doc, "Submitted at:", incident.acknowledgementIssuedAt?.toISOString());
  kv(doc, "Language:", incident.language ?? "en");

  section(doc, "What happens next");
  doc.text("1. Your complaint enters the review queue of the concerned cyber police unit.", { lineGap: 3 });
  doc.text("2. An officer verifies the details and may contact you on the channel you provided.", { lineGap: 3 });
  doc.text("3. You can track every status change with your acknowledgment number.", { lineGap: 3 });
  if (incident.incident_category === "financial_fraud") {
    doc.moveDown(0.4).font(F("b")).fillColor(CHARCOAL)
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

/* ── State/UT Nodal Officer Directory PDF ─────────────────────── */

export function renderDirectoryPdf(): PDFKit.PDFDocument {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { officerDirectory } = require("../data/officerDirectory");
  const doc = new PDFDocument({ size: "A4", margins: { top: 48, bottom: 56, left: 48, right: 48 }, layout: "landscape" });
  registerNoto(doc);
  const pageW = doc.page.width;
  const contentW = pageW - 96;

  // Header banner
  doc.rect(0, 0, pageW, 80).fill(NAVY);
  doc.fill("#ffffff").font(F("b")).fontSize(16).text("NATIONAL CYBER CRIME REPORTING PORTAL", 48, 22);
  doc.font(F("n")).fontSize(9).text("State/UT Nodal Cyber Cell & Grievance Officer Directory", 48, 44);
  doc.fill(GRAY).fontSize(8).text("Prototype / Mock Data — not official contact information", 48, 58);

  // Mock data notice
  doc.fillColor(CHARCOAL).font(F("o")).fontSize(8);
  doc.text(
    "NOTICE: The contact details in this document are fictional mock data created for demonstration purposes. They do not represent real government officers or contact information.",
    48, 96, { width: contentW }
  );
  doc.moveDown(0.8);

  // Table
  const startX = 48;
  const startY = doc.y + 4;
  const gap = 4;
  const cols: { label: string; w: number; x: number }[] = [
    { label: "S.No", w: 26, x: 0 },
    { label: "State / UT", w: 118, x: 0 },
    { label: "Nodal Cyber Cell Officer", w: 128, x: 0 },
    { label: "Rank", w: 78, x: 0 },
    { label: "Email", w: 148, x: 0 },
    { label: "Grievance Officer", w: 105, x: 0 },
    { label: "Rank", w: 50, x: 0 },
    { label: "Contact", w: 65, x: 0 },
  ];
  // Position columns left-to-right so they fill exactly contentW
  let cx = startX;
  for (const c of cols) {
    c.x = cx;
    cx += c.w + gap;
  }
  const rowH = 16;
  const headerH = 20;

  function drawTableHeader(y: number) {
    doc.save();
    doc.rect(startX, y, contentW, headerH).fill("#d4e3f3");
    doc.fill(NAVY).font(F("b")).fontSize(7.5);
    for (const c of cols) {
      doc.text(c.label, c.x + 3, y + 5, { width: c.w - 6, lineBreak: false });
    }
    doc.restore();
    return y + headerH;
  }

  let y = drawTableHeader(startY);

  for (let i = 0; i < officerDirectory.length; i++) {
    const entry = officerDirectory[i];
    // Page break check
    if (y + rowH > doc.page.height - 60) {
      doc.addPage();
      y = drawTableHeader(48);
    }

    // Alternating row background
    if (i % 2 === 0) {
      doc.save();
      doc.rect(startX, y, contentW, rowH).fill("#f8f7f5");
      doc.restore();
    }

    doc.font(F("n")).fontSize(7).fillColor(CHARCOAL);
    const vals = [
      String(i + 1),
      entry.state,
      entry.nodalOfficer.name,
      entry.nodalOfficer.rank,
      entry.nodalOfficer.email,
      entry.grievanceOfficer.name,
      entry.grievanceOfficer.rank,
      entry.grievanceOfficer.contact,
    ];
    for (let j = 0; j < cols.length; j++) {
      doc.text(vals[j], cols[j].x + 3, y + 4, { width: cols[j].w - 6, lineBreak: false });
    }
    y += rowH;
  }

  // Footer — place after the table, not at a hardcoded page position
  const footerLines = [
    "NCRP 2.0 — e-FIR Jan-Sahayak · Hackathon prototype · Mock data only",
    `Generated ${new Date().toLocaleString("en-IN")} · ${officerDirectory.length} States/UTs`,
  ];
  doc.fontSize(7).fillColor(GRAY).font(F("n"));
  const lineH = 10;
  const footerBlockH = footerLines.length * lineH + 8;
  const usableBottom = doc.page.height - doc.page.margins.bottom;

  // If not enough room on current page, add one page
  if (doc.y + footerBlockH > usableBottom) {
    doc.addPage();
  }

  const footerY = doc.y + 8;
  for (let i = 0; i < footerLines.length; i++) {
    doc.text(footerLines[i], startX, footerY + i * lineH, { width: contentW, align: "center" });
  }

  doc.end();
  return doc;
}
