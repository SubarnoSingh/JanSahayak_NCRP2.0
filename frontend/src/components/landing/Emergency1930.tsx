"use client";
import { useI18n } from "@/lib/i18n";

export function Emergency1930({ sticky = false }: { sticky?: boolean }) {
  const { t } = useI18n();
  return (
    <section
      aria-label={t("emergency.helpline")}
      className={`rounded-card border border-warn/25 bg-warn-tint/70 ${sticky ? "p-3.5" : "p-4 sm:p-5"}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
          <span
            aria-hidden
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface shadow-card"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-warn" fill="currentColor">
              <path d="M10 2 1.5 17h17L10 2Zm0 4a1 1 0 0 1 1 1v4.5a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1Zm0 8.6a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className={`font-semibold text-ink ${sticky ? "text-sm" : "text-sm sm:text-base"}`}>
              {t("emergency.title")}
            </h2>
            {!sticky && <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{t("emergency.body")}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs font-medium text-ink-soft">{t("emergency.helpline")}</span>
          <a
            href="tel:1930"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-control bg-warn px-4 text-sm font-semibold text-white transition-colors hover:bg-[#8f5009]"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M3.6 1.7c.5-.5 1.3-.4 1.7.1l1.5 2c.3.5.3 1.1-.1 1.5l-.8.8a11.5 11.5 0 0 0 3 3l.8-.8c.4-.4 1-.4 1.5-.1l2 1.5c.5.4.6 1.2.1 1.7l-.9.9c-.5.5-1.2.7-1.9.5A13.7 13.7 0 0 1 3.2 5.5c-.2-.7 0-1.4.5-1.9l-.1-1.9Z" />
            </svg>
            {t("emergency.cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
