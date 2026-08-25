"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/types";
import { useComplaint } from "./context";
import { Card, Badge, StatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReadinessPanel } from "@/components/ui/Misc";

export function StepReview({ onBack, onEdit, onNext }: { onBack: () => void; onEdit: (step: number) => void; onNext: () => void }) {
  const c = useComplaint();

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          {/* What happened */}
          <Card className="p-4 sm:p-5">
            <SectionHeader title="What happened" onEdit={() => onEdit(0)} />
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{c.narrative}</p>
          </Card>

          {/* Incident type */}
          <Card className="p-4 sm:p-5">
            <SectionHeader title="Incident type" onEdit={() => onEdit(1)} />
            <div className="flex items-center gap-2">
              <Badge tone="info">{CATEGORY_LABELS[c.category ?? "other_cyber_crime"]}</Badge>
              {c.categorySource === "citizen_confirmed" && <span className="text-2xs text-ok">confirmed by you</span>}
            </div>
          </Card>

          {/* Important details */}
          {(Object.values(c.transaction).some((v) => v) || c.suspectIdentifiers.length > 0) && (
            <Card className="p-4 sm:p-5">
              <SectionHeader title="Important details" onEdit={() => onEdit(1)} />
              {Object.values(c.transaction).some((v) => v) && (
                <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {c.transaction.amount && <Detail label="Amount" value={`₹${Number(c.transaction.amount).toLocaleString("en-IN")}`} />}
                  {c.transaction.utr && <Detail label="UTR / Reference" value={c.transaction.utr} mono />}
                  {c.transaction.timestamp && (
                    <Detail label="Transaction time" value={new Date(c.transaction.timestamp).toLocaleString("en-IN")} />
                  )}
                  {c.transaction.senderBank && <Detail label="Bank" value={c.transaction.senderBank} />}
                  {c.transaction.beneficiaryVpa && <Detail label="Beneficiary UPI" value={c.transaction.beneficiaryVpa} mono />}
                </dl>
              )}
              {c.suspectIdentifiers.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {c.suspectIdentifiers.map((s, i) => (
                    <li key={`${s.value}-${i}`} className="flex items-center gap-2 text-sm">
                      <Badge tone="neutral">{s.type}</Badge>
                      <span className="break-all font-mono text-xs">{s.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {/* Evidence */}
          <Card className="p-4 sm:p-5">
            <SectionHeader title="Evidence" onEdit={() => onEdit(2)} />
            <p className="text-sm text-ink">
              {c.evidence.length > 0
                ? `${c.evidence.length} file${c.evidence.length === 1 ? "" : "s"} · integrity verified`
                : "No files attached"}
            </p>
            {c.evidence.length > 0 && (
              <ul className="mt-2 space-y-1">
                {c.evidence.map((e) => (
                  <li key={e.evidenceId} className="flex items-center gap-2 text-xs text-ink-soft">
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-ok" fill="currentColor" aria-hidden>
                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm3.7-9.3-4.2 4.2a1 1 0 0 1-1.4 0L4.3 9.1a1 1 0 0 1 1.4-1.4l1.1 1.08 3.5-3.48a1 1 0 0 1 1.4 1.4Z" />
                    </svg>
                    <span className="truncate">{e.originalName}</span>
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-ink-faint">{e.sha256.slice(0, 10)}…</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Privacy + signature */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-4 sm:p-5">
              <SectionHeader title="Privacy" onEdit={() => onEdit(1)} />
              <StatusRow label="Anonymous mode" value={c.anonymousMode ? "On" : "Off"} tone={c.anonymousMode ? "ok" : undefined} />
              {!c.anonymousMode && c.contact.phone && <StatusRow label="Contact" value={c.contact.phone} />}
            </Card>
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-ink">Signature</h3>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <span className={`inline-block h-2 w-2 rounded-full ${c.signed ? "bg-ok" : "bg-warn"}`} aria-hidden />
                {c.signed ? "Digitally signed (demo)" : "Pending — next step"}
              </p>
            </Card>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="lg" onClick={onBack}>
              ← Back
            </Button>
            <Button size="lg" onClick={onNext} disabled={!c.incidentId}>
              Continue to verify & submit →
            </Button>
          </div>
        </div>

        <aside className="self-start lg:sticky lg:top-24">
          <ReadinessPanel score={c.readinessScore} breakdown={c.readinessBreakdown} />
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({ title, onEdit }: { title: string; onEdit?: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">{title}</h3>
      {onEdit && (
        <button onClick={onEdit} className="text-xs font-medium text-navy hover:underline">
          Edit
        </button>
      )}
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-2xs text-ink-faint">{label}</dt>
      <dd className={`font-medium text-ink ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone?: "ok" }) {
  return (
    <p className="mt-1 flex items-center justify-between text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className={`font-medium ${tone === "ok" ? "text-ok" : "text-ink"}`}>{value}</span>
    </p>
  );
}

/** Refresh readiness from the server when this step mounts. */
export function useRefreshReadiness() {
  const c = useComplaint();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!c.incidentId) return;
    setLoading(true);
    api
      .get<{ incident: { statutory_readiness_score: number; readiness_breakdown: { field: string; label: string; present: boolean }[] } }>(
        `/incidents/${c.incidentId}`
      )
      .then((res) =>
        c.update({ readinessScore: res.incident.statutory_readiness_score, readinessBreakdown: res.incident.readiness_breakdown })
      )
      .catch(() => undefined)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.incidentId]);
  return loading;
}
