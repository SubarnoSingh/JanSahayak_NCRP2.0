"use client";
import { useCallback, useRef, useState, type DragEvent } from "react";
import { api, ApiError, API_URL } from "@/lib/api";
import { sha256Hex, formatBytes } from "@/lib/hash";
import { CATEGORY_LABELS, CATEGORY_CONFIG, type IncidentCategory, type SuspectIdentifier, type Transaction } from "@/lib/types";
import { useComplaint } from "./context";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon } from "./AiConfirmField";
import type { EvidenceMeta } from "@/lib/types";

/* ── Category options ── */
const CATEGORY_OPTIONS: { value: IncidentCategory; label: string; hint: string }[] = [
  { value: "financial_fraud", label: CATEGORY_LABELS.financial_fraud, hint: "Money was taken or nearly taken" },
  { value: "harassment_extortion", label: CATEGORY_LABELS.harassment_extortion, hint: "Threats, blackmail, abuse" },
  { value: "women_child_safety", label: CATEGORY_LABELS.women_child_safety, hint: "Privacy-focused reporting" },
  { value: "other_cyber_crime", label: CATEGORY_LABELS.other_cyber_crime, hint: "Hacking, fake profiles, other" },
];

const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Other bank"];
const ACCEPT = ".png,.jpg,.jpeg,.webp,.pdf,.txt,.csv,.doc,.docx,.eml,.msg,.json";

interface LocalFile {
  id: string;
  file: File;
  sha256: string;
  status: "hashing" | "uploading" | "processing" | "done" | "error";
  error?: string;
}

