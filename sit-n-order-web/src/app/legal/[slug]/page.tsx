import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import { SITE, LEGAL_PAGES, formatINR } from "@/lib/site";

/**
 * Legal documents.
 *
 * Source lives in src/content/legal/*.md so the wording can be edited (or given
 * to a lawyer) without touching React. Placeholders are substituted here from
 * lib/site.ts, and anything still unfilled renders as a visible highlight —
 * shipping with "[YOUR CITY]" showing is bad, but shipping with it invisible
 * is worse.
 */

export function generateStaticParams() {
  return LEGAL_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = LEGAL_PAGES.find((p) => p.slug === slug);
  if (!page) return {};
  return {
    title: page.title,
    description: `${page.title} for ${SITE.name}.`,
  };
}

/** GST wording depends on whether a GSTIN has been configured yet. */
function gstClause(): string {
  return SITE.legal.gstin
    ? `GST is charged at ${SITE.plan.gstRatePercent}% on top of the subscription price. Our GSTIN is ${SITE.legal.gstin}, and it appears on every invoice.`
    : `We are not currently registered for GST, so no GST is added to your subscription. If that changes we will tell you at least 30 days beforehand, and invoices will show our GSTIN from then on.`;
}

const SUBSTITUTIONS: Record<string, string> = {
  ENTITY_NAME: SITE.legal.entityName,
  ENTITY_TYPE: SITE.legal.entityType,
  ADDRESS: SITE.legal.address,
  JURISDICTION_CITY: SITE.legal.jurisdictionCity,
  JURISDICTION_STATE: SITE.legal.jurisdictionState,
  GRIEVANCE_NAME: SITE.legal.grievanceOfficer.name,
  GRIEVANCE_EMAIL: SITE.legal.grievanceOfficer.email,
  EMAIL: SITE.email,
  WHATSAPP: SITE.whatsapp,
  PRICE: formatINR(SITE.plan.priceMonthly),
  GST_CLAUSE: gstClause(),
  UPTIME_GOAL: SITE.support.uptimeGoal,
  SUPPORT_CHANNELS: SITE.support.channels,
  SUPPORT_HOURS: SITE.support.hours,
  RESPONSE_TARGET: SITE.support.responseTarget,
};

/**
 * Replace [TOKEN] with its configured value. A value that is itself still an
 * unfilled placeholder — "[YOUR CITY]" — is wrapped in <mark> so it is
 * impossible to miss on the rendered page.
 */
function substitute(markdown: string): string {
  return markdown.replace(/\[([A-Z_]+)\]/g, (whole, token: string) => {
    const value = SUBSTITUTIONS[token];
    if (value === undefined) return whole;
    const unfilled = /^\[.*\]$/.test(value.trim()) || value.includes("[");
    return unfilled ? `<mark class="todo">${value}</mark>` : value;
  });
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const page = LEGAL_PAGES.find((p) => p.slug === slug);
  if (!page) notFound();

  const file = path.join(process.cwd(), "src", "content", "legal", `${slug}.md`);
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    notFound();
  }

  // The Markdown is ours, not user input, so rendering it as HTML is safe here.
  const html = await marked.parse(substitute(raw));

  // The lede paragraph becomes the plain-language summary box.
  const [summary, ...rest] = html.split("\n<h2");
  const body = rest.length ? `<h2${rest.join("\n<h2")}` : "";

  return (
    <article className="shell-narrow py-16 lg:py-20">
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link href="/" className="text-sm text-ink-dim no-underline hover:text-ink">
          ← Back to {SITE.name}
        </Link>
      </nav>

      <p className="eyebrow">Legal</p>
      <h1 className="t-section mt-4 text-[clamp(1.875rem,4vw,2.5rem)]">
        {page.title}
      </h1>
      <p className="mt-3 font-mono text-xs text-ink-dim">
        Last updated {SITE.legal.lastUpdated}
      </p>

      <div
        className="summary-box"
        dangerouslySetInnerHTML={{ __html: summary }}
      />

      <div className="prose" dangerouslySetInnerHTML={{ __html: body }} />

      <footer className="mt-16 border-t border-rule pt-8">
        <p className="text-sm text-ink-soft">
          Questions about this document? Email{" "}
          <a href={`mailto:${SITE.email}`} className="text-amber-deep">
            {SITE.email}
          </a>
          .
        </p>
        <nav aria-label="Other legal documents" className="mt-6">
          <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-dim">
            Other documents
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 p-0 text-sm">
            {LEGAL_PAGES.filter((p) => p.slug !== slug).map((p) => (
              <li key={p.slug} className="list-none">
                <Link
                  href={`/legal/${p.slug}`}
                  className="text-ink-soft no-underline hover:text-ink"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </footer>
    </article>
  );
}
