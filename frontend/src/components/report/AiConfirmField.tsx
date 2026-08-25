"use client";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Card";

/**
 * AI-suggested value with explicit human confirmation (§20).
 * AI never silently decides — every extracted field passes through here.
 */
export function AiConfirmField({
  label,
  value,
  onConfirm,
  onChange,
  type = "text",
  prefix,
}: {
  label: string;
  value: string;
  onConfirm: () => void;
  onChange: (v: string) => void;
  type?: string;
  prefix?: ReactNode;
}) {
  const [state, setState] = useState<"pending" | "confirmed" | "editing">("pending");

  if (state === "pending") {
    return (
      <div className="rounded-card border border-navy-border bg-navy-tint/50 p-3.5 animate-fade-in-up">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <Badge tone="info" icon={<SparkIcon />}>
              Detected automatically
            </Badge>
            <p className="mt-1.5 text-2xs text-ink-faint">{label}</p>
            <p className="mt-0.5 truncate font-mono text-sm font-medium text-ink">
              {prefix}
              {value}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setState("confirmed");
                onConfirm();
              }}
              className="rounded-control bg-ok px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#166a41]"
            >
              Looks correct
            </button>
            <button
              type="button"
              onClick={() => setState("editing")}
              className="rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-line-strong"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  const confirmed = state === "confirmed";
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-ink">
        <span>{label}</span>
        {confirmed && (
          <button type="button" onClick={() => setState("editing")} className="text-xs font-normal text-navy hover:underline">
            Edit
          </button>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={confirmed}
        aria-disabled={confirmed}
        className={`h-10 w-full rounded-control border bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/20 ${
          confirmed ? "border-line bg-paper text-ink-faint" : "border-line"
        }`}
      />
    </div>
  );
}

export const SparkIcon = () => (
  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden>
    <path d="M8 1.5 9.6 6l4.4 1.5L9.6 9 8 13.5 6.4 9 2 7.5 6.4 6 8 1.5ZM13 11l.8 2.2L16 14l-2.2.8L13 17l-.8-2.2L10 14l2.2-.8L13 11Z" transform="scale(.85)" />
  </svg>
);
