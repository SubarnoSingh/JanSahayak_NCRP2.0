"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ANONYMOUS_ALLOWED_CATEGORIES } from "@/lib/types";
import { useComplaint } from "./context";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { STATE_DISTRICTS, STATES } from "@/data/indiaLocations";

/**
 * Step 4 — Verify & sign.
 * Contact details → anonymous toggle (women/child safety only) → e-Pramaan OTP → submit.
 */
export function StepSign({ onBack, onSigned }: { onBack: () => void; onSigned: () => void }) {
  const c = useComplaint();
  const toast = useToast();

  /* ── Contact form state ── */
  const [form, setForm] = useState(c.contact);
  const [anonymous, setAnonymous] = useState(c.anonymousMode);
  const [savingContact, setSavingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  /* ── e-Pramaan state ── */
  const [vid, setVid] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedVid, setMaskedVid] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState<"challenge" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAllowAnonymous = ANONYMOUS_ALLOWED_CATEGORIES.includes(c.category!);
  const isAnonymous = anonymous && canAllowAnonymous;
  const contactValid = isAnonymous || (form.fullName.trim() && form.phone.trim() && form.email.trim() && form.state.trim() && form.district.trim());

  /* ── Save contact + anonymous ── */
  const saveContact = async () => {
    setContactError(null);
    if (!contactValid) {
      setContactError("Please fill in all required fields: full name, mobile number, email, state and district.");
      return;
    }
    setSavingContact(true);
    try {
      await api.patch(`/incidents/${c.incidentId}`, {
        citizenContact: isAnonymous ? undefined : form,
        anonymousMode: isAnonymous,
      });
      c.update({ contact: form, anonymousMode: isAnonymous });
      setContactSaved(true);
      if (isAnonymous) {
        toast.push({ tone: "info", title: "Anonymous mode enabled", body: "Your contact details will not be stored with this complaint." });
      }
    } catch {
      setContactError("Could not save contact details. Please try again.");
    } finally {
      setSavingContact(false);
    }
  };

  /* ── e-Pramaan: request OTP ── */
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

  /* ── e-Pramaan: verify OTP + sign ── */
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
    <div className="mx-auto max-w-lg space-y-6">
      {/* ── Contact details ── */}
      {!contactSaved && (
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-ink">Your contact information</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            This helps officers follow up on your case with verification questions.
          </p>

          {/* Anonymous toggle — only for women/child safety */}
          {canAllowAnonymous && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-control border border-line bg-paper/60 p-3.5 transition-colors has-[:checked]:border-ok has-[:checked]:bg-ok-tint/40">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#1e7f4f]"
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                  Submit anonymously
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-ok" fill="currentColor" aria-hidden>
                    <path d="M8 1 2.5 3v4.2c0 3.3 2.3 6.3 5.5 7.3 3.2-1 5.5-4 5.5-7.3V3L8 1Zm-.4 10L5 8.4l1-1 1.6 1.55L11 5.6l1 1-4.4 4.4Z" />
                  </svg>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                  Your name and contact details will not be stored with the complaint. Investigating officers may not be able
                  to contact you for follow-up questions. The complaint is still fully investigated.
                </span>
              </span>
            </label>
          )}

          {!isAnonymous && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoComplete="name" />
              <Input label="Mobile number" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" autoComplete="tel" />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="State"
                  options={[{ value: "", label: "Select" }, ...STATES.map((s) => ({ value: s, label: s }))]}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value, district: "" })}
                />
                <Select
                  label="District"
                  options={[
                    { value: "", label: form.state ? "Select district" : "Select state first" },
                    ...(STATE_DISTRICTS[form.state] ?? []).map((d) => ({ value: d, label: d })),
                  ]}
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  disabled={!form.state}
                />
              </div>
            </div>
          )}

          {isAnonymous && (
            <div className="mt-4 rounded-control border border-ok/30 bg-ok-tint/40 p-3.5">
              <p className="text-xs leading-relaxed text-ink-soft">
                <strong className="font-semibold text-ok">Anonymous mode enabled.</strong> Your personal details will not be
                stored. Officers will investigate based solely on the complaint description and evidence.
              </p>
            </div>
          )}

          {contactError && (
            <p role="alert" className="mt-3 rounded-control border border-danger/30 bg-danger-tint px-3 py-2 text-xs text-danger">
              {contactError}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <Button variant="secondary" size="md" disabled={savingContact} onClick={() => void saveContact()}>
              {savingContact ? "Saving…" : isAnonymous ? "Continue anonymously" : "Save contact details"}
            </Button>
          </div>
        </Card>
      )}

      {/* ── e-Pramaan Verification ── */}
      {contactSaved && (
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
                Signing confirms that the information you&apos;ve provided is true to the best of your knowledge. This demo uses
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
                onChange={(e) => { setVid(e.target.value.replace(/[^\d\s]/g, "")); setError(null); }}
                placeholder="e.g. 2345 6789 1234"
                hint="Demo only — use any made-up 12-digit number."
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
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(null); }}
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
      )}

      {/* ── Back ── */}
      <div className="flex justify-between">
        <Button variant="ghost" size="lg" onClick={onBack}>
          ← Back to review
        </Button>
      </div>
    </div>
  );
}
