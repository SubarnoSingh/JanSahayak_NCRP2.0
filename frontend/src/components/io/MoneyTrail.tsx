"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/Card";

export interface TrailNode {
  id: string;
  label: string;
  bank?: string;
  accountMasked?: string;
  vpa?: string;
  amount?: number;
  at?: string;
  status: string;
}
export interface TrailEdge {
  from: string;
  to: string;
  amount?: number;
  utr?: string;
  channel?: string;
}

const STATUS_TONE: Record<string, { tone: "danger" | "warn" | "ok" | "info" | "neutral"; label: string }> = {
  source: { tone: "neutral", label: "Source" },
  hold_requested: { tone: "warn", label: "Hold requested" },
  monitoring: { tone: "info", label: "Monitoring" },
  flagged: { tone: "danger", label: "Flagged" },
  frozen: { tone: "ok", label: "Frozen ✓" },
};

/** Money trail tree — victim → mule hops. Expandable nodes show hop detail. */
export function MoneyTrail({
  nodes,
  edges,
}: {
  nodes: TrailNode[];
  edges: TrailEdge[];
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const childrenOf = (id: string) => edges.filter((e) => e.from === id);

  const renderNode = (node: TrailNode, depth: number, edge?: TrailEdge) => {
    const kids = childrenOf(node.id);
    const meta = STATUS_TONE[node.status] ?? { tone: "neutral" as const, label: node.status };
    return (
      <li key={node.id} className="relative">
        {/* connector */}
        {depth > 0 && <span aria-hidden className="absolute -left-4 top-0 h-full w-px bg-line-strong" />}
        <button
          onClick={() => setExpanded((s) => ({ ...s, [node.id]: !s[node.id] }))}
          aria-expanded={Boolean(expanded[node.id])}
          className="group flex w-full items-start gap-3 rounded-control border border-line bg-surface px-3.5 py-3 text-left shadow-card transition-colors hover:border-navy-border"
          style={{ marginLeft: depth > 0 ? 0 : undefined }}
        >
          <span
            aria-hidden
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
              node.status === "frozen" ? "bg-ok" : node.status === "flagged" ? "bg-danger" : node.status === "hold_requested" ? "bg-warn" : node.id === "victim" ? "bg-navy" : "bg-ink-faint"
            }`}
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-ink">{node.label}</span>
              <Badge tone={meta.tone}>{meta.label}</Badge>
              {edge?.channel && <span className="text-2xs uppercase tracking-wide text-ink-faint">via {edge.channel}</span>}
            </span>
            {(node.bank || node.accountMasked || node.vpa) && (
              <span className="mt-0.5 block truncate font-mono text-xs text-ink-soft">
                {[node.bank, node.accountMasked, node.vpa].filter(Boolean).join(" · ")}
              </span>
            )}
            <span className="mt-0.5 block text-xs text-ink-faint">
              {node.amount != null ? `₹${node.amount.toLocaleString("en-IN")}` : "—"}
              {node.at && ` · ${new Date(node.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}`}
              {edge?.utr && ` · UTR ${edge.utr}`}
            </span>
          </span>
          {kids.length > 0 && (
            <svg
              viewBox="0 0 16 16"
              className={`mt-1 h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform ${expanded[node.id] ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <path d="m6 4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {expanded[node.id] && kids.length > 0 && (
          <ul className="ml-6 mt-1 space-y-1 border-l-2 border-dashed border-line pl-4 animate-fade-in-up">
            {kids.map((e) => {
              const child = nodes.find((n) => n.id === e.to);
              return child ? renderNode(child, depth + 1, e) : null;
            })}
          </ul>
        )}
      </li>
    );
  };

  const roots = nodes.filter((n) => !edges.some((e) => e.to === n.id));

  if (nodes.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line-strong p-6 text-center">
        <p className="text-sm text-ink-soft">No money trail traced yet.</p>
        <p className="mt-1 text-xs text-ink-faint">Trigger the CFCFRMS trace to map beneficiary layers.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 pl-2" aria-label="Money trail">
      {roots.map((n) => {
        const firstEdge = edges.find((e) => e.to === n.id);
        return renderNode(n, 0, firstEdge);
      })}
      <li className="pl-2 pt-1 text-2xs text-ink-faint">Tap any node to expand downstream transfers. Synthetic CFCFRMS data.</li>
    </ul>
  );
}
