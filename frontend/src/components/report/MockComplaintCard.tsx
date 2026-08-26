"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const MOCK_TEXT =
  "I was contacted by a person claiming to represent a recruitment company who offered me a work-from-home Data Entry Operator position. After I expressed interest, they asked me to pay a one-time registration and verification fee of \u20B97,500, claiming that the amount would be refunded with my first salary. I made the payment using the bank details provided in the chat. After receiving the payment, the person became unresponsive. I believe this was a fraudulent job offer.";

export function MockComplaintCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MOCK_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard access denied — fail silently */
    }
  };

  return (
    <div className="rounded-card border border-dashed border-line-strong bg-paper/50 p-4">
      <p className="text-xs font-medium text-ink">Need mock data for testing?</p>
      <p className="mt-0.5 text-2xs text-ink-faint">We got u</p>
      <Button variant="secondary" size="sm" className="mt-3" onClick={handleCopy}>
        <svg viewBox="0 0 16 16" className="mr-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="5" y="5" width="8" height="9" rx="1.2" />
          <path d="M3 11V3.6A1.6 1.6 0 0 1 4.6 2H10" strokeLinecap="round" />
        </svg>
        {copied ? "Copied!" : "Copy this"}
      </Button>
      <p className="mt-2 text-2xs text-ink-faint">Use this sample to test complaint detection.</p>
    </div>
  );
}
