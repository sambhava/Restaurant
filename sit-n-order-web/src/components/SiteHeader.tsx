"use client";

import { useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);

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

        <div className="hidden items-center gap-2 sm:flex">
          <a href={`${SITE.dashboardUrl}/login`} className="btn btn-secondary !px-4 !py-2 text-sm">
            Sign in
          </a>
          <Link href="/signup" className="btn btn-primary !px-4 !py-2 text-sm">
            Get started
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rule text-ink hover:bg-paper-2 sm:hidden"
          aria-expanded={isOpen}
          aria-label="Toggle menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 12h16M4 6h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <nav
          aria-label="Mobile main navigation"
          className="border-t border-rule bg-paper px-6 py-5 shadow-lg sm:hidden"
        >
          <div className="flex flex-col gap-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="py-1 text-base font-medium text-ink no-underline hover:text-amber-deep"
              >
                {item.label}
              </Link>
            ))}
            <hr className="my-1 border-rule" />
            <div className="flex flex-col gap-3">
              <a
                href={`${SITE.dashboardUrl}/login`}
                onClick={() => setIsOpen(false)}
                className="btn btn-secondary w-full justify-center !py-2.5 text-center"
              >
                Sign in
              </a>
              <Link
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="btn btn-primary w-full justify-center !py-2.5 text-center"
              >
                Get started
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
