import type { Metadata } from "next";
import Link from "next/link";
import { SITE, formatINR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `One flat plan at ${formatINR(SITE.plan.priceMonthly)} per outlet per month. Every feature included — no tiers, no per-table charges.`,
};

/* Set as the artifact the product prints. An owner reads dozens of these a day,
   and framing the price as a bill makes a single flat plan read as itemised
   rather than thin. */

const INCLUDED = [
  ["QR ordering", "unlimited tables"],
  ["Menu management", "variants + add-ons"],
  ["Live orders", "real time"],
  ["Table billing", "GST invoices"],
  ["Analytics", "full history"],
  ["Support", "email + WhatsApp"],
  ["Updates", "included"],
];

const FAQS = [
  {
    q: "How do I pay?",
    a: "Bank transfer or UPI, monthly. After you sign up we send payment details and a GST invoice. Once payment lands we activate your account — usually the same working day.",
  },
  {
    q: "Is there a contract?",
    a: "No. It's month to month. Tell us you're stopping and we stop billing at the end of that month.",
  },
  {
    q: "What if I have two restaurants?",
    a: "Each outlet is its own account at its own price. They stay separate — separate menus, separate tables, separate numbers. There's no combined view across outlets yet.",
  },
  {
    q: "Do I get a GST invoice?",
    a: SITE.legal.gstin
      ? "Yes, with our GSTIN on it, for every payment."
      : "You get a numbered invoice for every payment. We are not GST-registered yet, so no GST is charged on your subscription — this page and your invoice will both change when that happens.",
  },
  {
    q: "What happens to my data if I leave?",
    a: "Ask and we'll export your menu and order history. After that we delete it — the Data Processing Addendum sets out the detail.",
  },
];

export default function PricingPage() {
  const { plan } = SITE;
  const gstAmount = SITE.legal.gstin
    ? Math.round((plan.priceMonthly * plan.gstRatePercent) / 100)
    : 0;
  const total = plan.priceMonthly + gstAmount;

  return (
    <>
      <section className="shell pt-16 pb-12 text-center lg:pt-24">
        <p className="eyebrow justify-center">Pricing</p>
        <h1 className="t-hero mt-5 text-[clamp(2.5rem,6vw,4rem)]">
          One plan. Everything in it.
        </h1>
        <p className="t-lede mx-auto mt-6 max-w-[46ch]">
          No feature tiers, no per-table charges, and no negotiating for the
          analytics.
        </p>
      </section>

      <section className="pb-8">
        <div className="receipt text-ink">
          <div className="text-center">
            <p className="font-display text-lg font-extrabold tracking-[-0.02em]">
              {SITE.name}
            </p>
            <p className="mt-0.5 text-[0.6875rem] uppercase tracking-[0.18em] text-ink-dim">
              Subscription summary
            </p>
          </div>

          <hr className="receipt-rule" />

          <div className="receipt-row text-[0.75rem] text-ink-dim">
            <span>Plan</span>
            <span>{plan.name}</span>
          </div>
          <div className="receipt-row text-[0.75rem] text-ink-dim">
            <span>Billing</span>
            <span>Monthly</span>
          </div>

          <hr className="receipt-rule" />

          <ul className="list-none space-y-0.5 p-0">
            {INCLUDED.map(([item, detail]) => (
              <li key={item} className="receipt-row">
                <span>{item}</span>
                <span className="text-ink-dim">{detail}</span>
              </li>
            ))}
          </ul>

          <hr className="receipt-rule" />

          <div className="receipt-row">
            <span>Subtotal</span>
            <span>{formatINR(plan.priceMonthly)}</span>
          </div>

          {SITE.legal.gstin ? (
            <div className="receipt-row text-ink-dim">
              <span>GST ({plan.gstRatePercent}%)</span>
              <span>{formatINR(gstAmount)}</span>
            </div>
          ) : (
            <div className="receipt-row text-[0.75rem] text-ink-dim">
              <span>GST</span>
              <span>Not applicable</span>
            </div>
          )}

          <div className="receipt-row receipt-total">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>

          <p className="mt-1 text-center text-[0.6875rem] text-ink-dim">
            {plan.unit}
          </p>

          <hr className="receipt-rule" />

          <div className="text-center">
            <Link href="/signup" className="btn btn-primary w-full !font-body">
              Get started
            </Link>
            <p className="mt-3 text-[0.6875rem] leading-relaxed text-ink-dim">
              Sign up first, pay after. We activate your account once payment is
              confirmed.
            </p>
          </div>

          <hr className="receipt-rule" />

          <p className="text-center text-[0.6875rem] tracking-[0.1em] text-ink-dim">
            THANK YOU · PLEASE VISIT AGAIN
          </p>
        </div>
      </section>

      <section className="shell py-24 border-t border-rule/60">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16 items-start">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">Questions</p>
            <h2 className="t-section mt-4 text-[2rem]">About paying.</h2>
            <p className="mt-4 text-sm text-ink-soft max-w-[36ch] leading-relaxed">
              Transparent pricing with no hidden charges, per-table fees, or setup costs.
            </p>
            <p className="mt-8 text-xs text-ink-dim leading-relaxed">
              Read our full{" "}
              <Link href="/legal/refund" className="text-amber-deep hover:underline">
                Refund &amp; Cancellation policy
              </Link>{" "}
              and{" "}
              <Link href="/legal/terms" className="text-amber-deep hover:underline">
                Terms of Service
              </Link>.
            </p>
          </div>

          <dl className="divide-y divide-rule border-y border-rule">
            {FAQS.map((f) => (
              <div key={f.q} className="py-6">
                <dt className="font-display text-base font-bold tracking-[-0.02em] text-ink">
                  {f.q}
                </dt>
                <dd className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
