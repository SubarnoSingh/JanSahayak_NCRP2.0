"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { SuspectCheck } from "@/components/landing/SuspectCheck";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { SectionHeading, Skeleton } from "@/components/ui/Misc";

function ProtectContent() {
  const params = useSearchParams();
  const [tab, setTab] = useState<"check" | "report">(params.get("tab") === "report" ? "report" : "check");

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeading
        eyebrow="Proactive defense"
        title="Check before you trust. Report early."
        subtitle="Most scams repeat — the same numbers, UPI IDs and websites are used against many people at once. Your checks and reports build the public warning system."
      />

      {/* Tabs */}
      <div role="tablist" aria-label="Protect actions" className="mt-6 flex gap-1 rounded-control border border-line bg-surface p-1">
        {(
          [
            ["check", "Check a suspect"],
            ["report", "Report a scam attempt"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-[6px] py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-navy text-white" : "text-ink-soft hover:bg-paper"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "check" ? (
          <Card className="p-5 sm:p-6 animate-fade-in-up">
            <h2 className="text-base font-semibold text-ink">Has this number, UPI ID or website been reported before?</h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-ink-soft">
              Works with Indian phone numbers, UPI handles, websites, emails and social handles.
            </p>
            <SuspectCheck compact />
            <p className="mt-4 border-t border-line pt-3 text-2xs leading-relaxed text-ink-faint">
              Demo tip: try +91-98765-43210, scammer.refund@okaxis or secure-sbi-kyc.xyz to see synthetic results.
            </p>
          </Card>
        ) : (
          <ReportSuspectForm />
        )}
      </div>
    </div>
  );
}

function ReportSuspectForm() {
  const [identifier, setIdentifier] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ message: string; reportCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setResult(null);
    if (identifier.trim().length < 3) {
      setError("Enter a phone number, UPI ID, URL or social handle.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<{ message: string; suspect: { reportCount: number } }>("/suspects/report", {
        identifier: identifier.trim(),
        category: category || undefined,
        note: note || undefined,
      });
      setResult({ message: res.message, reportCount: res.suspect.reportCount });
      setIdentifier("");
      setNote("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not file the report. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6 animate-fade-in-up">
      <h2 className="text-base font-semibold text-ink">Received a suspicious call, SMS or link but didn't lose money?</h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        Reporting an attempt takes under a minute and warns everyone who checks this identifier later.
      </p>
      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Input
          label="What are you reporting?"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="+91 phone · someone@upi · https://website · @handle"
          hint="Only the identifier is stored publicly. Your personal details are not attached."
          error={error}
          className="font-mono"
        />
        <Select
          label="Scam type"
          optional
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: "", label: "Select (if you know)" },
            { value: "financial_fraud", label: "Financial fraud" },
            { value: "harassment_extortion", label: "Harassment / extortion" },
            { value: "phishing", label: "Phishing link / message" },
            { value: "impersonation", label: "Fake official / customer care" },
            { value: "other", label: "Something else" },
          ]}
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            What happened <span className="text-xs font-normal text-ink-faint">(optional)</span>
          </span>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="One line about the call, message or link…"
            className="w-full resize-none rounded-control border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </label>
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? "Submitting…" : "Report suspect"}
        </Button>
      </form>

      {result && (
        <div role="status" className="mt-4 flex items-start gap-3 rounded-card border border-ok/30 bg-ok-tint/50 p-4 animate-fade-in-up">
          <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-ok" fill="currentColor" aria-hidden>
            <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3-4.2 4.2a1 1 0 0 1-1.4 0l-2.1-2.1a1 1 0 0 1 1.4-1.4l1.4 1.36 3.5-3.44a1 1 0 0 1 1.4 1.38Z" />
          </svg>
          <div>
            <Badge tone="ok">{result.reportCount} total report{result.reportCount === 1 ? "" : "s"} now</Badge>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{result.message}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ProtectPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-3xl" />}>
          <ProtectContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
