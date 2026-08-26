"use client";
import Link from "next/link";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/" className="text-xs font-medium text-navy hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Privacy Policy</h1>
        <p className="mt-2 text-xs text-ink-faint">NCRP 2.0 — e-FIR Jan-Sahayak</p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-soft">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Information We Collect</h2>
            <p className="mt-2">
              When you file a complaint through this portal, we collect the information you provide, including your
              description of the incident, supporting evidence (screenshots, documents), and optionally your contact
              details. If you choose to file anonymously, no personal identifying information is collected.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">How Your Information Is Used</h2>
            <p className="mt-2">
              The information you provide is used solely for the purpose of investigating and resolving your
              cybercrime complaint. It is shared only with the relevant law enforcement agencies assigned to your
              case. Your data is not used for any other purpose, including marketing or profiling.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Data Security</h2>
            <p className="mt-2">
              All data transmitted between your device and our servers is encrypted using industry-standard TLS.
              Uploaded evidence files are verified using SHA-256 checksums to ensure integrity. Access to complaint
              data is restricted to authorised Investigating Officers through role-based authentication.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Data Retention</h2>
            <p className="mt-2">
              Complaint data is retained in accordance with the retention policies prescribed by the Ministry of
              Home Affairs and applicable Indian laws. Evidence files are stored securely and are only accessible
              to authorised personnel during the investigation process.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Your Rights</h2>
            <p className="mt-2">
              You have the right to track the status of your complaint, request updates on investigation progress,
              and contact the assigned Investigating Officer. For any privacy-related concerns, please reach out
              through our <Link href="/contact" className="font-medium text-navy hover:underline">Contact page</Link>.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Cookies and Tracking</h2>
            <p className="mt-2">
              This portal uses only essential session cookies required for authentication and language preferences.
              No advertising or third-party tracking cookies are used.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
