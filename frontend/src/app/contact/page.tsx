"use client";
import { useMemo, useState } from "react";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { API_URL } from "@/lib/api";
import { officerDirectory, type OfficerDirectoryEntry } from "@/data/officerDirectory";

export default function ContactPage() {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const states = useMemo(() => officerDirectory.map((e) => e.state).sort(), []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return officerDirectory.filter((e) => {
      if (stateFilter && e.state !== stateFilter) return false;
      if (q) {
        const haystack = [
          e.state,
          e.nodalOfficer.name,
          e.nodalOfficer.rank,
          e.nodalOfficer.email,
          e.grievanceOfficer.name,
          e.grievanceOfficer.rank,
          e.grievanceOfficer.contact,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [search, stateFilter]);

  const downloadPdf = () => {
    window.open(`${API_URL}/api/directory.pdf`, "_blank");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Contact Us</h1>
          <p className="mt-1 text-sm font-semibold text-saffron-deep">State & UT Cyber Crime Officers</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            Find contact information for the designated cyber crime nodal and grievance officers across all
            States and Union Territories of India.
          </p>
        </div>

        {/* Prototype notice */}
        <div className="mt-4 rounded-control border border-warn/30 bg-warn-tint/60 px-4 py-3">
          <p className="text-xs leading-relaxed text-ink-soft">
            <strong className="font-semibold text-warn">Prototype directory.</strong> The contact details shown on this page
            are mock data for demonstration purposes. They do not represent real government officers.
          </p>
        </div>

        {/* Emergency callout */}
        <Card className="mt-5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-saffron-tint text-saffron-deep">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M10 2a6 6 0 0 1 6 6c0 4-6 10-6 10S4 12 4 8a6 6 0 0 1 6-6Z" strokeLinejoin="round" />
                <circle cx="10" cy="8" r="2" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Need to report a cyber financial fraud immediately?</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                Call{" "}
                <a href="tel:1930" className="font-semibold text-navy underline underline-offset-2 hover:text-navy-deep">
                  1930
                </a>{" "}
                — the first hour matters most for stopping fraudulent transactions.
              </p>
            </div>
          </div>
        </Card>

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="officer-search" className="mb-1.5 block text-sm font-medium text-ink">
              Search officers
            </label>
            <div className="relative">
              <svg
                viewBox="0 0 20 20"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="m12.5 12.5 4 4" strokeLinecap="round" />
              </svg>
              <input
                id="officer-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by state, officer name, rank or email…"
                className="h-10 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint/70 transition-colors focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>
          <div className="sm:w-56">
            <label htmlFor="state-filter" className="mb-1.5 block text-sm font-medium text-ink">
              Filter by state
            </label>
            <select
              id="state-filter"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink transition-colors focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="">All States &amp; UTs</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Button variant="secondary" size="md" onClick={downloadPdf} className="shrink-0">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M8 1v9m0 0-3-3m3 3 3-3M2 12v1.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download PDF
          </Button>
        </div>

        {/* Results count */}
        <p className="mt-4 text-xs text-ink-faint">
          Showing {filtered.length} of {officerDirectory.length} State/UTs
        </p>

        {/* Desktop table */}
        <div className="mt-3 hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-strong">
                <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wider text-ink-faint">S.No</th>
                <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wider text-ink-faint">State / UT</th>
                <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wider text-ink-faint">Nodal Cyber Cell Officer</th>
                <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wider text-ink-faint">Rank</th>
                <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wider text-ink-faint">Email</th>
                <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wider text-ink-faint">Grievance Officer</th>
                <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wider text-ink-faint">Rank</th>
                <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wider text-ink-faint">Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => (
                <tr
                  key={entry.state}
                  className={`border-b border-line transition-colors hover:bg-navy-tint/30 ${
                    i % 2 === 0 ? "bg-paper/60" : "bg-surface"
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-faint">{i + 1}</td>
                  <td className="px-3 py-2.5 text-sm font-medium text-ink">{entry.state}</td>
                  <td className="px-3 py-2.5 text-sm text-ink">{entry.nodalOfficer.name}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-soft">{entry.nodalOfficer.rank}</td>
                  <td className="px-3 py-2.5 text-xs text-navy break-all">{entry.nodalOfficer.email}</td>
                  <td className="px-3 py-2.5 text-sm text-ink">{entry.grievanceOfficer.name}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-soft">{entry.grievanceOfficer.rank}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs font-mono text-ink">{entry.grievanceOfficer.contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mt-3 space-y-3 md:hidden">
          {filtered.length === 0 && (
            <div className="rounded-card border border-dashed border-line-strong bg-paper/60 px-6 py-10 text-center">
              <p className="text-sm font-medium text-ink">No officers found</p>
              <p className="mt-1 text-xs text-ink-faint">Try a different search term or filter.</p>
            </div>
          )}
          {filtered.map((entry) => (
            <MobileCard key={entry.state} entry={entry} />
          ))}
        </div>

        {/* Empty state for desktop */}
        {filtered.length === 0 && (
          <div className="mt-6 hidden rounded-card border border-dashed border-line-strong bg-paper/60 px-6 py-10 text-center md:block">
            <p className="text-sm font-medium text-ink">No officers found</p>
            <p className="mt-1 text-xs text-ink-faint">Try a different search term or filter.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function MobileCard({ entry }: { entry: OfficerDirectoryEntry }) {
  return (
    <Card className="p-4 animate-fade-in-up">
      <p className="text-sm font-bold uppercase tracking-wide text-navy">{entry.state}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-faint">Nodal Cyber Cell Officer</p>
          <p className="mt-1 text-sm font-medium text-ink">{entry.nodalOfficer.name}</p>
          <p className="text-xs text-ink-soft">{entry.nodalOfficer.rank}</p>
          <a href={`mailto:${entry.nodalOfficer.email}`} className="mt-0.5 block text-xs text-navy break-all hover:underline">
            {entry.nodalOfficer.email}
          </a>
        </div>
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-faint">Grievance Officer</p>
          <p className="mt-1 text-sm font-medium text-ink">{entry.grievanceOfficer.name}</p>
          <p className="text-xs text-ink-soft">{entry.grievanceOfficer.rank}</p>
          <a href={`tel:${entry.grievanceOfficer.contact}`} className="mt-0.5 block text-xs font-mono text-navy hover:underline">
            {entry.grievanceOfficer.contact}
          </a>
        </div>
      </div>
    </Card>
  );
}
