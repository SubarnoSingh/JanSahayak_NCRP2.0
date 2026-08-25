"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useComplaint } from "./context";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

/**
 * Demo e-sign flow (mock e-Pramaan).
 * Synthetic Virtual ID only — no real Aadhaar data is stored anywhere.
 */
export function StepSign({ onBack, onSigned }: { onBack: () => void; onSigned: () => void }) {
  const c = useComplaint();
  const toast = useToast();
  const [vid, setVid] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedVid, setMaskedVid] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState<"challenge" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestOtp = async () => {
    setError(null);
    if (!/^\d{12}$/.test(vid.replace(/\s/g, ""))) {
      setError("Enter a valid 12-digit Aadhaar Virtual ID — any synthetic number works in this demo.");
      return;
    }
    setBusy("challenge");
    try {
      const res = await api.post<{ challengeId: string; maskedVid: string; demoHint: string }>(
        `/incidents/${c.incidentId}/sign/challenge`,
        { virtualId: vid.replace(/\s/g, "") }
      );
      setChallengeId(res.challengeId);
      setMaskedVid(res.maskedVid);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start verification. Please retry.");
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    setError(null);
    setBusy("verify");
    try {
      await api.post(`/incidents/${c.incidentId}/sign/complete`, { challengeId, otp });
      c.update({ signed: true });
      toast.push({ tone: "ok", title: "Complaint digitally signed", body: "Demo signature applied via simulated e-Pramaan." });
      onSigned();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-tint text-navy">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 3.5h8.5L16 7v9.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-13Z" strokeLinejoin="round" />
              <path d="m7.2 11.4 1.8 1.8 3.6-3.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Your complaint needs to be digitally verified before submission</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Signing confirms that the information you've provided is true to the best of your knowledge. This demo uses
              a simulated Aadhaar-based OTP flow — <strong className="font-medium">never enter real Aadhaar numbers here.</strong>
            </p>
          </div>
        </div>

        {!challengeId ? (
          <div className="mt-5 space-y-4">
            <Input
              label="Aadhaar Virtual ID (demo)"
              inputMode="numeric"
              maxLength={14}
              value={vid}
              onChange={(e) => {
                setVid(e.target.value.replace(/[^\d\s]/g, ""));
                setError(null);
              }}
              placeholder="e.g. 2345 6789 1234"
              hint="Demo only — use any made-up 12-digit number. Real Aadhaar data is never requested or stored."
              error={error}
            />
            <Button size="lg" className="w-full" onClick={() => void requestOtp()} disabled={busy === "challenge"}>
              {busy === "challenge" ? "Sending OTP…" : "Send OTP"}
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4 animate-fade-in-up">
            <div className="rounded-control border border-ok/30 bg-ok-tint/50 px-4 py-3">
              <p className="text-xs leading-relaxed text-ink-soft">
                OTP sent to the mobile linked with <span className="font-mono font-medium">{maskedVid}</span>.
                <br />
                <strong className="font-semibold text-ok">Demo mode — use OTP 123456</strong>
              </p>
            </div>
            <Input
              label="Enter 6-digit OTP"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              error={error}
              aria-describedby={undefined}
            />
            <div className="flex gap-2.5">
              <Button variant="ghost" size="lg" onClick={() => { setChallengeId(null); setOtp(""); }}>
                Change ID
              </Button>
              <Button size="lg" className="flex-1" onClick={() => void verify()} disabled={busy === "verify" || otp.length !== 6}>
                {busy === "verify" ? "Verifying…" : "Verify & sign"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-5 flex justify-between">
        <Button variant="ghost" size="lg" onClick={onBack}>
          ← Back to review
        </Button>
      </div>
    </div>
  );
}
