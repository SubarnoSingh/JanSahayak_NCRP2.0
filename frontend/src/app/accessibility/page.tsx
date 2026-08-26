"use client";
import Link from "next/link";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";

export default function AccessibilityPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/" className="text-xs font-medium text-navy hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Accessibility</h1>
        <p className="mt-2 text-xs text-ink-faint">NCRP 2.0 — e-FIR Jan-Sahayak</p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-soft">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Our Commitment</h2>
            <p className="mt-2">
              We are committed to making this platform accessible to all citizens, including those with disabilities.
              The portal follows the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards to ensure
              that every person can navigate, understand, and use the complaint-filing process.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Accessibility Features</h2>
            <ul className="mt-2 space-y-1.5">
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                Keyboard navigable — all functions accessible without a mouse
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                Screen reader compatible with proper ARIA labels and landmarks
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                High contrast colour scheme meeting WCAG AA contrast ratios
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                Responsive design that works across desktop, tablet, and mobile
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                Multi-language support in 10+ Indian languages
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                Voice input for describing incidents without typing
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                Skip-to-content link for keyboard users
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Supported Browsers</h2>
            <p className="mt-2">
              This portal is tested and supported on the latest versions of Google Chrome, Mozilla Firefox,
              Microsoft Edge, and Apple Safari on desktop and mobile platforms.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Feedback</h2>
            <p className="mt-2">
              If you encounter any accessibility barriers while using this portal, please let us know through the
              <Link href="/contact" className="mx-1 font-medium text-navy hover:underline">Contact</Link>
              page. We actively review accessibility feedback and work to resolve issues promptly.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
