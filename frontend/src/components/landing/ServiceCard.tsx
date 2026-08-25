"use client";
import Link from "next/link";
import type { ReactNode } from "react";

export function ServiceCard({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-card border border-line bg-surface p-4 shadow-card transition-all duration-150 hover:border-navy-border hover:shadow-raised"
    >
      <span aria-hidden className="mb-3 flex h-9 w-9 items-center justify-center rounded-control bg-navy-tint text-navy">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-soft">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-navy transition-transform group-hover:translate-x-0.5">
        {cta}
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="m5.5 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
