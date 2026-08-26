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
            <Badge tone="info" icon={<CheckIcon />}>
              Found in evidence
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

export const CheckIcon = () => (
  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden>
    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm3.7-9.3-4.2 4.2a1 1 0 0 1-1.4 0L4.3 9.1a1 1 0 0 1 1.4-1.4l1.1 1.08 3.5-3.48a1 1 0 0 1 1.4 1.4Z" />
  </svg>
);
