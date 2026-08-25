"use client";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { ComplaintProvider, useComplaint } from "@/components/report/context";
import { Stepper, StepShell } from "@/components/report/Stepper";
import { VoiceDescribe } from "@/components/report/VoiceDescribe";
import { StepDetails } from "@/components/report/StepDetails";
import { StepEvidence } from "@/components/report/StepEvidence";
import { StepReview, useRefreshReadiness } from "@/components/report/StepReview";
import { StepSign } from "@/components/report/StepSign";
import { SuccessScreen } from "@/components/report/SuccessScreen";
import { Button } from "@/components/ui/Button";
import { ReadinessPanel, Skeleton } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import type { Incident } from "@/lib/types";

export default function ReportPage() {
  return (
    <ComplaintProvider>
      <ReportFlow />
    </ComplaintProvider>
  );
}

function ReportFlow() {
  const c = useComplaint();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const prefillDone = useRef(false);

  useEffect(() => {
    if (prefillDone.current) return;
    prefillDone.current = true;
    const launcherText = window.sessionStorage.getItem("ncrp.launcher.text");
    if (launcherText && !c.narrative) c.update({ narrative: launcherText });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If a signed draft exists (refresh mid-flow), jump back to review.
  useEffect(() => {
    if (c.acknowledgementNumber) setStep(5);
    else if (c.signed && step === 0) setStep(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Create the incident server-side and run AI classification. */
  const createIncident = async () => {
    setCreating(true);
    setSubmitError(null);
    try {
      const res = await api.post<{ incident: Incident }>("/incidents", {
        narrative: c.narrative.trim(),
        language: c.language,
        anonymousMode: c.anonymousMode,
      });
      const incident = res.incident;
      c.update({
        incidentId: incident.id,
        category: incident.incident_category,
        categorySource: incident.categorySource ?? "ai",
        categoryConfidence: incident.categoryConfidence ?? null,
        readinessScore: incident.statutory_readiness_score,
        readinessBreakdown: incident.readiness_breakdown,
      });
      if (incident.financial_transactions?.[0]) {
        const t = incident.financial_transactions[0];
        c.update({
          aiTransactionHints: t.utr || t.amount ? t : null,
          transaction: {
            ...c.transaction,
            amount: t.amount != null ? String(t.amount) : "",
            utr: t.utr ?? "",
            beneficiaryVpa: t.beneficiaryVpa ?? "",
          },
        });
      }
      if (incident.suspect_identifiers?.length > 0) {
        c.update({ suspectIdentifiers: incident.suspect_identifiers });
      }
      toast.push({
        tone: "info",
        title: "We've read your description",
        body: "Check the suggested incident type on the next step — you can change it anytime.",
      });
      setStep(1);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not start your complaint. Please try again.";
      setSubmitError(message);
    } finally {
      setCreating(false);
    }
  };

  const submitFinal = async () => {
    setSubmitError(null);
    try {
      const res = await api.post<{ acknowledgementNumber: string; goldenHourActive: boolean }>(
        `/incidents/${c.incidentId}/submit`
      );
      c.update({ acknowledgementNumber: res.acknowledgementNumber, goldenHourActive: res.goldenHourActive });
      setStep(5);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Submission failed. Please try again in a moment.";
      setSubmitError(message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Header block */}
        <div className="mb-6">
          <p className="text-2xs font-semibold uppercase tracking-wider text-saffron-deep">Complaint workspace</p>
          <div className="mt-2">
            <Stepper current={step} onJump={(s) => setStep(s)} />
          </div>
        </div>

        {step === 0 &&
          (creating ? (
            <ProcessingState title="Reading your description…" body="Identifying the incident type and key details." />
          ) : (
            <StepShell
              title="Tell us what happened"
              intro="Write it the way you'd tell a friend. Dates, amounts, phone numbers — whatever you remember."
              aside={<ReadinessPanel score={c.readinessScore} breakdown={c.readinessBreakdown} />}
            >
              <VoiceDescribe value={c.narrative} onChange={(narrative) => c.update({ narrative })} onSubmit={() => void createIncident()} />
              {submitError && (
                <p role="alert" className="rounded-control border border-danger/30 bg-danger-tint px-3 py-2 text-xs text-danger">
                  {submitError}
                </p>
              )}
            </StepShell>
          ))}

        {step === 1 && (
          <StepShell
            title="Add important details"
            intro="Only what's relevant to your case — we've pre-filled what we could detect."
            aside={<ReadinessPanel score={c.readinessScore} breakdown={c.readinessBreakdown} />}
          >
            <StepDetails onBack={() => setStep(0)} onNext={() => setStep(2)} />
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            title="Add evidence"
            intro="Screenshots, receipts, chats — anything that supports what happened."
            aside={<ReadinessPanel score={c.readinessScore} breakdown={c.readinessBreakdown} />}
          >
            <StepEvidence onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </StepShell>
        )}

        {step === 3 && (
          <>
            <StepReview onBack={() => setStep(2)} onEdit={(s) => setStep(s)} onNext={() => setStep(4)} />
          </>
        )}

        {step === 4 && (
          <>
            <SubmitGate onBack={() => setStep(3)} onSigned={() => undefined} submitError={submitError} onSubmit={() => void submitFinal()} />
          </>
        )}

        {step === 5 && <SuccessScreen onNewComplaint={() => window.location.reload()} />}
      </main>
      <Footer />
    </div>
  );
}

/**
 * Sign step + final submission trigger.
 * Keeps the wizard contract clean: sign completes → Submit button activates.
 */
function SubmitGate({
  onBack,
  onSigned,
  submitError,
  onSubmit,
}: {
  onBack: () => void;
  onSigned: () => void;
  submitError: string | null;
  onSubmit: () => void;
}) {
  const c = useComplaint();
  return (
    <div className="space-y-6">
      <StepSignWrapper onBack={onBack} onSigned={onSigned} />
      {c.signed && (
        <div className="mx-auto max-w-lg animate-fade-in-up text-center">
          <Button size="xl" className="w-full" onClick={onSubmit}>
            Submit complaint
          </Button>
          <p className="mt-2 text-2xs text-ink-faint">
            After submission you'll receive an acknowledgment number for tracking.
          </p>
          {submitError && (
            <p role="alert" className="mt-3 rounded-control border border-danger/30 bg-danger-tint px-3 py-2 text-xs text-danger">
              {submitError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StepSignWrapper({ onBack, onSigned }: { onBack: () => void; onSigned: () => void }) {
  useRefreshReadiness();
  return <StepSign onBack={onBack} onSigned={onSigned} />;
}

function ProcessingState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-card border border-line bg-surface p-8 text-center shadow-card">
      <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 animate-spin text-navy" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 3a9 9 0 1 1-9 9" strokeLinecap="round" />
      </svg>
      <h2 className="mt-4 text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
      <Skeleton className="mx-auto mt-5 h-3 w-48" />
      <Skeleton className="mx-auto mt-2 h-3 w-36" />
    </div>
  );
}
