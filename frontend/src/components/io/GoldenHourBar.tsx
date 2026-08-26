"use client";
import { useEffect, useState } from "react";

/** Ticking countdown for the financial-fraud golden hour (2h window). */
export function GoldenHourBar({
  startedAt,
  windowMinutes = 120,
  stages,
}: {
  startedAt: string;
  windowMinutes?: number;
  stages: { bankNotifiedAt?: string; holdRequestedAt?: string; freezeConfirmedAt?: string };
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const startMs = new Date(startedAt).getTime();
  const isValidStart = Number.isFinite(startMs) && startMs > 0;

  if (!isValidStart) {
    return (
      <section aria-label="Golden hour response window" className="rounded-card border border-white/10 bg-white/[0.04] p-4 text-white/60">
        <p className="text-sm">Response window unavailable — transaction timing not recorded.</p>
      </section>
    );
  }

  const end = startMs + windowMinutes * 60_000;
  const remaining = Math.max(0, end - now);
  const elapsedPct = Math.min(100, ((now - startMs) / (end - startMs)) * 100);

  const mm = Math.floor(remaining / 60_000);
  const ss = Math.floor((remaining % 60_000) / 1000);
  const expired = remaining === 0;

  const stageList = [
    { key: "txn", label: "Transaction detected", at: startedAt },
    { key: "bank", label: "Bank notified", at: stages.bankNotifiedAt },
    { key: "hold", label: "Hold requested", at: stages.holdRequestedAt },
    { key: "freeze", label: "Freeze confirmed", at: stages.freezeConfirmedAt },
  ];

  return (
    <section aria-label="Golden hour response window" className="rounded-card border border-warn/30 bg-[#2a2118] p-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden className="relative flex h-2.5 w-2.5">
            {!expired && <span className="absolute h-full w-full animate-ping rounded-full bg-saffron/50" />}
            <span className={`h-2.5 w-2.5 rounded-full ${expired ? "bg-white/40" : "bg-saffron"}`} />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/60">Response window</p>
            <p className={`font-mono text-2xl font-bold tabular-nums leading-none ${expired ? "text-white/50 line-through decoration-1" : ""}`}>
              {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
              {!expired && <span className="text-sm font-medium text-white/50"> left</span>}
            </p>
          </div>
        </div>
        <p className="max-w-xs text-right text-2xs leading-relaxed text-white/55">
          {expired
            ? "Window elapsed — recovery still possible but success rates drop sharply."
            : "Early bank intervention maximizes the chance of freezing funds before withdrawal."}
        </p>
      </div>

      {/* progress */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(elapsedPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Golden hour elapsed"
        className="mt-3 h-1 overflow-hidden rounded-full bg-white/15"
      >
        <div className="h-full bg-gradient-to-r from-ok via-saffron to-danger transition-all duration-1000" style={{ width: `${elapsedPct}%` }} />
      </div>

      <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
        {stageList.map((s) => {
          const done = Boolean(s.at);
          return (
            <li key={s.key} className="flex items-center gap-1.5 text-2xs text-white/70">
              <span
                aria-hidden
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
                  done ? "bg-ok text-[#08130c]" : "border border-white/25"
                }`}
              >
                {done && (
                  <svg viewBox="0 0 12 12" className="h-2 w-2" fill="currentColor">
                    <path d="m4.8 8.6-2.4-2.4.9-.9 1.5 1.5 3.9-3.9.9.9-4.8 4.8Z" />
                  </svg>
                )}
              </span>
              {s.label}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
