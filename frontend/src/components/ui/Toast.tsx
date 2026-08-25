"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastTone = "info" | "ok" | "warn" | "danger";
interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
}

const ToastContext = createContext<{ push: (t: Omit<Toast, "id">) => void }>({ push: () => undefined });

const toneStyles: Record<ToastTone, string> = {
  info: "border-l-navy",
  ok: "border-l-ok",
  warn: "border-l-warn",
  danger: "border-l-danger",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 px-3 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto animate-fade-in-up rounded-card border border-line border-l-4 bg-surface px-4 py-3 shadow-raised ${toneStyles[t.tone]}`}
          >
            <p className="text-sm font-medium text-ink">{t.title}</p>
            {t.body && <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{t.body}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
