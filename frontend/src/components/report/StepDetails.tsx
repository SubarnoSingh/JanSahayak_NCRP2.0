"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, type IncidentCategory, type SuspectIdentifier } from "@/lib/types";
import { useComplaint } from "./context";
import { Badge } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AiConfirmField, SparkIcon } from "./AiConfirmField";

const CATEGORY_OPTIONS: { value: IncidentCategory; label: string; hint: string }[] = [
  { value: "financial_fraud", label: CATEGORY_LABELS.financial_fraud, hint: "Money was taken or nearly taken" },
  { value: "harassment_extortion", label: CATEGORY_LABELS.harassment_extortion, hint: "Threats, blackmail, abuse" },
  { value: "women_child_safety", label: CATEGORY_LABELS.women_child_safety, hint: "Privacy-focused reporting" },
  { value: "other_cyber_crime", label: CATEGORY_LABELS.other_cyber_crime, hint: "Hacking, fake profiles, other" },
];

const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Other bank"];

export function StepDetails({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const c = useComplaint();
  const [changingCategory, setChangingCategory] = useState(false);
  const [suspectInput, setSuspectInput] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const isFinancial = c.category === "financial_fraud";

  const setTransactionField = (field: keyof typeof c.transaction, value: string) => {
    const txn = { ...c.transaction, [field]: value };
    // Mark citizen-verified once they edit any field
    void patchIncident(c.incidentId, {
      transaction: {
        utr: txn.utr || undefined,
        amount: txn.amount ? Number(txn.amount.replace(/,/g, "")) : undefined,
        timestamp: txn.timestamp || undefined,
        senderBank: txn.senderBank || undefined,
        beneficiaryVpa: txn.beneficiaryVpa || undefined,
      },
    });
    c.update({ transaction: txn });
  };

  const confirmTxnHint = () => {
    if (!c.aiTransactionHints) return;
    const txn = {
      utr: c.transaction.utr || (c.aiTransactionHints.utr as string) || undefined,
      amount: Number(c.transaction.amount || c.aiTransactionHints.amount || 0) || undefined,
      timestamp: c.transaction.timestamp || undefined,
      senderBank: c.transaction.senderBank || undefined,
      beneficiaryVpa: c.transaction.beneficiaryVpa || undefined,
    };
    void patchIncident(c.incidentId, { transaction: txn });
    c.update({
      transaction: {
        utr: c.aiTransactionHints.utr ? String(c.aiTransactionHints.utr) : c.transaction.utr,
        amount: c.aiTransactionHints.amount != null ? String(c.aiTransactionHints.amount) : c.transaction.amount,
        timestamp: c.transaction.timestamp,
        senderBank: c.aiTransactionHints.senderBank ?? c.transaction.senderBank,
        beneficiaryVpa: c.aiTransactionHints.beneficiaryVpa ?? c.transaction.beneficiaryVpa,
      },
      aiTransactionHints: null,
    });
  };

  async function chooseCategory(cat: IncidentCategory) {
    c.update({ category: cat, categorySource: "citizen_confirmed" });
    setChangingCategory(false);
    try {
      await api.patch(`/incidents/${c.incidentId}`, { category: cat, categoryConfirmedByCitizen: true });
    } catch {
      /* non-fatal for demo */
    }
  }

  function addSuspect() {
    const raw = suspectInput.trim();
    if (raw.length < 4) return;
    const type = guessType(raw);
    const identifier: SuspectIdentifier = { type, value: raw };
    if (c.suspectIdentifiers.some((s) => s.value === raw)) return;
    const list = [...c.suspectIdentifiers, identifier];
    c.update({ suspectIdentifiers: list });
    setSuspectInput("");
    void patchIncident(c.incidentId, { suspectIdentifiers: list });
  }

  return (
    <div className="space-y-6">
      {/* Category confirmation */}
      {!changingCategory && c.category && (
        <div className="rounded-card border border-navy-border bg-navy-tint/50 p-4 animate-fade-in-up">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge tone="info" icon={<SparkIcon />}>
                Identified automatically
              </Badge>
              <p className="mt-2 text-sm text-ink">
                This looks like a <strong className="font-semibold">{CATEGORY_LABELS[c.category]}</strong> complaint.
                {c.categoryConfidence != null && (
                  <span className="ml-1.5 text-xs text-ink-faint">{Math.round(c.categoryConfidence * 100)}% match</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  c.update({ categorySource: "citizen_confirmed" });
                  await chooseCategory(c.category!);
                }}
                className="border-navy-border"
              >
                Looks correct
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setChangingCategory(true)}>
                Change
              </Button>
            </div>
          </div>
        </div>
      )}

      {(changingCategory || !c.category) && (
        <fieldset className="rounded-card border border-line bg-surface p-4">
          <legend className="px-1 text-sm font-semibold text-ink">What best describes what happened?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => void chooseCategory(opt.value)}
                className={`rounded-control border p-3.5 text-left transition-all hover:border-navy hover:bg-navy-tint/40 ${
                  c.category === opt.value ? "border-navy bg-navy-tint/50 ring-1 ring-navy" : "border-line bg-paper/60"
                }`}
              >
                <span className="block text-sm font-semibold text-ink">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-ink-faint">{opt.hint}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-2xs leading-relaxed text-ink-faint">
            Not sure? Pick the closest one — the investigating officer can re-classify after review.
          </p>
        </fieldset>
      )}

      {/* Financial fraud details */}
      {isFinancial && (
        <fieldset className="rounded-card border border-line bg-surface p-4 sm:p-5">
          <legend className="px-1 text-sm font-semibold text-ink">Transaction details</legend>
          <p className="mb-4 mt-2 text-xs leading-relaxed text-ink-soft">
            These help banks act quickly during the golden hour. Fill whatever you know — screenshots can fill the rest.
          </p>

          {c.aiTransactionHints && (c.aiTransactionHints.utr || c.aiTransactionHints.amount) && (
            <div className="mb-5 space-y-3">
              {c.aiTransactionHints.utr && (
                <AiConfirmField
                  label="Detected transaction reference (UTR)"
                  value={String(c.aiTransactionHints.utr)}
                  onConfirm={() => {
                    confirmTxnHint();
                  }}
                  onChange={() => undefined}
                />
              )}
              {c.aiTransactionHints.amount != null && !c.aiTransactionHints.utr && (
                <AiConfirmField
                  label="Detected transaction amount"
                  value={String(c.aiTransactionHints.amount)}
                  prefix="₹ "
                  type="text"
                  onConfirm={() => confirmTxnHint()}
                  onChange={() => undefined}
                />
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Amount lost"
              optional
              inputMode="decimal"
              value={c.transaction.amount}
              onChange={(e) => setTransactionField("amount", e.target.value)}
              placeholder="e.g. 35000"
            />
            <Input
              label="UTR / Reference number"
              optional
              inputMode="numeric"
              maxLength={12}
              value={c.transaction.utr}
              onChange={(e) => setTransactionField("utr", e.target.value.replace(/\D/g, ""))}
              placeholder="12-digit number"
              hint="Found in your payment app under transaction details."
            />
            <Input
              label="When did it happen?"
              optional
              type="datetime-local"
              value={c.transaction.timestamp}
              onChange={(e) => setTransactionField("timestamp", new Date(e.target.value).toISOString())}
            />
            <Select
              label="Your bank"
              optional
              options={[{ value: "", label: "Select bank" }, ...BANKS.map((b) => ({ value: b, label: b }))]}
              value={BANKS.includes(c.transaction.senderBank) ? c.transaction.senderBank : c.transaction.senderBank ? "Other bank" : ""}
              onChange={(e) => setTransactionField("senderBank", e.target.value)}
            />
            <Input
              label="Beneficiary UPI ID"
              optional
              value={c.transaction.beneficiaryVpa}
              onChange={(e) => setTransactionField("beneficiaryVpa", e.target.value)}
              placeholder="someone@upi"
              className="sm:col-span-2 font-mono"
            />
          </div>
        </fieldset>
      )}

      {/* Suspect identifiers for harassment/women-child/other */}
      {!isFinancial && (
        <fieldset className="rounded-card border border-line bg-surface p-4 sm:p-5">
          <legend className="px-1 text-sm font-semibold text-ink">Who is troubling you?</legend>
          <p className="mb-4 mt-2 text-xs leading-relaxed text-ink-soft">
            Add phone numbers, social media handles, profile links — anything that identifies them.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addSuspect();
            }}
          >
            <input
              value={suspectInput}
              onChange={(e) => setSuspectInput(e.target.value)}
              placeholder="+91 phone · @handle · link · email"
              aria-label="Add a suspect identifier"
              className="h-10 flex-1 rounded-control border border-line bg-surface px-3 font-mono text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
            <Button type="submit" variant="secondary" size="md" disabled={suspectInput.trim().length < 4}>
              Add
            </Button>
          </form>
          {c.suspectIdentifiers.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {c.suspectIdentifiers.map((s, i) => (
                <li key={`${s.value}-${i}`} className="flex items-center justify-between rounded-control bg-paper px-3 py-2">
                  <span className="min-w-0 truncate font-mono text-xs text-ink">{s.value}</span>
                  <span className="ml-2 flex shrink-0 items-center gap-2">
                    <Badge tone="neutral">{s.type}</Badge>
                    <button
                      type="button"
                      onClick={() => {
                        const list = c.suspectIdentifiers.filter((_, j) => j !== i);
                        c.update({ suspectIdentifiers: list });
                        void patchIncident(c.incidentId, { suspectIdentifiers: list });
                      }}
                      aria-label={`Remove ${s.value}`}
                      className="text-ink-faint transition-colors hover:text-danger"
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                        <path d="m4 4 8 8m0-8-8 8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}

      {/* Contact & privacy */}
      <ContactBlock
        onSave={async (contact, anonymousMode) => {
          setSavingContact(true);
          await patchIncident(c.incidentId, { citizenContact: contact, anonymousMode }).catch(() => undefined);
          c.update({ contact, anonymousMode });
          setSavingContact(false);
        }}
        saving={savingContact}
      />

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="lg" onClick={onBack}>
          ← Back
        </Button>
        <Button size="lg" onClick={onNext} disabled={!c.category}>
          Continue
        </Button>
      </div>
    </div>
  );
}

/* Contact & privacy with honest anonymous-mode explanation */
function ContactBlock({
  onSave,
  saving,
}: {
  onSave: (contact: { fullName: string; phone: string; email: string; state: string; district: string }, anonymousMode: boolean) => Promise<void>;
  saving: boolean;
}) {
  const c = useComplaint();
  const [anonymous, setAnonymous] = useState(c.anonymousMode);
  const [form, setForm] = useState(c.contact);

  return (
    <fieldset className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold text-ink">How should we reach you?</legend>

      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-control border border-line bg-paper/60 p-3.5 transition-colors has-[:checked]:border-ok has-[:checked]:bg-ok-tint/40">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#1e7f4f]"
        />
        <span>
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            Report anonymously
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-ok" fill="currentColor" aria-hidden>
              <path d="M8 1 2.5 3v4.2c0 3.3 2.3 6.3 5.5 7.3 3.2-1 5.5-4 5.5-7.3V3L8 1Zm-.4 10L5 8.4l1-1 1.6 1.55L11 5.6l1 1-4.4 4.4Z" />
            </svg>
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
            Your name and contact are not stored. The complaint is still fully investigated, but officers cannot call you
            for follow-up questions. Evidence metadata (like photo location info) is removed either way.
          </span>
        </span>
      </label>

      {!anonymous && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Full name" optional value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoComplete="name" />
          <Input label="Mobile number" optional type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" autoComplete="tel" />
          <Input label="Email" optional type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="State" optional value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <Input label="District" optional value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          </div>
          <p className="text-2xs leading-relaxed text-ink-faint sm:col-span-2">
            Contact details let the investigating officer reach you for verification — complaints with contact details move faster.
          </p>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button variant="secondary" size="sm" disabled={saving} onClick={() => void onSave(form, anonymous)}>
          {saving ? "Saving…" : "Save contact preference"}
        </Button>
      </div>
    </fieldset>
  );
}

async function patchIncident(incidentId: string | null, body: Record<string, unknown>): Promise<boolean> {
  if (!incidentId) return false;
  try {
    await api.patch(`/incidents/${incidentId}`, body);
    return true;
  } catch {
    return false;
  }
}

function guessType(raw: string): string {
  if (/^[\w.-]{2,}@[\w]{2,}$/.test(raw)) return "upi";
  if (/^(https?:\/\/|www\.)/i.test(raw)) return "url";
  if (/^@/.test(raw)) return "social";
  if (/^\+?\d[\d\s-]{7,}$/.test(raw)) return "phone";
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(raw)) return "email";
  return "other";
}
