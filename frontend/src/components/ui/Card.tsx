import type { ReactNode } from "react";
import type { IncidentStatus } from "@/lib/types";

export function Card({
  children,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <As className={`rounded-card border border-line bg-surface shadow-card ${className}`}>{children}</As>
  );
}

type Tone = "ok" | "warn" | "danger" | "info" | "neutral" | "saffron";

const toneClasses: Record<Tone, string> = {
  ok: "bg-ok-tint text-ok",
  warn: "bg-warn-tint text-warn",
  danger: "bg-danger-tint text-danger",
  info: "bg-navy-tint text-navy",
  neutral: "bg-paper text-ink-soft border border-line",
  saffron: "bg-saffron-tint text-saffron-deep",
};

export function Badge({
  tone = "neutral",
  children,
  icon,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-2xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

const statusToneMap: Record<string, Tone> = {
  draft: "neutral",
  signed: "info",
  submitted: "info",
  verified: "ok",
  assigned: "info",
  investigation: "warn",
  fir_registered: "ok",
  closed: "neutral",
};

const statusLabelMap: Record<string, string> = {
  draft: "Draft",
  signed: "Signed",
  submitted: "Submitted",
  verified: "Verified",
  assigned: "Assigned for review",
  investigation: "Under investigation",
  fir_registered: "FIR registered / action taken",
  closed: "Closed",
};

export function StatusBadge({ status, className = "" }: { status: IncidentStatus; className?: string }) {
  const tone = statusToneMap[status] ?? "neutral";
  return (
    <Badge tone={tone} className={className}>
      {status !== "submitted" && (
        <svg viewBox="0 0 12 12" className="h-2 w-2" fill="currentColor" aria-hidden>
          <circle cx="6" cy="6" r="3" />
        </svg>
      )}
      {statusLabelMap[status] ?? status}
    </Badge>
  );
}
