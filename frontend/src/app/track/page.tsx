"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { CATEGORY_LABELS, STATUS_META, type TrackedComplaint } from "@/lib/types";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, Badge, StatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Misc";

function TrackContent() {
  const params = useSearchParams();
  const [ackInput, setAckInput] = useState("");
  const [complaint, setComplaint] = useState<TrackedComplaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (value: string) => {
    const ack = value.trim().toUpperCase();
    if (!ack) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ complaint: TrackedComplaint }>(`/complaints/track/${encodeURIComponent(ack)}`);
      setComplaint(res.complaint);
      // Live updates over socket.io
      try {
        getSocket().emit("incident:subscribe", res.complaint.acknowledgementNumber);
        getSocket().off("incident:status-update").on("incident:status-update", (payload: { acknowledgementNumber: string; status: string }) => {
          if (payload.acknowledgementNumber === res.complaint.acknowledgementNumber) {
            setComplaint((prev) => (prev ? { ...prev, status: payload.status as TrackedComplaint["status"] } : prev));
          }
        });
      } catch {
        /* live updates unavailable */
      }
    } catch (err) {
      setComplaint(null);
      setError(err instanceof ApiError ? err.message : "Tracking service is unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = params.get("ack");
    if (initial) {
      setAckInput(initial);
      void lookup(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Track your complaint</h1>
      <p className="mt-1 text-sm text-ink-soft">Enter the acknowledgment number from your confirmation.</p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(ackInput);
        }}
      >
        <label htmlFor="ack-input" className="sr-only">
          Acknowledgment number
        </label>
        <input
          id="ack-input"
          value={ackInput}
          onChange={(e) => {
            setAckInput(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="NCRP-2026-XXXXXX"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          className={`h-11 flex-1 rounded-control border bg-surface px-3.5 font-mono text-sm tracking-wide outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/20 ${
            error ? "border-danger" : "border-line"
          }`}
        />
        <Button type="submit" size="lg" disabled={loading} className="sm:w-36">
          {loading ? "Checking…" : "Track"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div aria-live="polite" className="mt-6">
        {!complaint && !loading && !error && (
          <EmptyState
            icon="🗂️"
            title="No complaint loaded yet"
            body={`Try the demo acknowledgment NCRP-2026-A1B2C3 to see a live example with synthetic data.`}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setAckInput("NCRP-2026-A1B2C3");
                  void lookup("NCRP-2026-A1B2C3");
                }}
              >
                Load demo complaint
              </Button>
            }
          />
        )}
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
        {complaint && <Timeline complaint={complaint} />}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <Suspense fallback={<Skeleton className="mx-auto h-64 max-w-2xl" />}>
          <TrackContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function Timeline({ complaint }: { complaint: TrackedComplaint }) {
  const flowStatuses = complaint.flow.map((f) => f.status);
  const currentIndex = flowStatuses.indexOf(complaint.status);
  const historyByStatus = new Map(complaint.statusHistory.map((h) => [h.status, h]));

  return (
    <div className="animate-fade-in-up">
      {/* Summary card */}
      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-faint">Acknowledgment</p>
            <p className="mt-0.5 font-mono text-lg font-bold text-navy">{complaint.acknowledgementNumber}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{CATEGORY_LABELS[complaint.category]}</Badge>
            <StatusBadge status={complaint.status} />
            {complaint.goldenHourActive && <Badge tone="warn">Golden-hour case</Badge>}
            {complaint.anonymousMode && <Badge tone="ok">Anonymous</Badge>}
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Submitted {new Date(complaint.submittedAt).toLocaleString("en-IN")} · Last update{" "}
          {new Date(complaint.lastUpdate).toLocaleString("en-IN")} · {complaint.evidenceCount} evidence file
          {complaint.evidenceCount === 1 ? "" : "s"}
        </p>
      </Card>

      {/* Timeline */}
      <Card className="p-5">
        <ol className="relative ml-1 space-y-6 border-l-2 border-line pl-6">
          {complaint.flow.map((stage) => {
            const done = currentIndex >= flowStatuses.indexOf(stage.status);
            const current = stage.status === complaint.status;
            const event = historyByStatus.get(stage.status);
            const isTerminal = stage.status === "fir_registered";
            return (
              <li key={stage.status} className="relative">
                <span
                  aria-hidden
                  className={`absolute -left-[31px] top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${
                    current
                      ? "border-navy bg-navy"
                      : done || isTerminal && currentIndex > 0
                        ? "border-ok bg-ok"
                        : "border-line-strong bg-surface"
                  }`}
                >
                  {(done || current) && (
                    <svg viewBox="0 0 12 12" className={`h-2.5 w-2.5 ${current ? "text-white" : "text-white"}`} fill="currentColor">
                      <path d="m4.8 8.6-2.4-2.4.9-.9 1.5 1.5 3.9-3.9.9.9-4.8 4.8Z" />
                    </svg>
                  )}
                </span>
                <p className={`text-sm font-semibold ${done || current ? "text-ink" : "text-ink-faint"}`}>
                  {stage.citizenLabel}
                  {current && <span className="ml-2 rounded-full bg-navy-tint px-2 py-0.5 text-2xs font-medium text-navy">Current status</span>}
                </p>
                {event?.at && (
                  <p className="mt-0.5 text-xs text-ink-faint">{new Date(event.at).toLocaleString("en-IN")}</p>
                )}
                {event?.note && <p className="mt-0.5 text-xs text-ink-soft">{event.note}</p>}
              </li>
            );
          })}
        </ol>
        <p className="mt-5 border-t border-line pt-3 text-2xs leading-relaxed text-ink-faint">
          Status data in this demo is synthetic and not connected to official NCRP systems.
        </p>
      </Card>
    </div>
  );
}
