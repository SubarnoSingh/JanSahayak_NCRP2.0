"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Resource } from "@/lib/types";
import { GovHeader } from "@/components/layout/GovHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Misc";

export default function GuidePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [resource, setResource] = useState<Resource | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get<{ resources: Resource[] }>("/resources")
      .then((r) => setResource(r.resources.find((x) => x.slug === slug) ?? null))
      .catch(() => setFailed(true));
  }, [slug]);

  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/learn" className="text-xs font-medium text-navy hover:underline">
          ← All guides
        </Link>

        {!resource && !failed && (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}
        {failed && (
          <Card className="mt-6 p-6 text-center text-sm text-ink-soft">This guide could not be loaded. Please try again.</Card>
        )}

        {resource && (
          <article className="mt-5 animate-fade-in-up">
            <Badge tone="saffron">{resource.scamType ?? "Guide"}</Badge>
            <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">{resource.title}</h1>
            <p className="mt-2 flex items-center gap-2 text-xs text-ink-faint">
              {resource.readMinutes} min read
              {resource.trending && <Badge tone="danger">Trending scam</Badge>}
            </p>
            <p className="mt-4 rounded-card border border-line bg-navy-tint/40 p-4 text-sm leading-relaxed text-ink">
              {resource.summary}
            </p>
            <MarkdownLite body={resource.body} />

            <Card className="mt-8 border-warn/25 bg-warn-tint/50 p-5">
              <h2 className="text-sm font-semibold text-ink">Facing this right now?</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Money gone? Call 1930 first — speed matters. Otherwise, report it so the next person is warned.
              </p>
              <div className="mt-3 flex gap-2.5">
                <a href="tel:1930">
                  <Button size="sm" variant="outlineDanger">Call 1930</Button>
                </a>
                <Link href="/report">
                  <Button size="sm">File a complaint</Button>
                </Link>
              </div>
            </Card>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}

/** Minimal markdown renderer (headings, lists, bold) — no runtime dependency. */
function MarkdownLite({ body }: { body: string }) {
  const blocks = body.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: number) => {
    if (list.length === 0) return;
    out.push(
      <ul key={`ul-${key}`} className="my-3 space-y-1.5 pl-1">
        {list.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
            <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron/70" />
            <span dangerouslySetInnerHTML={{ __html: inline(item) }} />
          </li>
        ))}
      </ul>
    );
    list = [];
  };

  blocks.forEach((line, idx) => {
    if (/^\d+\.\s/.test(line) || /^-\s/.test(line)) {
      list.push(line.replace(/^(\d+\.|-\s)\s*/, ""));
      return;
    }
    flushList(idx);
    if (line.startsWith("## ")) {
      out.push(
        <h2 key={idx} className="mt-6 mb-1 text-base font-semibold text-ink">
          {line.slice(3)}
        </h2>
      );
    } else if (line.trim() === "") {
      /* skip */
    } else {
      out.push(
        <p key={idx} className="mt-3 text-sm leading-relaxed text-ink-soft" dangerouslySetInnerHTML={{ __html: inline(line) }} />
      );
    }
  });
  flushList(blocks.length);

  return <div className="mt-2">{out}</div>;
}

function inline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/'([^']+)'/g, "'$1'");
}
