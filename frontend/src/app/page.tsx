"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { Resource, ScamAlert } from "@/lib/types";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { StartReportingCta } from "@/components/landing/StartReportingCta";
import { Emergency1930 } from "@/components/landing/Emergency1930";
import { ServiceCard } from "@/components/landing/ServiceCard";
import { SuspectCheck } from "@/components/landing/SuspectCheck";
import { Card, Badge } from "@/components/ui/Card";
import { SectionHeading, Skeleton } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="flex-1">
        {/* ── HERO ─────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6 sm:pt-14">
          <h1 className="text-balance text-center text-[26px] font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-ink-soft sm:text-base">
            {t("hero.subtitle")}
          </p>
          <div className="mt-7 sm:mt-9">
            <StartReportingCta />
          </div>
          <div className="mt-6">
            <Emergency1930 />
          </div>
        </section>

        {/* ── SECONDARY SERVICES ───────────────────────── */}
        <section aria-labelledby="secondary-heading" className="mx-auto mt-12 w-full max-w-6xl px-4 sm:px-6">
          <SectionHeading title={t("secondary.heading")} />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ServiceCard
              href="/track"
              icon={<TrackIcon />}
              title={t("secondary.track.title")}
              body={t("secondary.track.body")}
              cta={t("nav.trackComplaint")}
            />
            <ServiceCard
              href="/protect?tab=check"
              icon={<ShieldIcon />}
              title={t("secondary.check.title")}
              body={t("secondary.check.body")}
              cta={t("defense.checkCta")}
            />
            <ServiceCard
              href="/protect?tab=report"
              icon={<AlertIcon />}
              title={t("secondary.reportSuspect.title")}
              body={t("secondary.reportSuspect.body")}
              cta={t("defense.reportCta")}
            />
            <ServiceCard
              href="/volunteers"
              icon={<VolunteerIcon />}
              title={t("secondary.volunteers.title")}
              body={t("secondary.volunteers.body")}
              cta={t("volunteers.secondary")}
            />
          </div>
        </section>

        {/* ── PROACTIVE DEFENSE ────────────────────────── */}
        <ProactiveDefense />

        {/* ── LEARNING PREVIEW + ALERTS ────────────────── */}
        <LearningPreview />

        {/* ── VOLUNTEERS ───────────────────────────────── */}
        <section aria-labelledby="volunteers-heading" className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="flex-1">
                <p className="text-2xs font-semibold uppercase tracking-wider text-saffron-deep">Cyber Volunteers</p>
                <h2 id="volunteers-heading" className="mt-1.5 text-lg font-semibold tracking-tight text-ink">
                  {t("volunteers.heading")}
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-soft">{t("volunteers.body")}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2.5">
                <Button variant="primary">{t("volunteers.cta")}</Button>
                <Link href="/volunteers">
                  <Button variant="ghost">{t("volunteers.secondary")}</Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>

        {/* ── OTHER GOV SERVICES ───────────────────────── */}
        <GovServicesRow />
      </main>
      <Footer />
    </div>
  );
}

/* ── Proactive defense section ─────────────────────────── */
function ProactiveDefense() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="defense-heading" className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
      <SectionHeading eyebrow="Proactive defense" title={t("defense.heading")} subtitle={t("defense.subheading")} />
      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h3 className="text-sm font-semibold text-ink">{t("defense.checkTitle")}</h3>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-ink-soft">{t("defense.checkBody")}</p>
          <SuspectCheck compact />
        </Card>
        <Card className="flex flex-col justify-between border-saffron/30 bg-saffron-tint/40 p-5 lg:col-span-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">{t("defense.reportTitle")}</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">{t("defense.reportBody")}</p>
            <p className="mt-3 flex items-start gap-1.5 text-2xs leading-relaxed text-ink-faint">
              <svg viewBox="0 0 16 16" className="mt-0.5 h-3 w-3 shrink-0 text-ok" fill="currentColor" aria-hidden>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm3.7-9.3-4.2 4.2a1 1 0 0 1-1.4 0L4.3 9.1a1 1 0 0 1 1.4-1.4l1.1 1.08 3.5-3.48a1 1 0 0 1 1.4 1.4Z" />
              </svg>
              Reporting an attempt takes under a minute and helps protect everyone else.
            </p>
          </div>
          <Link href="/protect?tab=report" className="mt-4 block">
            <Button variant="saffron" size="md" className="w-full">
              {t("defense.reportCta")}
            </Button>
          </Link>
        </Card>
      </div>
    </section>
  );
}

