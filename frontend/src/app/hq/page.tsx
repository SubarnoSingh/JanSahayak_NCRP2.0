"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, API_URL } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useHqAuth, HqAuthProvider, type Officer } from "@/components/io/auth";
import { GoldenHourBar } from "@/components/io/GoldenHourBar";
import { MoneyTrail, type TrailEdge, type TrailNode } from "@/components/io/MoneyTrail";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Misc";
import { EvidenceImage } from "@/components/io/EvidenceImage";
import { CATEGORY_LABELS, isFinancialFraud, type IncidentStatus } from "@/lib/types";

export default function HqPage() {
  return (
    <HqAuthProvider>
      <HqInner />
    </HqAuthProvider>
  );
}

interface QueueItem {
  id: string;
  acknowledgementNumber: string | null;
  category: string;
  confidence?: number;
  status: string;
  readinessScore: number;
  amount?: number;
  utr?: string;
  vpa?: string;
  suspects?: string[];
  evidenceCount: number;
  anonymousMode: boolean;
  language: string;
  goldenHourActive: boolean;
  goldenHourStartedAt?: string;
  preview?: string;
  createdAt: string;
}

function HqInner() {
  const { token, officer, logout } = useHqAuth();
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [liveBanner, setLiveBanner] = useState<string | null>(null);

  const loadQueue = useCallback(() => {
    if (!token) return;
    api
      .get<{ queue: QueueItem[] }>("/officer/queue", token)
      .then((res) => {
        setQueue(res.queue);
        setSelectedId((prev) => prev ?? res.queue[0]?.id ?? null);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
        else setQueue([]);
      });
  }, [token, logout]);

  useEffect(() => {
    loadQueue();
    // Live updates via socket.io
    let off: (() => void) | undefined;
    try {
      const s = getSocket();
      const handler = (payload: QueueItem & { preview?: string; goldenHour?: boolean }) => {
        const normalized: QueueItem = { ...payload, goldenHourActive: Boolean(payload.goldenHourActive ?? payload.goldenHour) };
        setQueue((prev) => (prev ? [normalized, ...prev.filter((i) => i.id !== normalized.id)] : prev));
        setLiveBanner(
          `New ${CATEGORY_LABELS[normalized.category as keyof typeof CATEGORY_LABELS] ?? normalized.category}${
            normalized.amount ? ` · ₹${normalized.amount.toLocaleString("en-IN")}` : ""
          }${normalized.utr ? ` · UTR ${normalized.utr}` : ""}`
        );
        window.setTimeout(() => setLiveBanner(null), 8000);
      };
      s.on("incident:new", handler);
      off = () => s.off("incident:new", handler);
    } catch {
      /* socket unavailable */
    }
    return () => off?.();
  }, [loadQueue]);

  if (!token || !officer) return <HqLogin onLogin={loadQueue} />;

  return (
    <div className="flex min-h-screen flex-col bg-[#141a22] text-[#e6e9ed]">
      {/* Top bar — deliberately denser than the citizen portal */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#10151c]">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 px-4">
          <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded bg-saffron text-xs font-black text-black">IO</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold">NCRP Command Center</p>
            <p className="truncate text-2xs text-white/45">{officer.rank} {officer.name} · {officer.unit}</p>
          </div>
          <Badge tone="warn" className="ml-auto border border-warn/40 !bg-transparent">
            <span className="relative mr-1 inline-flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute h-full w-full animate-ping rounded-full bg-ok/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            </span>
            LIVE
          </Badge>
          <Link href="/" className="rounded-control border border-white/15 px-2.5 py-1 text-2xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
            Citizen portal ↗
          </Link>
          <button onClick={logout} className="rounded-control border border-white/15 px-2.5 py-1 text-2xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
            Sign out
          </button>
        </div>
      </header>

      {liveBanner && (
        <div role="alert" className="border-b border-warn/40 bg-warn-tint/95 px-4 py-2.5 animate-fade-in-up">
          <div className="mx-auto flex max-w-7xl items-center gap-3 text-sm">
            <span aria-hidden>🚨</span>
            <p className="font-semibold text-[#3d2b06]">{liveBanner}</p>
            {isFinancialFraud(queue?.find((i) => i.id === selectedId)?.category as any) && (
              <p className="text-xs text-[#6b4e12]">Golden-hour response recommended</p>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Queue */}
        <section aria-label="Incident queue" className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">Live queue</h2>
            <button onClick={loadQueue} className="text-2xs text-white/50 hover:text-white" aria-label="Refresh queue">
              ⟳ refresh
            </button>
          </div>
          <div className="space-y-2 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-1">
            {queue === null &&
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 !bg-white/10" />)}
            {queue?.length === 0 && (
              <EmptyState icon="🛰️" title="Queue is clear" body="New incidents appear here in real time as citizens submit them." />
            )}
            {queue?.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                aria-current={selectedId === item.id}
                className={`block w-full rounded-card border p-3 text-left transition-colors ${
                  selectedId === item.id
                    ? "border-saffron/60 bg-white/10"
                    : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate font-mono text-2xs text-white/55">{item.acknowledgementNumber ?? "(draft)"}</span>
                  {item.goldenHourActive && <Badge tone="danger" className="!bg-danger/20">GOLDEN HR</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/85">{item.preview}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-2xs text-white/50">
                  <span>{CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? item.category}</span>
                  {item.amount != null && <span className="font-semibold text-saffron">₹{item.amount.toLocaleString("en-IN")}</span>}
                  {item.language !== "en" && <span className="uppercase">{item.language}</span>}
                  {item.anonymousMode && <span>anon</span>}
                  <span className="ml-auto">{new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Split view */}
        <section aria-label="Incident detail" className="min-w-0">
          {selectedId ? (
            <IncidentDetail key={selectedId} id={selectedId} onChanged={loadQueue} />
          ) : (
            <EmptyState icon="🗂️" title="Select an incident" body="Pick a case from the live queue to open the split review view." />
          )}
        </section>
      </main>
    </div>
  );
}

/* ── Detail: LEFT citizen evidence / RIGHT AI extraction ── */
function IncidentDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
  const { token } = useHqAuth();
  const [incident, setIncident] = useState<Record<string, unknown> | null>(null);
  const [failed, setFailed] = useState(false);
  const [freezeBusy, setFreezeBusy] = useState(false);
  const [freezeResult, setFreezeResult] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<{ incident: Record<string, unknown> }>(`/officer/incidents/${id}`, token)
      .then((r) => setIncident(r.incident))
      .catch(() => setFailed(true));
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  if (failed) return <EmptyState icon="⚠️" title="Could not load incident" body="The case file is unavailable right now." />;
  if (!incident) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 !bg-white/10" />
        <Skeleton className="h-64 !bg-white/10" />
      </div>
    );
  }

  const txn = (incident.financial_transactions as Record<string, unknown>[] | undefined)?.[0];
  const gh = incident.goldenHour as Record<string, unknown> | undefined;
  const trail = incident.moneyTrail as { nodes: TrailNode[]; edges: TrailEdge[] } | undefined;
  const evidence = (incident.evidence as Record<string, unknown>[] | undefined) ?? [];
  const suspects = (incident.suspect_identifiers as Record<string, unknown>[] | undefined) ?? [];
  const bns = (incident.bns_sections_mapped as Record<string, unknown>[] | undefined) ?? [];
  const statusHistory = (incident.statusHistory as Record<string, unknown>[] | undefined) ?? [];

  const freeze = async () => {
    setFreezeBusy(true);
    setFreezeResult(null);
    try {
      const res = await api.post<{ freeze: { referenceId: string; bank: string }; moneyTrail: { nodes: TrailNode[]; edges: TrailEdge[] } }>(
        `/officer/incidents/${id}/freeze`,
        {},
        token
      );
      setFreezeResult(`${res.freeze.referenceId} confirmed with ${res.freeze.bank} (SIMULATED)`);
      setIncident((prev) => (prev ? { ...prev, moneyTrail: res.moneyTrail } : prev));
      load();
      onChanged();
    } catch {
      setFreezeResult("Freeze request failed — retry or escalate manually.");
    } finally {
      setFreezeBusy(false);
    }
  };

  const setStatus = async (status: IncidentStatus) => {
    await api.post(`/officer/incidents/${id}/status`, { status }, token).then(load).catch(() => undefined);
    onChanged();
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Case header */}
      <Card className="!border-white/10 !bg-white/[0.05] p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div>
            <p className="font-mono text-sm font-bold text-white">{String(incident.acknowledgementNumber)}</p>
            <p className="text-2xs text-white/50">{String(new Date(incident.createdAt as string).toLocaleString("en-IN"))}</p>
          </div>
          <Badge tone="info" className="!bg-navy/60 !text-white/90">{CATEGORY_LABELS[String(incident.incident_category) as keyof typeof CATEGORY_LABELS]}</Badge>
          <Badge tone="neutral" className="!bg-white/10 !text-white/70">status: {String(incident.status)}</Badge>
          <Badge tone="neutral" className="!bg-white/10 !text-white/70">readiness {String(incident.statutory_readiness_score)}%</Badge>
          {Boolean(incident.anonymousMode) && <Badge tone="ok" className="!bg-ok/25 !text-ok">ANONYMOUS</Badge>}
          <div className="ml-auto flex gap-1.5">
            {(["verified", "assigned", "investigation", "fir_registered"] as IncidentStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => void setStatus(s)}
                className="rounded border border-white/15 px-2 py-1 text-2xs font-medium text-white/70 transition-colors hover:border-ok hover:text-ok"
              >
                → {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {gh && isFinancialFraud(incident.incident_category as any) && (
        <GoldenHourBar
          startedAt={String(gh.startedAt)}
          stages={{
            bankNotifiedAt: gh.bankNotifiedAt ? String(gh.bankNotifiedAt) : undefined,
            holdRequestedAt: gh.holdRequestedAt ? String(gh.holdRequestedAt) : undefined,
            freezeConfirmedAt: gh.freezeConfirmedAt ? String(gh.freezeConfirmedAt) : undefined,
          }}
        />
      )}

      {/* Split */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* LEFT: citizen evidence */}
        <div className="space-y-4">
          <Panel title="Citizen narrative">
            {Boolean(incident.narrative_summary) && (
              <p className="mb-3 rounded-control bg-white/5 p-3 text-xs italic leading-relaxed text-white/70">
                {String(incident.narrative_summary)}
              </p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{String(incident.narrative_raw)}</p>
            <p className="mt-3 text-2xs uppercase tracking-wide text-white/40">language: {String(incident.language)}</p>
          </Panel>

          <Panel title={`Evidence (${evidence.length})`}>
            {evidence.length === 0 ? (
              <p className="text-sm text-white/50">No files attached.</p>
            ) : (
              <ul className="space-y-2">
                {evidence.map((e) => {
                  const mime = String(e.mimeType || "");
                  const isImage = mime.startsWith("image/");
                  return (
                    <li key={String(e.evidenceId)} className="rounded-control border border-white/10 bg-white/[0.03] p-3">
                      {isImage && (
                        <div className="mb-2 overflow-hidden rounded-control border border-white/10 bg-black/20">
                          <EvidenceImage
                            incidentId={id}
                            evidenceId={String(e.evidenceId)}
                            token={token}
                            alt={String(e.originalName)}
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-white/90">{String(e.originalName)}</p>
                        <span className="shrink-0 text-2xs text-white/45">{Math.round(Number(e.sizeBytes) / 1024)} KB</span>
                      </div>
                      <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-white/40">sha256:{String(e.sha256)}</p>
                      <div className="mt-1.5 flex flex-wrap gap-2 text-2xs">
                        {Boolean(e.hashVerifiedServer) && <Badge tone="ok" className="!bg-ok/20 !text-ok">integrity verified</Badge>}
                        {Boolean(e.exifScrubbed) && <Badge tone="info" className="!bg-navy/60 !text-white/80">metadata scrubbed</Badge>}
                        <Badge tone="neutral" className="!bg-white/10 !text-white/60">{String(e.mimeType)}</Badge>
                      </div>
                      {isImage && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_URL}/api/officer/incidents/${id}/evidence/${String(e.evidenceId)}/file`, {
                                headers: token ? { Authorization: `Bearer ${token}` } : {},
                              });
                              if (!res.ok) throw new Error(`HTTP ${res.status}`);
                              const blob = await res.blob();
                              const blobUrl = URL.createObjectURL(blob);
                              window.open(blobUrl, "_blank");
                            } catch {
                              /* could not open */
                            }
                          }}
                          className="mt-2 text-2xs font-medium text-saffron hover:underline"
                        >
                          Open full size
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title={`Suspect identifiers (${suspects.length})`}>
            <ul className="space-y-1.5">
              {suspects.map((s, i) => (
                <li key={`${String(s.value)}-${i}`} className="flex items-center gap-2">
                  <Badge tone="neutral" className="!bg-white/10 !text-white/60">{String(s.type).toUpperCase()}</Badge>
                  <span className="break-all font-mono text-xs text-white/85">{String(s.value)}</span>
                  {Boolean(s.context) && <span className="ml-auto shrink-0 text-2xs text-white/35">{String(s.context)}</span>}
                </li>
              ))}
              {suspects.length === 0 && <li className="text-sm text-white/50">None recorded.</li>}
            </ul>
          </Panel>
        </div>

        {/* RIGHT: AI extraction + actions */}
        <div className="space-y-4">
          <Panel title="AI extraction">
            {isFinancialFraud(incident.incident_category as any) ? (
              <dl className="grid grid-cols-2 gap-3">
                <Field label="UTR / RRN" value={txn?.utr as string} mono />
                <Field label="Amount" value={txn?.amount != null ? `₹${Number(txn.amount).toLocaleString("en-IN")}` : undefined} />
                <Field label="Beneficiary VPA" value={txn?.beneficiaryVpa as string} mono />
                <Field label="Method" value={txn?.method as string} />
                <Field label="Category confidence" value={incident.categoryConfidence != null ? `${Math.round(Number(incident.categoryConfidence) * 100)}%` : undefined} />
                <Field label="Txn timestamp" value={txn?.timestamp ? new Date(String(txn.timestamp)).toLocaleString("en-IN") : undefined} />
              </dl>
            ) : (
              <dl className="grid grid-cols-2 gap-3">
                <Field label="Category confidence" value={incident.categoryConfidence != null ? `${Math.round(Number(incident.categoryConfidence) * 100)}%` : undefined} />
              </dl>
            )}
          </Panel>

          <Panel title="Provisional legal mapping">
            <ul className="space-y-2">
              {bns.map((m, i) => (
                <li key={i} className="rounded-control border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-xs font-semibold text-white/90">{String(m.section)} — {String(m.title)}</p>
                  <p className="mt-0.5 text-2xs leading-relaxed text-white/45">{String(m.rationale)}</p>
                </li>
              ))}
              {bns.length === 0 && <li className="text-sm text-white/50">Not mapped.</li>}
            </ul>
          </Panel>

          {/* Actions */}
          <Panel title="Actions">
            <div className="flex flex-wrap gap-2">
              {isFinancialFraud(incident.incident_category as any) && (
                <Button size="md" variant="outlineDanger" onClick={() => void freeze()} disabled={freezeBusy}>
                  {freezeBusy ? "Requesting…" : "Confirm & Trigger 1930 Freeze"}
                </Button>
              )}
              <Button
                size="md"
                variant="secondary"
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/api/officer/incidents/${id}/dossier.pdf`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${incident.acknowledgementNumber || "NCRP"}-dossier.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch {
                    window.open(`${API_URL}/api/officer/incidents/${id}/dossier.pdf`, "_blank");
                  }
                }}
              >
                Generate Dossier (PDF)
              </Button>
            </div>
            {freezeResult && (
              <p role="status" className="mt-3 rounded-control border border-ok/40 bg-ok/10 px-3 py-2 text-xs font-medium text-ok">
                ✓ {freezeResult}
              </p>
            )}
          </Panel>

          {isFinancialFraud(incident.incident_category as any) && (
            <Panel title="Money trail">
              <MoneyTrail nodes={trail?.nodes ?? []} edges={trail?.edges ?? []} />
            </Panel>
          )}

          <Panel title="Status history">
            <ol className="space-y-1.5">
              {statusHistory.slice().reverse().map((h, i) => (
                <li key={i} className="flex items-baseline gap-2 text-xs">
                  <span className="shrink-0 font-mono text-2xs text-white/40">
                    {new Date(String(h.at)).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-white/80">{String(h.label)}</span>
                  {Boolean(h.note) && <span className="text-2xs text-white/40">· {String(h.note)}</span>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-white/10 bg-white/[0.04] p-4">
      <h3 className="mb-3 text-2xs font-bold uppercase tracking-wider text-white/45">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="rounded-control border border-white/10 bg-white/[0.03] px-3 py-2">
      <dt className="text-2xs text-white/40">{label}</dt>
      <dd className={`mt-0.5 truncate text-sm font-medium ${value ? "text-white/90" : "text-white/30"} ${mono ? "font-mono text-xs" : ""}`}>
        {value ?? "—"}
      </dd>
    </div>
  );
}

/* ── Login gate ─────────────────────────────────────────── */
function HqLogin({ onLogin }: { onLogin: () => void }) {
  const { login } = useHqAuth();
  const [email, setEmail] = useState("io@ncrp.demo");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ token: string; officer: Officer }>("/officer/login", { email, password });
      login(res.token, res.officer);
      onLogin();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141a22] p-6 text-[#e6e9ed]">
      <div className="w-full max-w-sm animate-fade-in-up rounded-card border border-white/10 bg-white/[0.04] p-6">
        <p className="text-2xs font-bold uppercase tracking-widest text-saffron">Restricted access</p>
        <h1 className="mt-1.5 text-lg font-bold">Investigating Officer Sign-in</h1>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div>
            <label htmlFor="hq-email" className="mb-1 block text-xs font-medium text-white/60">Email</label>
            <input
              id="hq-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-control border border-white/15 bg-black/20 px-3 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
            />
          </div>
          <div>
            <label htmlFor="hq-pass" className="mb-1 block text-xs font-medium text-white/60">Password</label>
            <input
              id="hq-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="JaiHind2026"
              className="h-10 w-full rounded-control border border-white/15 bg-black/20 px-3 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
            />
          </div>
          {error && <p role="alert" className="text-xs text-[#ff8f86]">{error}</p>}
          <Button type="submit" size="lg" variant="primary" className="w-full !bg-saffron !text-black hover:!bg-[#c98a34]" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-2xs leading-relaxed text-white/40">
          Demo credentials — email io@ncrp.demo · password JaiHind2026<br />
          Simulated environment; not connected to any real police system.
        </p>
        <Link href="/" className="mt-4 block text-center text-2xs text-white/50 hover:text-white">
          ← Back to citizen portal
        </Link>
      </div>
    </div>
  );
}
