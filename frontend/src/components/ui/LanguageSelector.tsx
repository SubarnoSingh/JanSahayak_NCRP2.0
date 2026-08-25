"use client";
import { useEffect, useRef, useState } from "react";
import { LANGUAGES, useI18n } from "@/lib/i18n";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t("common.language")}: ${current.englishName}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 text-xs font-medium text-ink transition-colors hover:border-line-strong"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-ink-faint" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
          <circle cx="8" cy="8" r="6.4" />
          <path d="M1.6 8h12.8M8 1.6c-4 4.4-4 8.4 0 12.8M8 1.6c4 4.4 4 8.4 0 12.8" />
        </svg>
        {!compact && <span>{current.nativeName}</span>}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("common.language")}
          className="absolute right-0 z-40 mt-1.5 max-h-[320px] w-56 animate-fade-in-up overflow-y-auto rounded-card border border-line bg-surface p-1 shadow-raised"
        >
          {(showAll ? LANGUAGES : LANGUAGES.slice(0, 6)).map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === language}
              onClick={() => {
                setLanguage(l.code);
                setOpen(false);
              }}
              lang={l.code}
              className={`flex w-full items-center justify-between rounded-control px-3 py-2 text-left text-sm transition-colors ${
                l.code === language ? "bg-navy-tint font-medium text-navy" : "text-ink hover:bg-paper"
              }`}
            >
              <span>
                {l.nativeName}
                <span className="ml-2 text-2xs text-ink-faint">{l.englishName}</span>
              </span>
              {l.code === language && (
                <svg viewBox="0 0 16 16" className="h-4 w-4 text-navy" fill="currentColor" aria-hidden>
                  <path d="M6.5 11.5 3 8l1-1 2.5 2.5L11.5 4l1 1-6 6.5Z" />
                </svg>
              )}
            </button>
          ))}
          {!showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full rounded-control px-3 py-2 text-left text-xs font-medium text-navy hover:bg-paper"
            >
              + More languages…
            </button>
          )}
        </div>
      )}
    </div>
  );
}