export function StepEvidence({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const c = useComplaint();
  const toast = useToast();
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [changingCategory, setChangingCategory] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [suspectInput, setSuspectInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const smsRef = useRef<HTMLTextAreaElement>(null);
  const cRef = useRef(c);
  cRef.current = c;
  const isFinancial = CATEGORY_CONFIG[c.category ?? "other_cyber_crime"].isFinancial;

  /* ── Category selection ── */
  async function chooseCategory(cat: IncidentCategory) {
    c.update({ category: cat, categorySource: "citizen_confirmed" });
    setChangingCategory(false);
    try {
      await api.patch(`/incidents/${c.incidentId}`, { category: cat, categoryConfirmedByCitizen: true });
    } catch {
      /* non-fatal */
    }
  }

  /* ── File upload + auto-vision ── */
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).slice(0, 6);
      // Add all to local state
      const entries: LocalFile[] = [];
      for (const file of arr) {
        if (file.size > 10 * 1024 * 1024) {
          toast.push({ tone: "warn", title: `${file.name} is too large`, body: "Each file must be under 10 MB." });
          continue;
        }
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        entries.push({ id, file, sha256: "", status: "hashing" });
      }
      if (!entries.length) return;
      setLocalFiles((prev) => [...prev, ...entries]);

      // Process each file
      for (const entry of entries) {
        // 1) SHA-256 fingerprint
        let hash = "";
        try {
          hash = await sha256Hex(entry.file);
          setLocalFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, sha256: hash, status: "uploading" } : f)));
        } catch {
          setLocalFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "uploading" } : f)));
        }

        // 2) Upload
        let evidenceId = "";
        try {
          const fd = new FormData();
          fd.append("files", entry.file, entry.file.name);
          if (hash) fd.append("sha256", hash);
          const res = await api.post<{ evidence: EvidenceMeta[]; readinessScore: number; readinessBreakdown: { field: string; label: string; present: boolean }[]; transactions: Transaction[] }>(
            `/incidents/${c.incidentId}/evidence`,
            fd
          );
          c.update({
            evidence: res.evidence,
            readinessScore: res.readinessScore,
            readinessBreakdown: res.readinessBreakdown,
          });
          const uploaded = res.evidence[res.evidence.length - 1];
          evidenceId = uploaded?.evidenceId ?? "";
          setLocalFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "processing" } : f)));
        } catch (err) {
          const message = err instanceof ApiError ? err.message : `${entry.file.name} could not be uploaded.`;
          setLocalFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "error", error: message } : f)));
          continue;
        }

        // 3) Auto-trigger vision extraction for images
        if (/image\//.test(entry.file.type) && evidenceId) {
          setProcessingCount((n) => n + 1);
          try {
            const res = await api.post<{ extraction: Partial<Transaction>; available: boolean; reason?: string }>(
              `/incidents/${c.incidentId}/evidence/${evidenceId}/vision`
            );
            if (res.available && res.extraction) {
              const ex = res.extraction;
              if (process.env.NODE_ENV !== "production") {
                console.log("[pipeline:1] vision extraction result:", JSON.stringify(ex));
              }
              c.update({ aiTransactionHints: { ...c.aiTransactionHints, ...ex } });
              // Update extracted fields for the detected details section
              const newFields: Partial<Record<string, { value: string; source: string }>> = {};
              if (ex.amount != null) newFields.amount = { value: String(ex.amount), source: entry.file.name };
              if (ex.utr) newFields.utr = { value: ex.utr, source: entry.file.name };
              if (ex.timestamp) newFields.timestamp = { value: ex.timestamp, source: entry.file.name };
              if (ex.beneficiaryVpa) newFields.beneficiaryVpa = { value: ex.beneficiaryVpa, source: entry.file.name };
              if (ex.senderBank) newFields.senderBank = { value: ex.senderBank, source: entry.file.name };
              // Persist extracted fields in context so they survive navigation
              c.update({
                extractedFields: (() => {
                  const merged = { ...c.extractedFields };
                  for (const [k, v] of Object.entries(newFields)) {
                    if (!merged[k]) merged[k] = v;
                  }
                  return merged;
                })(),
              });
              // Populate canonical transaction state — UTR always, financial fields only for financial_fraud
              {
                const cur = cRef.current.transaction;
                const txn = { ...cur };
                if (!txn.utr && ex.utr) txn.utr = ex.utr;
                if (isFinancial) {
                  if (!txn.amount && ex.amount != null) txn.amount = String(ex.amount);
                  if (!txn.timestamp && ex.timestamp) txn.timestamp = ex.timestamp;
                  if (!txn.beneficiaryVpa && ex.beneficiaryVpa) txn.beneficiaryVpa = ex.beneficiaryVpa;
                  if (!txn.senderBank && ex.senderBank) txn.senderBank = ex.senderBank;
                }
                if (process.env.NODE_ENV !== "production") {
                  console.log("[pipeline:2] canonical state after merge:", JSON.stringify(txn));
                }
                c.update({ transaction: txn });
                const payload = {
                  utr: txn.utr || undefined,
                  amount: txn.amount ? Number(txn.amount.replace(/,/g, "")) : undefined,
                  timestamp: txn.timestamp || undefined,
                  senderBank: txn.senderBank || undefined,
                  beneficiaryVpa: txn.beneficiaryVpa || undefined,
                };
                if (process.env.NODE_ENV !== "production") {
                  console.log("[pipeline:3] PATCH payload:", JSON.stringify(payload));
                }
                void patchIncident(cRef.current.incidentId, { transaction: payload });
              }
              toast.push({ tone: "ok", title: "Details found", body: `Found transaction data in ${entry.file.name}. Verify below.` });
            }
          } catch {
            // Vision failed - not fatal
          } finally {
            setProcessingCount((n) => Math.max(0, n - 1));
            setLocalFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "done" } : f)));
          }
        } else {
          setLocalFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "done" } : f)));
        }
      }
    },
    [c, toast, isFinancial]
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
  };

  /* ── SMS paste parse ── */
  const parseSms = async () => {
    const text = smsRef.current?.value?.trim();
    if (!text) return;
    try {
      const blob = new File([new Blob([text], { type: "text/plain" })], `transaction-sms-${Date.now()}.txt`, { type: "text/plain" });
      await handleFiles([blob]);
      toast.push({ tone: "info", title: "Transaction SMS added", body: "We'll extract UTR, amount and beneficiary details." });
      if (smsRef.current) smsRef.current.value = "";
    } catch {
      /* handled in handleFiles */
    }
  };

  /* ── Suspects ── */
  function addSuspect() {
    const raw = suspectInput.trim();
    if (raw.length < 4) return;
    const type = guessType(raw);
    const identifier: SuspectIdentifier = { type, value: raw };
    if (c.suspectIdentifiers.some((s) => s.value === raw)) return;
    const list = [...c.suspectIdentifiers, identifier];
    c.update({ suspectIdentifiers: list });
    setSuspectInput("");
    void patchIncident(c.incidentId, { suspectIdentifiers: list });
  }

  /* ── Manual transaction fields ── */
  const setTransactionField = (field: keyof typeof c.transaction, value: string) => {
    const txn = { ...c.transaction, [field]: value };
    c.update({ transaction: txn });
    void patchIncident(c.incidentId, {
      transaction: {
        utr: txn.utr || undefined,
        amount: txn.amount ? Number(txn.amount.replace(/,/g, "")) : undefined,
        timestamp: txn.timestamp || undefined,
        senderBank: txn.senderBank || undefined,
        beneficiaryVpa: txn.beneficiaryVpa || undefined,
      },
    });
  };

  const hasExtractedData = Object.keys(c.extractedFields).length > 0;

  return (
    <div className="space-y-6">
      {/* ── A. Category detection ── */}
      {!changingCategory && c.category && (
        <div className="rounded-card border border-navy-border bg-navy-tint/50 p-4 animate-fade-in-up">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge tone="info" icon={<CheckIcon />}>
                Identified automatically
              </Badge>
              <p className="mt-2 text-sm text-ink">
                This looks like a <strong className="font-semibold">{CATEGORY_LABELS[c.category]}</strong> complaint.
                {c.categoryConfidence != null && (
                  <span className="ml-1.5 text-xs text-ink-faint">{Math.round(c.categoryConfidence * 100)}% match</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void chooseCategory(c.category!)}
                className="border-navy-border"
              >
                Looks correct
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setChangingCategory(true)}>
                Change
              </Button>
            </div>
          </div>
        </div>
      )}

      {(changingCategory || !c.category) && (
        <fieldset className="rounded-card border border-line bg-surface p-4">
          <legend className="px-1 text-sm font-semibold text-ink">What best describes what happened?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => void chooseCategory(opt.value)}
                className={`rounded-control border p-3.5 text-left transition-all hover:border-navy hover:bg-navy-tint/40 ${
                  c.category === opt.value ? "border-navy bg-navy-tint/50 ring-1 ring-navy" : "border-line bg-paper/60"
                }`}
              >
                <span className="block text-sm font-semibold text-ink">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-ink-faint">{opt.hint}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-2xs leading-relaxed text-ink-faint">
            Not sure? Pick the closest one — the investigating officer can re-classify after review.
          </p>
        </fieldset>
      )}

      {/* ── B. Evidence upload ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-card border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-navy bg-navy-tint/50" : "border-line-strong bg-surface"
        }`}
      >
        <span aria-hidden className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-tint text-navy">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M12 16V5m0 0 -4 4m4-4 4 4M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h3 className="text-base font-semibold text-ink">Add evidence</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-soft">
          {isFinancial
            ? "Screenshots, receipts, chats — anything that supports what happened. We'll automatically detect transaction details when possible."
            : "Screenshots, chats, documents — anything that supports what happened."}
        </p>
        <Button variant="secondary" size="md" className="mt-4" onClick={() => inputRef.current?.click()}>
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          aria-label="Choose evidence files"
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
        />
        <p className="mt-3 text-2xs text-ink-faint">
          Every file is fingerprinted (SHA-256) on your device before upload · max 10 MB each
        </p>
      </div>

      {/* In-flight files */}
      {localFiles.length > 0 && (
        <ul className="space-y-2">
          {localFiles.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
              {f.status === "error" ? (
                <span aria-hidden className="text-lg">⚠️</span>
              ) : f.status === "done" ? (
                <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-ok" fill="currentColor" aria-hidden>
                  <path d="M10 18A8 8 0 1 0 10 2a8 8 0 0 0 0 16Zm3.7-9.3-4.2 4.2a1 1 0 0 1-1.4 0L6.3 11.1a1 1 0 0 1 1.4-1.4l1.1 1.08 3.5-3.48a1 1 0 0 1 1.4 1.4Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 animate-spin text-navy" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M10 3a7 7 0 1 1-7 7" strokeLinecap="round" />
                </svg>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{f.file.name}</p>
                <p className="text-2xs text-ink-faint" role="status">
                  {f.status === "hashing" && "Generating integrity fingerprint…"}
                  {f.status === "uploading" && "Uploading…"}
                  {f.status === "processing" && "Reading evidence for details…"}
                  {f.status === "done" && "✓ Uploaded"}
                  {f.status === "error" && f.error}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Processing indicator */}
      {processingCount > 0 && (
        <div className="flex items-center gap-2 rounded-card border border-navy-border bg-navy-tint/30 px-4 py-3 text-sm text-navy">
          <svg viewBox="0 0 20 20" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M10 3a7 7 0 1 1-7 7" strokeLinecap="round" />
          </svg>
          {isFinancial ? "Reading your evidence for transaction details…" : "Reading your evidence…"}
        </div>
      )}

      {/* Evidence cards */}
      {c.evidence.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.evidence.map((ev) => (
            <Card as="li" key={ev.evidenceId} className="flex flex-col p-4 animate-fade-in-up">
              <p className="min-w-0 truncate text-sm font-medium text-ink" title={ev.originalName}>
                {ev.originalName}
              </p>
              <p className="mt-0.5 text-2xs text-ink-faint">
                {ev.mimeType.replace("application/", "").replace("image/", "").toUpperCase()} · {formatBytes(ev.sizeBytes)}
              </p>
              <div className="mt-3 rounded-control bg-paper px-2.5 py-2">
                <p className="text-2xs font-medium text-ok">✓ Evidence integrity protected</p>
                <details className="group mt-1">
                  <summary className="cursor-pointer list-none text-2xs text-ink-faint underline decoration-dotted underline-offset-2 hover:text-ink-soft">
                    Technical details
                  </summary>
                  <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-ink-faint">
                    SHA-256: {ev.sha256.slice(0, 44)}…
                    {ev.hashVerifiedServer != null && <> · server check: {ev.hashVerifiedServer ? "match ✓" : "pending"}</>}
                    {ev.exifScrubbed && <> · metadata removed ✓</>}
                  </p>
                </details>
              </div>
              {isFinancial && ev.hasAiExtraction && (
                <p className="mt-2 flex items-center gap-1 text-2xs text-ok">
                  <CheckIcon /> Transaction details found
                </p>
              )}
            </Card>
          ))}
        </ul>
      )}

      {/* ── C. Don't have evidence? (financial fraud only) ── */}
      {isFinancial && !showManualForm && c.evidence.length === 0 && localFiles.length === 0 && (
        <button
          type="button"
          onClick={() => setShowManualForm(true)}
          className="w-full rounded-card border border-dashed border-line-strong bg-paper/50 p-4 text-center text-sm text-ink-soft transition-colors hover:border-navy hover:bg-navy-tint/30 hover:text-ink"
        >
          Don&apos;t have evidence? <span className="font-medium text-navy">Enter details manually →</span>
        </button>
      )}

      {/* ── D. Detected details from evidence (financial fraud only) ── */}
      {isFinancial && hasExtractedData && (
        <Card className="p-4 sm:p-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-ink">Details found in your evidence</h3>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-ink-soft">We&apos;ve filled these details from the evidence you uploaded. Please check them before continuing.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {c.extractedFields.amount && (
              <DetectedField
                label="Amount lost"
                value={`₹${Number(c.extractedFields.amount.value).toLocaleString("en-IN")}`}
                source={c.extractedFields.amount.source}
                editable
                onEdit={(v) => {
                  const clean = v.replace(/[₹,\s]/g, "");
                  setTransactionField("amount", clean);
                  c.update({ extractedFields: { ...c.extractedFields, amount: { value: clean, source: c.extractedFields.amount!.source } } });
                }}
                editValue={c.transaction.amount}
                editPrefix="₹ "
                editInputMode="decimal"
              />
            )}
            {c.extractedFields.utr && (
              <DetectedField
                label="UTR / Reference number"
                value={c.extractedFields.utr.value}
                source={c.extractedFields.utr.source}
                editable
                onEdit={(v) => {
                  setTransactionField("utr", v.replace(/\D/g, ""));
                  c.update({ extractedFields: { ...c.extractedFields, utr: { value: v, source: c.extractedFields.utr!.source } } });
                }}
                editValue={c.transaction.utr}
                editInputMode="numeric"
                editMaxLength={24}
              />
            )}
            {c.extractedFields.timestamp && (
              <DetectedField
                label="Transaction date"
                value={formatTimestamp(c.extractedFields.timestamp.value)}
                source={c.extractedFields.timestamp.source}
              />
            )}
            {c.extractedFields.beneficiaryVpa && (
              <DetectedField
                label="Beneficiary UPI ID"
                value={c.extractedFields.beneficiaryVpa.value}
                source={c.extractedFields.beneficiaryVpa.source}
                editable
                onEdit={(v) => {
                  setTransactionField("beneficiaryVpa", v);
                  c.update({ extractedFields: { ...c.extractedFields, beneficiaryVpa: { value: v, source: c.extractedFields.beneficiaryVpa!.source } } });
                }}
                editValue={c.transaction.beneficiaryVpa}
                mono
              />
            )}
            {c.extractedFields.senderBank && (
              <DetectedField
                label="Bank / Payment app"
                value={c.extractedFields.senderBank.value}
                source={c.extractedFields.senderBank.source}
                editable
                onEdit={(v) => {
                  setTransactionField("senderBank", v);
                  c.update({ extractedFields: { ...c.extractedFields, senderBank: { value: v, source: c.extractedFields.senderBank!.source } } });
                }}
                editValue={c.transaction.senderBank}
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="mt-3 text-xs font-medium text-navy hover:underline"
          >
            {showManualForm ? "Hide manual fields" : "Edit all fields manually"}
          </button>
        </Card>
      )}

      {/* ── E. Manual transaction fields (financial fraud only) ── */}
      {isFinancial && (showManualForm || showManual) && (
        <Card className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-ink">Transaction details</h3>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-ink-soft">
            Fill whatever you know — leave blank if unavailable. These help banks act quickly during the golden hour.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Amount lost"
              optional
              inputMode="decimal"
              value={c.transaction.amount}
              onChange={(e) => setTransactionField("amount", e.target.value)}
              placeholder="e.g. 40000"
            />
            <Input
              label="UTR / Reference number"
              optional
              inputMode="text"
              maxLength={24}
              value={c.transaction.utr}
              onChange={(e) => setTransactionField("utr", e.target.value)}
              placeholder="12-digit UTR or transaction ID"
              hint="Found in your payment app under transaction details."
            />
            <Input
              label="When did it happen?"
              optional
              type="datetime-local"
              value={c.transaction.timestamp}
              onChange={(e) => setTransactionField("timestamp", new Date(e.target.value).toISOString())}
            />
            <Input
              label="Your bank"
              optional
              value={c.transaction.senderBank}
              onChange={(e) => setTransactionField("senderBank", e.target.value)}
              placeholder="e.g. SBI, HDFC"
            />
            <Input
              label="Beneficiary UPI ID"
              optional
              value={c.transaction.beneficiaryVpa}
              onChange={(e) => setTransactionField("beneficiaryVpa", e.target.value)}
              placeholder="someone@upi"
              className="sm:col-span-2 font-mono"
            />
          </div>
        </Card>
      )}

      {/* ── F. Suspect identifiers ── */}
      <fieldset className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <legend className="px-1 text-sm font-semibold text-ink">Who is troubling you?</legend>
        <p className="mb-4 mt-2 text-xs leading-relaxed text-ink-soft">
          Add phone numbers, social media handles, profile links — anything that identifies them. Optional.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); addSuspect(); }}
        >
          <input
            value={suspectInput}
            onChange={(e) => setSuspectInput(e.target.value)}
            placeholder="+91 phone · @handle · link · email"
            aria-label="Add a suspect identifier"
            className="h-10 flex-1 rounded-control border border-line bg-surface px-3 font-mono text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
          <Button type="submit" variant="secondary" size="md" disabled={suspectInput.trim().length < 4}>
            Add
          </Button>
        </form>
        {c.suspectIdentifiers.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {c.suspectIdentifiers.map((s, i) => (
              <li key={`${s.value}-${i}`} className="flex items-center justify-between rounded-control bg-paper px-3 py-2">
                <span className="min-w-0 truncate font-mono text-xs text-ink">{s.value}</span>
                <span className="ml-2 flex shrink-0 items-center gap-2">
                  <Badge tone="neutral">{s.type}</Badge>
                  <button
                    type="button"
                    onClick={() => {
                      const list = c.suspectIdentifiers.filter((_, j) => j !== i);
                      c.update({ suspectIdentifiers: list });
                      void patchIncident(c.incidentId, { suspectIdentifiers: list });
                    }}
                    aria-label={`Remove ${s.value}`}
                    className="text-ink-faint transition-colors hover:text-danger"
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                      <path d="m4 4 8 8m0-8-8 8" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {/* ── G. SMS paste (financial fraud) ── */}
      {isFinancial && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink">Have the bank SMS instead?</h3>
          <p className="mb-3 mt-1 text-xs text-ink-soft">Paste the transaction SMS — we&apos;ll extract UTR, amount and beneficiary automatically.</p>
          <textarea
            ref={smsRef}
            rows={2}
            placeholder="e.g. Rs 35,000 debited from A/c XX1234 towards scammer.refund@okaxis. UTR 421598761234…"
            className="w-full resize-none rounded-control border border-line bg-paper px-3 py-2 font-mono text-xs outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
          <div className="mt-2 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => void parseSms()}>
              Extract & attach
            </Button>
          </div>
        </Card>
      )}

      {/* ── Navigation ── */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="lg" onClick={onBack}>
          ← Back
        </Button>
        <Button
          size="lg"
          onClick={async () => {
            if (c.transaction.utr || c.transaction.amount || c.transaction.beneficiaryVpa) {
              const payload = {
                utr: c.transaction.utr || undefined,
                amount: c.transaction.amount ? Number(c.transaction.amount.replace(/,/g, "")) : undefined,
                timestamp: c.transaction.timestamp || undefined,
                senderBank: c.transaction.senderBank || undefined,
                beneficiaryVpa: c.transaction.beneficiaryVpa || undefined,
              };
              if (process.env.NODE_ENV !== "production") {
                console.log("[pipeline:5] Continue PATCH payload:", JSON.stringify(payload));
              }
              await patchIncident(c.incidentId, { transaction: payload });
            }
            onNext();
          }}
          disabled={!c.category}
        >
          Continue to review
        </Button>
      </div>
    </div>
  );
}

/* ── Helper: detected field display ── */
function DetectedField({
  label,
  value,
  source,
  editable,
  onEdit,
  editValue,
  editInputMode,
  editMaxLength,
  editPrefix,
  mono,
}: {
  label: string;
  value: string;
  source: string;
  editable?: boolean;
  onEdit?: (v: string) => void;
  editValue?: string;
  editInputMode?: string;
  editMaxLength?: number;
  editPrefix?: string;
  mono?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  if (editing && editable && onEdit) {
    return (
      <div>
        <label className="mb-1 flex items-center justify-between text-xs font-medium text-ink">
          {label}
          <button type="button" onClick={() => setEditing(false)} className="text-2xs font-normal text-navy hover:underline">
            Done
          </button>
        </label>
        <input
          type="text"
          inputMode={editInputMode as any}
          maxLength={editMaxLength}
          value={editValue ?? ""}
          onChange={(e) => onEdit(e.target.value)}
          className={`h-10 w-full rounded-control border border-navy bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-navy/20 ${mono ? "font-mono" : ""}`}
        />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-control bg-paper px-3 py-2.5">
      <div>
        <p className="text-2xs text-ink-faint">{label}</p>
        <p className={`mt-0.5 text-sm font-medium text-ink ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone="info" icon={<CheckIcon />}>
          Found in evidence
        </Badge>
        {editable && (
          <button type="button" onClick={() => setEditing(true)} className="text-2xs font-medium text-navy hover:underline">
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ── */
function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return ts;
  }
}

function guessType(raw: string): string {
  if (/^[\w.-]{2,}@[\w]{2,}$/.test(raw)) return "upi";
  if (/^(https?:\/\/|www\.)/i.test(raw)) return "url";
  if (/^@/.test(raw)) return "social";
  if (/^\+?\d[\d\s-]{7,}$/.test(raw)) return "phone";
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(raw)) return "email";
  return "other";
}

async function patchIncident(incidentId: string | null, body: Record<string, unknown>): Promise<boolean> {
  if (!incidentId) return false;
  try {
    await api.patch(`/incidents/${incidentId}`, body);
    return true;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[complaint] PATCH failed:", err);
    }
    return false;
  }
}

/* ── Test evidence download helper ── */
export function TestEvidenceCard() {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = `${API_URL}/api/mockdata/test-evidence`;
    a.download = "test-cyber-fraud-evidence.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="rounded-card border border-dashed border-line-strong bg-paper/50 p-4">
      <p className="text-xs font-medium text-ink">Need an image for testing?</p>
      <p className="mt-0.5 text-2xs text-ink-faint">We&apos;ve got you covered.</p>
      <Button variant="secondary" size="sm" className="mt-3" onClick={handleDownload}>
        <svg viewBox="0 0 16 16" className="mr-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M8 2v8m0 0-3-3m3 3 3-3M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Download test evidence
      </Button>
      <p className="mt-2 text-2xs text-ink-faint">Use this sample to test evidence extraction.</p>
    </div>
  );
}
