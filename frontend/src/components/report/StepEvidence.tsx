"use client";
import { useCallback, useRef, useState, type DragEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { sha256Hex, formatBytes } from "@/lib/hash";
import { useComplaint } from "./context";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { SparkIcon } from "./AiConfirmField";
import type { EvidenceMeta, Transaction } from "@/lib/types";

interface LocalFile {
  id: string;
  file: File;
  sha256: string;
  status: "hashing" | "uploading" | "done" | "error";
  error?: string;
}

const ACCEPT = ".png,.jpg,.jpeg,.webp,.pdf,.txt,.csv,.doc,.docx,.eml,.msg,.json";

export function StepEvidence({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const c = useComplaint();
  const toast = useToast();
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [visionState, setVisionState] = useState<Record<string, { loading: boolean; fields?: Partial<Transaction>; reason?: string }>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const smsRef = useRef<HTMLTextAreaElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      for (const file of Array.from(files).slice(0, 6)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.push({ tone: "warn", title: `${file.name} is too large`, body: "Each file must be under 10 MB." });
          continue;
        }
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setLocalFiles((prev) => [...prev, { id, file, sha256: "", status: "hashing" }]);
        // 1) Fingerprint locally BEFORE transmission
        let hash = "";
        try {
          hash = await sha256Hex(file);
          setLocalFiles((prev) => prev.map((f) => (f.id === id ? { ...f, sha256: hash, status: "uploading" } : f)));
        } catch {
          hash = "";
          setLocalFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" })));
        }
        // 2) Upload with integrity proof
        try {
          const fd = new FormData();
          fd.append("files", file, file.name);
          if (hash) fd.append("sha256", hash);
          const res = await api.post<{ evidence: EvidenceMeta[]; readinessScore: number; readinessBreakdown: [] }>(
            `/incidents/${c.incidentId}/evidence`,
            fd
          );
          c.update({
            evidence: res.evidence,
            readinessScore: res.readinessScore,
            readinessBreakdown: res.readinessBreakdown,
          });
          setLocalFiles((prev) => prev.filter((f) => f.id !== id));
        } catch (err) {
          const message =
            err instanceof ApiError ? err.message : `${file.name} could not be uploaded. Check your connection and retry.`;
          setLocalFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "error", error: message } : f)));
        }
      }
    },
    [c, toast]
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
  };

  const runVision = async (ev: EvidenceMeta) => {
    if (!/image\//.test(ev.mimeType)) return;
    setVisionState((s) => ({ ...s, [ev.evidenceId]: { loading: true } }));
    try {
      const res = await api.post<{
        extraction: Partial<Transaction>;
        available: boolean;
        reason?: string;
        notice?: string;
      }>(`/incidents/${c.incidentId}/evidence/${ev.evidenceId}/vision`);
      if (res.available && (res.extraction.utr || res.extraction.amount)) {
        setVisionState((s) => ({ ...s, [ev.evidenceId]: { loading: false, fields: res.extraction } }));
        c.update({ aiTransactionHints: res.extraction });
      } else {
        setVisionState((s) => ({
          ...s,
          [ev.evidenceId]: { loading: false, reason: res.reason ?? "Nothing readable found in this image." },
        }));
      }
    } catch {
      setVisionState((s) => ({ ...s, [ev.evidenceId]: { loading: false, reason: "Reading failed. You can enter details manually." } }));
    }
  };

  const parseSms = async () => {
    const text = smsRef.current?.value?.trim();
    if (!text) return;
    try {
      const blob = new File([new Blob([text], { type: "text/plain" })], `transaction-sms-${Date.now()}.txt`, { type: "text/plain" });
      await handleFiles([blob]);
      toast.push({ tone: "info", title: "Transaction SMS added", body: "If a UTR and amount were found, they've been suggested below in Important details." });
      if (smsRef.current) smsRef.current.value = "";
    } catch {
      /* handled in handleFiles */
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
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
          Drop files here or choose from your device — screenshots, photos, PDFs, documents, chat exports or email files.
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

      {/* In-flight local files */}
      {localFiles.length > 0 && (
        <ul className="space-y-2">
          {localFiles.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
              {f.status === "error" ? (
                <span aria-hidden className="text-lg">⚠️</span>
              ) : (
                <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 animate-spin text-navy" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M10 3a7 7 0 1 1-7 7" strokeLinecap="round" />
                </svg>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{f.file.name}</p>
                <p className="text-2xs text-ink-faint" role="status">
                  {f.status === "hashing" && "Generating integrity fingerprint…"}
                  {f.status === "uploading" && "Checking evidence integrity…"}
                  {f.status === "error" && f.error}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Evidence cards */}
      {c.evidence.length === 0 && localFiles.length === 0 ? (
        <EmptyState
          icon="📎"
          title="No evidence uploaded yet"
          body="Evidence is optional but makes your complaint stronger. You can also skip this and add files later through the tracking page."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.evidence.map((ev) => (
            <Card as="li" key={ev.evidenceId} className="flex flex-col p-4 animate-fade-in-up">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink" title={ev.originalName}>
                  {ev.originalName}
                </p>
                {/image\//.test(ev.mimeType) && (
                  <button
                    onClick={() => void runVision(ev)}
                    disabled={visionState[ev.evidenceId]?.loading}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-navy-border px-2 py-1 text-2xs font-medium text-navy transition-colors hover:bg-navy-tint disabled:opacity-60"
                  >
                    <SparkIcon />
                    Read details
                  </button>
                )}
              </div>
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

              {visionState[ev.evidenceId]?.loading && (
                <p role="status" className="mt-2 flex items-center gap-1.5 text-2xs text-navy">
                  <svg viewBox="0 0 20 20" className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                    <path d="M10 3a7 7 0 1 1-7 7" strokeLinecap="round" />
                  </svg>
                  Reading transaction details…
                </p>
              )}
              {visionState[ev.evidenceId]?.fields && (
                <div className="mt-2 rounded-control border border-navy-border bg-navy-tint/50 p-2.5 text-2xs leading-relaxed">
                  <Badge tone="info" icon={<SparkIcon />}>
                    Found in screenshot — verify in next steps
                  </Badge>
                  <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-[10px] text-navy-deep">
                    {JSON.stringify(visionState[ev.evidenceId].fields, null, 1)}
                  </pre>
                </div>
              )}
              {visionState[ev.evidenceId]?.reason && (
                <p className="mt-2 text-2xs leading-relaxed text-ink-soft">{visionState[ev.evidenceId].reason}</p>
              )}
            </Card>
          ))}
        </ul>
      )}

      {/* Paste transaction SMS */}
      {c.category === "financial_fraud" && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink">Have the bank SMS instead?</h3>
          <p className="mb-3 mt-1 text-xs text-ink-soft">Paste the transaction SMS — we'll extract UTR, amount and beneficiary automatically.</p>
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

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="lg" onClick={onBack}>
          ← Back
        </Button>
        <Button size="lg" onClick={onNext}>
          Continue to review
        </Button>
      </div>
    </div>
  );
}
