"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Resource, ScamAlert } from "@/lib/types";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, Badge } from "@/components/ui/Card";
import { SectionHeading, Skeleton, EmptyState } from "@/components/ui/Misc";

export default function LearnPage() {
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    Promise.all([api.get<{ resources: Resource[] }>("/resources"), api.get<{ alerts: ScamAlert[] }>("/scam-alerts")])
      .then(([r, a]) => {
        setResources(r.resources);
        setAlerts(a.alerts ?? []);
      })
      .catch(() => setFailed(true));
  }, []);

  const trending = resources?.filter((r) => r.trending) ?? [];
  const guides = resources?.filter((r) => !r.trending) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <SectionHeading
          eyebrow="Learning Corner"
          title="Stay ahead of cyber scams"
          subtitle="Short, practical guides on how today's scams work — and the exact steps that stop them."
        />

        {/* Scam alerts */}
        <div id="alerts" className="mt-6 space-y-2">
          {alerts.map((a) => (
            <div
              key={a.title}
              className={`flex items-start gap-3 rounded-card border p-3.5 ${
                a.severity === "critical" ? "border-danger/25 bg-danger-tint/60" : a.severity === "warning" ? "border-warn/25 bg-warn-tint/50" : "border-line bg-surface"
              }`}
            >
              <span aria-hidden className="mt-0.5">
                {a.severity === "critical" ? "🚨" : "⚠️"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{a.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{a.summary}</p>
                <p className="mt-1 text-2xs text-ink-faint">
                  {a.region} · {new Date(a.publishedAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>

        {resources === null && !failed && (
          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            <Skeleton className="h-44 lg:col-span-2" />
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          </div>
        )}
        {failed && (
          <EmptyState icon="📡" title="Guides couldn't load" body="The content service is unreachable right now. Please try again shortly." />
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <>
            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-ink-faint">Trending now</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {trending.map((r) => (
                <GuideCard key={r.slug} r={r} featured />
              ))}
            </div>
          </>
        )}

        {/* All guides */}
        {guides.length > 0 && (
          <>
            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-ink-faint">All guides</h2>
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((r) => (
                <li key={r.slug}>
                  <GuideCard r={r} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function GuideCard({ r, featured = false }: { r: Resource; featured?: boolean }) {
  if (featured) {
    return (
      <Link href={`/learn/${r.slug}`} className="group block h-full">
        <Card className="h-full border-navy/20 bg-gradient-to-br from-navy to-navy-deep p-5 text-white transition-shadow group-hover:shadow-raised">
          <Badge tone="saffron" className="bg-saffron !text-white">Trending</Badge>
          <h3 className="mt-3 text-lg font-semibold leading-snug">{r.title}</h3>
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/75">{r.summary}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold">
            Read guide · {r.readMinutes} min
          </span>
        </Card>
      </Link>
    );
  }
  return (
    <Link
      href={`/learn/${r.slug}`}
      className="group block h-full rounded-card border border-line bg-surface p-3.5 shadow-card transition-all hover:border-navy-border hover:shadow-raised"
    >
      <p className="text-2xs font-medium uppercase tracking-wide text-saffron-deep">{r.scamType}</p>
      <h4 className="mt-1 text-sm font-semibold leading-snug text-ink">{r.title}</h4>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-faint">{r.summary}</p>
      <p className="mt-2 text-2xs text-navy opacity-0 transition-opacity group-hover:opacity-100">Read guide →</p>
    </Link>
  );
}
