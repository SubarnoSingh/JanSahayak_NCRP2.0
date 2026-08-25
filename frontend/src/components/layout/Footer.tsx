"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface FooterLink {
  label: string;
  href: string;
  externalAnchor?: boolean;
}

const columns: { titleKey: string; links: FooterLink[] }[] = [
  {
    titleKey: "footer.reportTrack",
    links: [
      { label: "footer.fileComplaint", href: "/report" },
      { label: "nav.trackComplaint", href: "/track" },
      { label: "secondary.check.title", href: "/protect?tab=check" },
      { label: "secondary.reportSuspect.title", href: "/protect?tab=report" },
    ],
  },
  {
    titleKey: "footer.staySafe",
    links: [
      { label: "nav.protect", href: "/protect" },
      { label: "learn.viewAll", href: "/learn" },
      { label: "secondary.volunteers.title", href: "/volunteers" },
      { label: "nav.help", href: "/help" },
    ],
  },
  {
    titleKey: "footer.govServices",
    links: [
      { label: "TAFCOP", href: "/services#tafcop", externalAnchor: true },
      { label: "CEIR", href: "/services#ceir", externalAnchor: true },
      { label: "GAC Appeal", href: "/services#gac", externalAnchor: true },
      { label: "CPGRAMS", href: "/services#cpgrams", externalAnchor: true },
      { label: "RTI", href: "/services#rti", externalAnchor: true },
    ],
  },
  {
    titleKey: "footer.about",
    links: [
      { label: "footer.aboutI4c", href: "/about" },
      { label: "nav.accessibility", href: "/accessibility" },
      { label: "footer.privacy", href: "/privacy" },
      { label: "footer.terms", href: "/terms" },
      { label: "footer.contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.titleKey}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{t(col.titleKey)}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      onClick={l.externalAnchor ? undefined : (e) => stubNav(e, l.href)}                      className="text-sm text-ink-soft transition-colors hover:text-navy"
                    >
                      {t(l.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs leading-relaxed text-ink-faint">
            <p className="font-medium text-ink-soft">{t("footer.bottom")}</p>
            <p className="mt-1">{t("footer.demoNote")}</p>
          </div>
          <Link
            href="/hq"
            className="shrink-0 self-start rounded-control border border-line px-3 py-1.5 text-2xs font-medium text-ink-faint transition-colors hover:border-line-strong hover:text-ink sm:self-auto"
          >
            {t("footer.ioLogin")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

function stubNav(e: React.MouseEvent, href: string) {
  // Pages marked as placeholders in the demo stay on the current page with a notice.
  if (["/about", "/accessibility", "/privacy", "/terms", "/contact"].some((p) => href.startsWith(p)) || href.startsWith("/services")) {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("ncrp:toast", { detail: { title: "Placeholder page", body: "This section is a structural placeholder in the demo build." } }));
  }
}
