import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";
import { SITE, formatINR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get started",
  description: `Register your restaurant for ${SITE.name}. Tell us about your outlet, and we'll send payment details and activate your account.`,
};

export default function SignupPage() {
  return (
    <section className="shell grid gap-14 py-16 lg:grid-cols-[1fr_1.15fr] lg:py-24">
      <div>
        <p className="eyebrow">Get started</p>
        <h1 className="t-hero mt-5 text-[clamp(2.25rem,5vw,3.25rem)]">
          Register your restaurant.
        </h1>
        <p className="t-lede mt-5 max-w-[40ch]">
          A few details about your outlet, and we&rsquo;ll take it from there.
        </p>

        <ol className="mt-10 list-none space-y-5 border-t border-rule p-0 pt-8">
          {[
            ["You fill this in", "Two minutes, and nothing you don't have to hand."],
            ["We send payment details", "Within one working day, with an invoice."],
            ["Your account goes live", "Once payment clears — usually the same working day. We email your login."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="mt-0.5 font-mono text-xs font-bold text-amber-deep">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-1 text-sm text-ink-soft">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-8 font-mono text-xs text-ink-dim">
          {formatINR(SITE.plan.priceMonthly)} {SITE.plan.unit}
        </p>
        <p className="mt-4 text-sm text-ink-soft">
          Already set up?{" "}
          <Link href="/login" className="text-amber-deep">
            Sign in
          </Link>
        </p>
      </div>

      <div className="rounded-2xl border border-rule bg-paper p-7 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:p-9">
        <SignupForm />
      </div>
    </section>
  );
}
