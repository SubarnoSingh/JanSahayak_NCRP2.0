import type { ReactNode } from "react";
import type { ReadinessField } from "@/lib/types";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`${align === "center" ? "text-center mx-auto" : ""} max-w-2xl`}>
      {eyebrow && (
        <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-saffron-deep">{eyebrow}</p>
      )}
      <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({
  icon = "🔍",
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-paper/60 px-6 py-10 text-center">
      <span aria-hidden className="mb-3 text-2xl opacity-60">{icon}</span>
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-faint">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ReadinessPanel({
  score,
  breakdown,
}: {
  score: number;
  breakdown: ReadinessField[];
}) {
  const tone = score >= 75 ? "bg-ok" : score >= 45 ? "bg-warn" : "bg-navy";
  const message =
    score >= 90
      ? "Ready to submit."
      : score >= 70
        ? "You're almost ready to submit."
        : score >= 40
          ? "Good progress — a few details remain."
          : "Let's add more information for a stronger complaint.";

  return (
    <section aria-label="Complaint readiness" className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-ink">Complaint readiness</h3>
        <span className="text-lg font-semibold tabular-nums text-ink">{score}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Complaint readiness ${score} percent`}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
      >
        <div className={`h-full rounded-full transition-all duration-500 ${tone}`} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink-soft">{message}</p>
      <ul className="mt-3 space-y-1.5">
        {breakdown.map((f) => (
          <li key={f.field} className="flex items-center gap-2 text-xs">
            {f.present ? (
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-ok" fill="currentColor" aria-hidden>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm3.7-9.3-4.2 4.2a1 1 0 0 1-1.4 0L4.3 9.1a1 1 0 0 1 1.4-1.4l1.1 1.08 3.5-3.48a1 1 0 0 1 1.4 1.4Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-line-strong" fill="currentColor" aria-hidden>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            )}
            <span className={f.present ? "text-ink-soft" : "text-ink-faint"}>{f.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
