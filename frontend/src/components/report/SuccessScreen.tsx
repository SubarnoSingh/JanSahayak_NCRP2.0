"use client";
import Link from "next/link";
import { useComplaint } from "./context";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Emergency1930 } from "@/components/landing/Emergency1930";

export function SuccessScreen({ onNewComplaint }: { onNewComplaint: () => void }) {
  const c = useComplaint();
  const ack = c.acknowledgementNumber;

  return (
    <div className="mx-auto max-w-xl animate-fade-in-up">
      <div className="text-center">
        <span aria-hidden className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ok-tint">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-ok" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Complaint submitted</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Your complaint has been successfully received and entered into the review queue.
        </p>
      </div>

      <Card className="mt-6 p-5 text-center sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Acknowledgment Number</p>
        {ack ? (
          <p className="mt-2 select-all font-mono text-2xl font-bold tracking-wide text-navy">{ack}</p>
        ) : (
          <p className="mt-2 text-sm text-warn">Processing… refresh if this does not appear.</p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {ack && (
            <Link href={`/track?ack=${encodeURIComponent(ack)}`}>
              <Button size="md">Track complaint</Button>
            </Link>
          )}
          {c.incidentId && (
            <a href={`http://localhost:4000/api/incidents/${c.incidentId}/acknowledgement.pdf`} download>
              <Button variant="secondary" size="md">
                Download acknowledgement
              </Button>
            </a>
          )}
          <Button variant="ghost" size="md" onClick={onNewComplaint}>
            View submitted information
          </Button>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold text-ink">What happens next</h2>
        <ol className="mt-3 space-y-3">
          {[
            ["Queue entry", "Your complaint enters the review queue of the concerned cyber police unit."],
            ["Verification", "An officer verifies the details and may contact you through the channel you provided."],
            ["Investigation", "The case is investigated; status updates appear automatically on your tracking page."],
          ].map(([title, body], i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-tint text-[10px] font-bold text-navy">
                {i + 1}
              </span>
              <p className="text-xs leading-relaxed text-ink-soft">
                <strong className="font-semibold text-ink">{title}.</strong> {body}
              </p>
            </li>
          ))}
        </ol>
        {c.goldenHourActive && (
          <div className="mt-4 rounded-control border border-warn/25 bg-warn-tint/60 px-4 py-3">
            <p className="text-xs leading-relaxed text-ink-soft">
              <strong className="font-semibold text-ink">Financial fraud reported.</strong> Officers have started the
              golden-hour process. If you haven't already, also call 1930 to report by phone.
            </p>
          </div>
        )}
      </Card>

      {c.goldenHourActive && (
        <div className="mt-4">
          <Emergency1930 sticky />
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            c.reset();
            window.location.href = "/";
          }}
          className="text-xs font-medium text-navy hover:underline"
        >
          Start a new complaint
        </button>
      </div>
    </div>
  );
}
