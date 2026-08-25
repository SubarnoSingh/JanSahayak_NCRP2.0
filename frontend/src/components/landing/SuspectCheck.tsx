"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { SuspectResult } from "@/lib/types";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Misc";

export function SuspectCheck({ initialIdentifier = "", compact = false }: { initialIdentifier?: string; compact?: boolean }) {
  const [value, setValue] = useState(initialIdentifier);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SuspectResult[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!value.trim()) {
      setError("Enter a phone number, UPI ID or website to check.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ results: SuspectResult[]; notice?: string }>("/suspects/search", {
        identifier: value,
      });
      setResults(res.results);
      setNotice(res.notice ?? null);
    } catch (err) {
      setResults([]);
      setError(err instanceof ApiError ? err.message : "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <label htmlFor={`suspect-check-${compact ? "c" : "f"}`} className="sr-only">
          Phone number, UPI ID or website
        </label>
        <input
          id={`suspect-check-${compact ? "c" : "f"}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="+91 phone · someone@upi · https://website"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          className={`h-11 flex-1 rounded-control border bg-surface px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint/70 focus:border-navy focus:ring-2 focus:ring-navy/20 ${
            error ? "border-danger" : "border-line"
          }`}
        />
        <Button type="submit" size="lg" disabled={loading} className="sm:w-32">
          {loading ? "Checking…" : "Check"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div aria-live="polite" className="mt-4">
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        )}

        {!loading && results === null && !compact && (
          <EmptyState
            icon="🛡️"
            title="Nothing checked yet"
            body="Enter any phone number, UPI ID, website or social handle above. If others have reported it, you'll see it here instantly."
          />
        )}

        {!loading && results && results.length === 0 && (
          <EmptyState
            icon="✅"
            title="No reports found for this identifier"
            body="This number, ID or website has no prior reports in our records. That's reassuring — stay alert regardless."
          />
        )}

        {!loading &&
          results?.map((r) => (
            <Card key={r.normalizedIdentifier} className="mb-2.5 p-4 animate-fade-in-up">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="font-mono text-sm font-medium break-all text-ink">{r.identifier}</span>
                <Badge tone={r.reportCount > 20 ? "danger" : r.reportCount > 5 ? "warn" : "info"}>
                  {r.reportCount} report{r.reportCount === 1 ? "" : "s"}
                </Badge>
                <Badge tone="neutral">{r.type.toUpperCase()}</Badge>
                {r.status === "action_taken" && <Badge tone="ok">Action taken</Badge>}
                {r.status === "flagged" && <Badge tone="danger">Flagged</Badge>}
              </div>
              <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-ink-faint">
                {r.categories.map((c) => (
                  <span key={c}>{c.replace(/_/g, " ")}</span>
                ))}
                {r.lastReportedAt && (
                  <span>· last reported {new Date(r.lastReportedAt).toLocaleDateString("en-IN")}</span>
                )}
              </p>
              {r.recentActivity.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-line pt-2">
                  {r.recentActivity.slice(-2).map((a, i) => (
                    <li key={i} className="text-xs leading-relaxed text-ink-soft">
                      <span aria-hidden className="mr-1.5">•</span>
                      {a.note}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}

        {notice && <p className="mt-2 text-2xs text-ink-faint">{notice}</p>}
      </div>
    </div>
  );
}
