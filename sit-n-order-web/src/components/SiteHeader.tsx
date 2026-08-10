import Link from "next/link";
import { SITE } from "@/lib/site";

/** The wordmark: the veg-badge square stands in for the "O" of Order. */
function Wordmark() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 font-display text-[1.0625rem] font-extrabold tracking-[-0.03em] text-ink no-underline"
    >
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <rect
          x="1.5"
          y="1.5"
          width="19"
          height="19"
          rx="4.5"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.75"
        />
        <circle cx="11" cy="11" r="4.25" fill="#f59e0b" />
      </svg>
      {SITE.name}
    </Link>
  );
}

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Wordmark />

        <nav aria-label="Main" className="hidden items-center gap-8 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-soft no-underline transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-secondary !px-4 !py-2 text-sm">
            Sign in
          </Link>
          <Link href="/signup" className="btn btn-primary !px-4 !py-2 text-sm">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
