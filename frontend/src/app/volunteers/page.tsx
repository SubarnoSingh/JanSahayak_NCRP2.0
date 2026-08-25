"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { SectionHeading } from "@/components/ui/Misc";

const ROLES = [
  {
    title: "Awareness ambassador",
    body: "Run cyber-safety sessions in schools, RWAs and community centers using official material.",
  },
  {
    title: "Report facilitator",
    body: "Help citizens — especially elders — file complaints correctly and completely.",
  },
  {
    title: "Trend watcher",
    body: "Flag emerging scam patterns in your region so alerts go out faster.",
  },
];

export default function VolunteersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", state: "" });

  const join = async () => {
    setError(null);
    setBusy(true);
    try {
      await api.post("/volunteers", { ...form, languages: [], interests: ["awareness"] });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit the application. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <SectionHeading
          eyebrow="Cyber Volunteers"
          title="Help make the internet safer"
          subtitle="Cyber Volunteers work with State Police cyber units to spread awareness, help citizens report correctly, and support digital-safety drives in their communities. No technical background needed — training is provided."
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {ROLES.map((r) => (
            <Card key={r.title} className="p-4">
              <h3 className="text-sm font-semibold text-ink">{r.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{r.body}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-6 p-5 sm:p-6">
          {!formOpen && !submitted && (
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
                Applications are reviewed by the state nodal officer. It takes about two minutes to apply.
              </p>
              <Button size="lg" onClick={() => setFormOpen(true)}>
                Become a Cyber Volunteer
              </Button>
            </div>
          )}

          {formOpen && !submitted && (
            <form
              className="space-y-4 animate-fade-in-up"
              onSubmit={(e) => {
                e.preventDefault();
                void join();
              }}
            >
              <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Mobile number" optional type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="State / UT" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
              {error && <p role="alert" className="text-xs text-danger">{error}</p>}
              <div className="flex gap-2.5">
                <Button variant="ghost" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "Submitting…" : "Submit application"}
                </Button>
              </div>
            </form>
          )}

          {submitted && (
            <div role="status" className="animate-fade-in-up text-center">
              <span aria-hidden className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ok-tint text-xl">✓</span>
              <h2 className="text-base font-semibold text-ink">Application received</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
                The state nodal officer will reach out on your email with next steps and training dates.
              </p>
            </div>
          )}
        </Card>

        <p className="mt-4 text-center text-2xs text-ink-faint">
          Volunteer registrations in this demo are stored locally as synthetic records only.
        </p>
      </main>
      <Footer />
    </div>
  );
}
