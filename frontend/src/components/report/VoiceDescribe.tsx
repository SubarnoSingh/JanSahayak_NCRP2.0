"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { startDictation, speechSupported, type VoiceSession } from "@/lib/speech";

/** Large dictation area for the first wizard step. */
export function VoiceDescribe({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
}) {
  const { t, language } = useI18n();
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);

  useEffect(() => () => sessionRef.current?.stop(), []);

  const toggle = () => {
    if (listening) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      setListening(false);
      return;
    }
    setError(null);
    setPartial("");
    sessionRef.current = startDictation(language, {
      onPartial: setPartial,
      onFinalChunk: (chunk) => {
        onChange(value ? `${value} ${chunk}` : chunk);
        setPartial("");
      },
      onError: (_c, msg) => {
        setError(msg);
        setListening(false);
        sessionRef.current = null;
      },
      onEnd: () => {
        setListening(false);
        sessionRef.current = null;
      },
    });
    if (sessionRef.current) setListening(true);
  };

  const supported = speechSupported();

  return (
    <div>
      <div
        className={`rounded-card border bg-surface transition-all ${
          listening ? "border-navy/50 shadow-[0_0_0_3px_rgba(30,58,95,0.12)]" : "border-line"
        }`}
      >
        <label htmlFor="describe-input" className="sr-only">
          Describe what happened
        </label>
        <textarea
          id="describe-input"
          rows={6}
          value={partial ? `${value} ${partial}`.trimStart() : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("launcher.placeholder")}
          className="w-full resize-none rounded-t-card px-4 py-4 text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink-faint/80"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3.5 py-3">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={listening}
            disabled={!supported}
            className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              listening ? "border-navy bg-navy text-white" : "border-navy-border bg-surface text-navy hover:bg-navy-tint"
            }`}
          >
            <span className={`relative flex h-2 w-2 ${listening ? "" : "hidden"}`} aria-hidden>
              <span className="absolute h-full w-full animate-ping rounded-full bg-white/50" />
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M8 1a2.5 2.5 0 0 0-2.5 2.5v5a2.5 2.5 0 0 0 5 0v-5A2.5 2.5 0 0 0 8 1Zm-5 7.5a.9.9 0 1 1 1.8 0 3.2 3.2 0 0 0 6.4 0 .9.9 0 1 1 1.8 0 5 5 0 0 1-4.1 4.92V15H7.1v-1.58A5 5 0 0 1 3 8.5Z" />
            </svg>
            {listening ? t("launcher.speaking") : t("launcher.speak")}
          </button>
          {!supported && <span className="text-2xs text-ink-faint">Voice input works best in Chrome / Edge</span>}
        </div>
        {partial && (
          <p lang={language} role="status" className="border-t border-dashed border-navy/25 bg-navy-tint/60 px-4 py-2 text-sm italic leading-relaxed text-navy-deep">
            {t("launcher.listeningHint")} “{partial}”
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-danger">
          <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden>
            <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-8a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Z" />
          </svg>
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end">
        <Button size="lg" onClick={onSubmit} disabled={value.trim().length < 10}>
          Continue
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 10h12m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