/* ── Learning corner preview (API-driven) ──────────────── */
function LearningPreview() {
  const { t } = useI18n();
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

  const trending = resources?.find((r) => r.trending) ?? resources?.[0];
  const rest = resources?.filter((r) => r !== trending).slice(0, 6) ?? [];

  return (
    <section aria-labelledby="learn-heading" className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading title={t("learn.heading")} />
        <Link href="/learn" className="text-xs font-medium text-navy hover:underline">
          {t("learn.viewAll")} →
        </Link>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        {/* Featured trending card */}
        {resources === null && !failed && (
          <>
            <Skeleton className="h-44 lg:col-span-2" />
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </>
        )}
        {trending && (
          <Link href={`/learn/${trending.slug}`} className="group block lg:col-span-2">
            <Card className="relative h-full overflow-hidden border-navy/20 bg-gradient-to-br from-navy to-navy-deep p-5 text-white transition-shadow group-hover:shadow-raised">
              <Badge tone="saffron" className="bg-saffron !text-white">
                <span aria-hidden>📈</span> {t("learn.trending")}
              </Badge>
              <h3 className="mt-3 text-lg font-semibold leading-snug">{trending.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/75 line-clamp-3">{trending.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/95">
                {t("learn.readGuide")} · {trending.readMinutes} {t("learn.minutes")}
                <svg viewBox="0 0 16 16" className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="m5.5 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Card>
          </Link>
        )}

        {/* Smaller guide cards + scam alerts strip */}
        <div className="lg:col-span-3">
          {alerts.length > 0 && (
            <div className="mb-3 rounded-card border border-line bg-warn-tint/60 px-4 py-3">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" fill="currentColor" aria-hidden>
                  <path d="M10 2 1.5 17h17L10 2Zm0 4a1 1 0 0 1 1 1v4.5a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1Zm0 8.6a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" />
                </svg>
                <span>
                  <strong className="font-semibold text-ink">{alerts[0].title}.</strong>{" "}
                  <Link href="/learn#alerts" className="underline decoration-dotted underline-offset-2 hover:text-navy">
                    See all current scam alerts
                  </Link>
                </span>
              </p>
            </div>
          )}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rest.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/learn/${r.slug}`}
                  className="group block h-full rounded-card border border-line bg-surface p-3.5 shadow-card transition-all hover:border-navy-border hover:shadow-raised"
                >
                  <p className="text-2xs font-medium uppercase tracking-wide text-saffron-deep">{r.scamType}</p>
                  <h4 className="mt-1 text-sm font-semibold leading-snug text-ink">{r.title}</h4>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-faint">{r.summary}</p>
                  <span className="mt-2 inline-block text-2xs font-medium text-navy opacity-0 transition-opacity group-hover:opacity-100">
                    {t("learn.readGuide")} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Other government services ─────────────────────────── */
function GovServicesRow() {
  const { t } = useI18n();
  const services = [
    { name: "TAFCOP", desc: "Check mobile connections registered in your name", url: "https://tafcop.dgtelecom.gov.in" },
    { name: "CEIR", desc: "Block & trace lost or stolen mobile devices", url: "https://www.ceir.gov.in" },
    { name: "GAC — Cyber Crime Victims Assistance", desc: "Appeal for assistance with frozen accounts", url: "https://cybercrime.gov.in/Webform/Accept.aspx?pid=10" },
    { name: "CPGRAMS", desc: "Centralized public grievance redress system", url: "https://pgportal.gov.in" },
    { name: "CCTNS", desc: "Crime & criminal tracking network & systems", url: "https://cctns.gov.in" },
    { name: "RTI", desc: "Right to Information requests", url: "https://rtionline.gov.in" },
  ];
  return (
    <section aria-labelledby="gov-services-heading" className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
      <SectionHeading title={t("govservices.heading")} subtitle={t("govservices.subheading")} />
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <li key={s.name}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3 transition-colors hover:border-navy-border"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{s.name}</p>
                <p className="truncate text-2xs text-ink-faint">{s.desc}</p>
              </div>
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-navy" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M6 3h7v7M13 3 4.5 11.5M9 13H3V7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* Icons */
const iconProps = { viewBox: "0 0 20 20", className: "h-4.5 w-4.5 h-[18px] w-[18px]", fill: "none" as const, stroke: "currentColor" as const, strokeWidth: 1.6, "aria-hidden": true as const };
const TrackIcon = () => (
  <svg {...iconProps}>
    <circle cx="10" cy="10" r="7.25" />
    <path d="M10 5.5V10l3 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ShieldIcon = () => (
  <svg {...iconProps}>
    <path d="M10 2.2 4 4.6v4.2c0 3.6 2.6 6.8 6 7.8 3.4-1 6-4.2 6-7.8V4.6L10 2.2Z" strokeLinejoin="round" />
    <path d="m7.5 9.8 1.8 1.8 3.2-3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const AlertIcon = () => (
  <svg {...iconProps}>
    <path d="M10 3 2.8 15.8h14.4L10 3Z" strokeLinejoin="round" />
    <path d="M10 8.5v3" strokeLinecap="round" />
  </svg>
);
const VolunteerIcon = () => (
  <svg {...iconProps}>
    <circle cx="7.5" cy="7" r="2.8" />
    <path d="M2.8 16c.6-2.8 2.5-4.2 4.7-4.2S11.6 13.2 12.2 16" strokeLinecap="round" />
    <path d="M14.5 6.5v4M12.5 8.5h4" strokeLinecap="round" />
  </svg>
);
