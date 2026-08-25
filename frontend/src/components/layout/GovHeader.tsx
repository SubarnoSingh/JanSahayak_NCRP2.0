"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

export function GovHeader() {
  const { t } = useI18n();
  const pathname = usePathname();

  const nav = [
    { href: "/", key: "nav.report", match: (p: string) => p === "/" || p.startsWith("/report") },
    { href: "/track", key: "nav.track", match: (p: string) => p.startsWith("/track") },
    { href: "/protect", key: "nav.protect", match: (p: string) => p.startsWith("/protect") },
    { href: "/learn", key: "nav.learn", match: (p: string) => p.startsWith("/learn") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
      <a href="#main" className="skip-link">
        {t("header.skipToContent")}
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="NCRP 2.0 home">
          {/* Emblem placeholder — official assets are not used in this prototype */}
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-navy/70 text-navy"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M12 2.8 4 7v10l8 4.2L20 17V7l-8-4.2Z" strokeLinejoin="round" />
              <path d="M12 8v8m-3.4-5.8L12 8l3.4 2.2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              {t("gov.identity.line1")}
            </span>
            <span className="block truncate text-xs font-semibold text-ink sm:text-[13px]">
              {t("gov.identity.line2")}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-control px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-navy-tint text-navy" : "text-ink-soft hover:bg-surface hover:text-ink"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-3">
          <LanguageSelector compact />
          <Link
            href="/track"
            className="hidden h-9 items-center rounded-control border border-line bg-surface px-3 text-xs font-medium text-ink transition-colors hover:border-line-strong sm:inline-flex"
          >
            {t("nav.trackComplaint")}
          </Link>
          <button
            onClick={() => document.dispatchEvent(new CustomEvent("ncrp:open-help"))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-line bg-surface text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
            aria-label={t("nav.help")}
            title={t("nav.help")}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="10" cy="10" r="7.5" />
              <path d="M7.8 7.8A2.2 2.2 0 1 1 10 12.2v.9" strokeLinecap="round" />
              <circle cx="10" cy="15" r="0.4" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <nav aria-label="Primary mobile" className="border-t border-line md:hidden">
        <div className="mx-auto flex max-w-6xl px-2">
          {nav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex-1 py-2 text-center text-xs font-medium ${
                  active ? "text-navy shadow-[inset_0_-2px_0_0_#1e3a5f]" : "text-ink-faint"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
