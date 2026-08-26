"use client";
import { useI18n } from "@/lib/i18n";

export const STEPS = [
  { num: "01", key: "Tell us what happened" },
  { num: "02", key: "Add evidence" },
  { num: "03", key: "Review" },
  { num: "04", key: "Verify & sign" },
] as const;

export function Stepper({ current, onJump }: { current: number; onJump?: (step: number) => void }) {
  const visible = STEPS.map((s, i) => ({ ...s, index: i, state: i < current ? "done" : i === current ? "active" : "todo" }));

  return (
    <nav aria-label="Complaint progress">
      {/* Desktop */}
      <ol className="hidden items-center gap-1 lg:flex">
        {visible.map((s) => (
          <li key={s.num} className="flex min-w-0 items-center gap-1">
            <button
              onClick={() => s.state === "done" && onJump?.(s.index)}
              aria-current={s.state === "active" ? "step" : undefined}
              disabled={s.state !== "done"}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                s.state === "active"
                  ? "bg-navy-tint text-navy"
                  : s.state === "done"
                    ? "text-ink-soft hover:bg-paper hover:text-navy"
                    : "text-ink-faint/70"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  s.state === "active"
                    ? "bg-navy text-white"
                    : s.state === "done"
                      ? "bg-ok text-white"
                      : "border border-line-strong bg-surface"
                }`}
              >
                {s.state === "done" ? (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor" aria-hidden>
                    <path d="m4.8 8.6-2.4-2.4.9-.9 1.5 1.5 3.9-3.9.9.9-4.8 4.8Z" />
                  </svg>
                ) : (
                  s.num
                )}
              </span>
              <span className="whitespace-nowrap">{s.key}</span>
            </button>
            {s.index < visible.length - 1 && (
              <span aria-hidden className={`h-px w-4 ${s.state === "done" ? "bg-ok/50" : "bg-line-strong"}`} />
            )}
          </li>
        ))}
      </ol>

      {/* Mobile compact progress */}
      <div className="lg:hidden">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold text-ink">
            {STEPS[Math.min(current, STEPS.length - 1)].num} · {STEPS[Math.min(current, STEPS.length - 1)].key}
          </p>
          <p className="text-2xs text-ink-faint">Step {Math.min(current + 1, STEPS.length)} of {STEPS.length}</p>
        </div>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i < current ? "bg-ok" : i === current ? "bg-navy" : "bg-line-strong"}`}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

export function StepShell({
  title,
  intro,
  children,
  aside,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section aria-label={title} className="animate-fade-in-up">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {intro && <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">{intro}</p>}
        <div className="mt-5 space-y-5">{children}</div>
      </section>
      {aside && <aside className="space-y-4 self-start lg:sticky lg:top-24">{aside}</aside>}
    </div>
  );
}
