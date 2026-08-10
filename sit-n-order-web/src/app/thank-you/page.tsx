import type { Metadata } from "next";
import Link from "next/link";
import { SITE, formatINR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Registration received",
  description: "We've got your details and we'll be in touch within one working day.",
  robots: { index: false },
};

/* The acknowledgement screen. It restates what was agreed to and what happens
   next, so nobody is left wondering whether the form actually submitted. */
export default function ThankYouPage() {
  return (
    <section className="shell-narrow py-20 lg:py-28">
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
        <rect x="1.75" y="1.75" width="48.5" height="48.5" rx="12"
          fill="none" stroke="#f59e0b" strokeWidth="2" />
        <path d="M15 26.5 L22.5 34 L37 19.5" fill="none" stroke="#0f172a"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <h1 className="t-hero mt-7 text-[clamp(2.25rem,5vw,3.25rem)]">
        Registration received.
      </h1>
      <p className="t-lede mt-5 max-w-[46ch]">
        A confirmation is on its way to the email address you gave us. If it
        hasn&rsquo;t arrived in a few minutes, check your spam folder.
      </p>

      <div className="mt-12 rounded-2xl border border-rule bg-paper-2 p-7">
        <p className="eyebrow">What happens next</p>
        <ol className="mt-5 list-none space-y-5 p-0">
          {[
            ["We review your details", "Within one working day."],
            ["We send payment details", `${formatINR(SITE.plan.priceMonthly)} ${SITE.plan.unit}, by bank transfer or UPI, with an invoice.`],
            ["Your account goes live", "Once payment is confirmed. You'll get a second email with your sign-in details and a temporary password."],
            ["You set up your menu", "Add your dishes, set your table count, print the QR codes."],
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
      </div>

      <div className="mt-8 rounded-2xl border border-rule p-7">
        <p className="eyebrow">What you agreed to</p>
        <p className="mt-4 text-sm text-ink-soft">
          You accepted our{" "}
          <Link href="/legal/terms" className="text-amber-deep">Terms of Service</Link>,{" "}
          <Link href="/legal/acceptable-use" className="text-amber-deep">Acceptable Use Policy</Link>,{" "}
          <Link href="/legal/privacy" className="text-amber-deep">Privacy Policy</Link>,{" "}
          <Link href="/legal/dpa" className="text-amber-deep">Data Processing Addendum</Link>{" "}
          and{" "}
          <Link href="/legal/refund" className="text-amber-deep">Refund &amp; Cancellation policy</Link>.
          We recorded each consent separately, with the time you gave it.
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          To withdraw a consent or ask for your data, email{" "}
          <a href={`mailto:${SITE.legal.grievanceOfficer.email}`} className="text-amber-deep">
            {SITE.legal.grievanceOfficer.email}
          </a>.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/features" className="btn btn-secondary">
          Read up while you wait
        </Link>
        <Link href="/contact" className="btn btn-secondary">
          Contact us
        </Link>
      </div>
    </section>
  );
}
