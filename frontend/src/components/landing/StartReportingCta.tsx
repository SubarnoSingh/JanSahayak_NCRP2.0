"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

/** Homepage entry point into the complaint workflow (/report). */
export function StartReportingCta() {
  const { t } = useI18n();
  const assurances = [t("cta.reassure1"), t("cta.reassure2"), t("cta.reassure3")];

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-raised">
      <div className="border-t-2 border-navy" aria-hidden />
      <div className="px-6 py-10 text-center sm:px-12 sm:py-14">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-saffron-deep">{t("cta.eyebrow")}</p>
        <h2 className="mx-auto mt-2.5 max-w-md text-balance text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl">
          {t("cta.heading")}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">{t("cta.body")}</p>

        <div className="mt-8 flex justify-center">
          <Link href="/report">
            <Button size="xl" className="!px-10 sm:!px-12">
              {t("launcher.cta")}
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M3.5 10h13m-5.5-5.5L16.5 10 11 15.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </Link>
        </div>

        <ul className="mx-auto mt-8 flex max-w-xl flex-col items-center justify-center gap-x-7 gap-y-2 border-t border-line pt-5 sm:flex-row sm:flex-wrap">
          {assurances.map((label) => (
            <li key={label} className="flex items-center gap-1.5 text-xs font-medium text-ink-faint">
              <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 text-ok" fill="currentColor" aria-hidden>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm3.7-9.3-4.2 4.2a1 1 0 0 1-1.4 0L4.3 9.1a1 1 0 0 1 1.4-1.4l1.1 1.08 3.5-3.48a1 1 0 0 1 1.4 1.4Z" />
              </svg>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
