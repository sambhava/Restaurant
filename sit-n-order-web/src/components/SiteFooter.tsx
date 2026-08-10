import Link from "next/link";
import { SITE, LEGAL_PAGES } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule bg-paper-2">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-base font-extrabold tracking-[-0.03em] text-ink">
            {SITE.name}
          </p>
          <p className="mt-2 max-w-[26ch] text-sm text-ink-soft">
            QR ordering, a live kitchen view and GST-ready bills for Indian
            restaurants.
          </p>
        </div>

        <nav aria-label="Product">
          <h2 className="mb-3 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-dim">
            Product
          </h2>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/features", label: "Features" },
              { href: "/pricing", label: "Pricing" },
              { href: "/signup", label: "Get started" },
              { href: "/login", label: "Sign in" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink-soft no-underline hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal">
          <h2 className="mb-3 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-dim">
            Legal
          </h2>
          <ul className="space-y-2 text-sm">
            {LEGAL_PAGES.map((p) => (
              <li key={p.slug}>
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

        <div>
          <h2 className="mb-3 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-dim">
            Contact
          </h2>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>
              <a href={`mailto:${SITE.email}`} className="no-underline hover:text-ink">
                {SITE.email}
              </a>
            </li>
            <li>{SITE.phone}</li>
            <li className="pt-1 text-xs text-ink-dim">
              {SITE.support.channels} · {SITE.support.responseTarget}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="shell flex flex-col gap-2 py-5 text-xs text-ink-dim sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.legal.entityName}
          </p>
          <p>Made for Indian restaurants · Prices in ₹</p>
        </div>
      </div>
    </footer>
  );
}
