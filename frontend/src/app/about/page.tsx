"use client";
import Link from "next/link";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/" className="text-xs font-medium text-navy hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">About I4C</h1>
        <p className="mt-2 text-xs text-ink-faint">Indian Cyber Crime Coordination Centre</p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-soft">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">What is I4C?</h2>
            <p className="mt-2">
              The Indian Cyber Crime Coordination Centre (I4C) was established by the Ministry of Home Affairs,
              Government of India, to provide a unified framework for addressing cybercrime in the country. It serves
              as the central coordinating body for all cybercrime-related activities across states and union territories.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">About NCRP 2.0</h2>
            <p className="mt-2">
              NCRP 2.0 — e-FIR Jan-Sahayak is a citizen-first redesign of the National Cybercrime Reporting Portal.
              It enables victims and witnesses to file cybercrime complaints through a guided, accessible process
              that works in multiple Indian languages.
            </p>
            <p className="mt-2">
              This platform is a prototype developed for the Build What Moves India hackathon. It demonstrates how
              technology can simplify the complaint-filing experience while maintaining the rigor required for
              law-enforcement action.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Our Mission</h2>
            <p className="mt-2">
              To make reporting cybercrime as straightforward as possible for every citizen, regardless of their
              language, technical ability, or location. We believe that reducing friction in reporting leads to more
              cases being reported, faster action, and a safer digital India.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Key Features</h2>
            <ul className="mt-2 space-y-1.5">
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                Complaint filing in 10+ Indian languages
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                Guided step-by-step process with AI assistance
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                Evidence upload with integrity verification
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                Real-time complaint tracking
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
                Anonymous filing option
              </li>
            </ul>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
