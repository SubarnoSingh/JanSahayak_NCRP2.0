"use client";
import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";

/** Global listeners: footer toast events + help dialog trigger from the header. */
export function GlobalListeners() {
  const { push } = useToast();
  const [helpOpen, setHelpOpen] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.title) push({ tone: "info", title: detail.title, body: detail.body });
    };
    const onHelp = () => setHelpOpen(true);
    window.addEventListener("ncrp:toast", onToast);
    document.addEventListener("ncrp:open-help", onHelp);
    return () => {
      window.removeEventListener("ncrp:toast", onToast);
      document.removeEventListener("ncrp:open-help", onHelp);
    };
  }, [push]);

  return (
    <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Help & helplines" description="Quick support for reporting and emergencies.">
      <ul className="space-y-3 text-sm leading-relaxed text-ink-soft">
        <li className="rounded-control border border-warn/30 bg-warn-tint/60 px-4 py-3">
          <p className="font-semibold text-ink">Financial fraud in progress?</p>
          <p>
            Call{" "}
            <a href="tel:1930" className="font-semibold text-navy underline underline-offset-2">
              1930
            </a>{" "}
            immediately — the first hour matters most.
          </p>
        </li>
        <li>
          <p className="font-medium text-ink">Start a complaint</p>
          <p>Use the launcher on the home page. Type or speak — legal categories are detected automatically.</p>
        </li>
        <li>
          <p className="font-medium text-ink">Track an existing complaint</p>
          <p>Use your acknowledgment number (format NCRP-YYYY-XXXXXX) on the Track page.</p>
        </li>
        <li className="text-xs text-ink-faint">
          This is a hackathon prototype with synthetic data. It is not connected to official government systems.
        </li>
      </ul>
    </Modal>
  );
}
