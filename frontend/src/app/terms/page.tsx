"use client";
import Link from "next/link";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/" className="text-xs font-medium text-navy hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Terms of Use</h1>
        <p className="mt-2 text-xs text-ink-faint">NCRP 2.0 — e-FIR Jan-Sahayak</p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-soft">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Purpose of This Portal</h2>
            <p className="mt-2">
              NCRP 2.0 — e-FIR Jan-Sahayak is an official platform of the Indian Cyber Crime Coordination Centre
              (I4C), Ministry of Home Affairs, Government of India. It enables citizens to report cybercrime
              incidents online and file complaints that are forwarded to the relevant law enforcement authorities.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Accurate Information</h2>
            <p className="mt-2">
              Users are required to provide truthful and accurate information when filing a complaint. Knowingly
              submitting false or misleading information is an offence under Section 182 of the Indian Penal Code
              and the Information Technology Act, 2000. All submissions are subject to verification.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Evidence and Documentation</h2>
            <p className="mt-2">
              Evidence uploaded through this portal must be authentic and unaltered. The system records SHA-256
              checksums of all uploaded files to verify their integrity. Tampering with evidence is a punishable
              offence under the Indian Penal Code and the Information Technology Act.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">No Guarantee of Outcome</h2>
            <p className="mt-2">
              Filing a complaint through this portal does not guarantee a specific outcome. Investigation decisions
              are made by the assigned law enforcement authorities based on the merits and evidence of each case.
              This platform facilitates the reporting process but does not replace the investigative process.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Limitation of Liability</h2>
            <p className="mt-2">
              While every effort is made to ensure the portal operates reliably, the Government of India and I4C
              are not liable for any loss or damage arising from system downtime, data transmission delays, or
              unauthorised access beyond reasonable security measures.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Governing Law</h2>
            <p className="mt-2">
              These terms are governed by the laws of India. Any disputes arising from the use of this portal
              shall be subject to the jurisdiction of courts in New Delhi.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
