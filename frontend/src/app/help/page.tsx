"use client";
import Link from "next/link";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/" className="text-xs font-medium text-navy hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Help &amp; Support</h1>
        <p className="mt-2 text-xs text-ink-faint">NCRP 2.0 — e-FIR Jan-Sahayak</p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-soft">
          {/* Emergency banner */}
          <Card className="border-warn/25 bg-warn-tint/50 p-5">
            <h2 className="text-base font-semibold text-ink">Financial fraud emergency?</h2>
            <p className="mt-1.5">
              If money was recently transferred to a scammer, act within the first hour for the best chance of
              recovery. Call the Financial Cyber Fraud Helpline immediately.
            </p>
            <div className="mt-3">
              <a href="tel:1930">
                <Button size="sm" variant="saffron">Call 1930</Button>
              </a>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">How do I file a complaint?</h2>
            <p className="mt-2">
              Go to the <Link href="/report" className="font-medium text-navy hover:underline">Report</Link> page
              and describe what happened in your own words. You can type or use voice input. The guided process
              will walk you through adding evidence, reviewing details, and signing your complaint.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">How do I track my complaint?</h2>
            <p className="mt-2">
              After filing, you receive an acknowledgement number. Use the
              <Link href="/track" className="mx-1 font-medium text-navy hover:underline">Track Complaint</Link>
              page to enter this number and view the current status, Investigating Officer details, and any updates.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Can I file anonymously?</h2>
            <p className="mt-2">
              Yes. You can choose to file without providing personal contact details. Anonymous complaints are still
              investigated, but the Investigating Officer will not be able to reach you for follow-up questions.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">What languages are supported?</h2>
            <p className="mt-2">
              The portal supports English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam,
              and Punjabi. You can switch languages using the language selector in the header.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">What evidence should I upload?</h2>
            <p className="mt-2">
              Upload anything that supports your complaint: screenshots of messages or calls, transaction receipts,
              email forwards, chat exports, or photos of fraudulent documents. The system will verify file integrity
              using SHA-256 checksums.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">I need to talk to someone</h2>
            <p className="mt-2">
              For general enquiries, visit the <Link href="/contact" className="font-medium text-navy hover:underline">Contact</Link> page
              to find the Cyber Crime Officer for your state or union territory. For emergency financial fraud, call
              <strong className="mx-1">1930</strong>.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Is my data safe?</h2>
            <p className="mt-2">
              Yes. All data is encrypted in transit and at rest. Only authorised Investigating Officers can access
              your complaint details. Read our <Link href="/privacy" className="font-medium text-navy hover:underline">Privacy Policy</Link> for
              full details.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
