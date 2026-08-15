import Link from "next/link";
import { DrawOnScroll } from "@/components/DrawOnScroll";
import { HeroThread } from "@/components/illustrations/HeroThread";
import {
  SceneKitchen,
  ScenePhoneMenu,
  SceneAnalytics,
  SceneTables,
} from "@/components/illustrations/Scenes";
import { SITE, formatINR } from "@/lib/site";

/* The three stages are a real sequence — a diner cannot reach stage 2 without
   stage 1 — so they are numbered. Nothing else on this page is a sequence, and
   nothing else is numbered. */
const STAGES = [
  {
    n: "1",
    title: "The diner scans",
    body: "Each table gets its own QR code. Scanning opens your menu in the browser — no app to install, no counter queue, no waiting to catch someone's eye.",
  },
  {
    n: "2",
    title: "The kitchen sees it",
    body: "The order appears on your kitchen display the moment it's placed. Staff move it from new to cooking to ready, and the diner watches it change on their phone.",
  },
  {
    n: "3",
    title: "The bill adds up",
    body: "Everything ordered at a table stays on one running bill. Print the GST invoice when they ask for it, and close the table.",
  },
];

const FEATURES = [
  {
    title: "Your menu, exactly as you serve it",
    body: "Half and full portions, add-ons, categories, photographs, and the green and red veg marks diners look for first. Mark something unavailable and it disappears from the menu at once.",
    Scene: ScenePhoneMenu,
  },
  {
    title: "One screen the kitchen can work from",
    body: "New, cooking and ready in three columns. Tap a ticket to move it along. Staff can add items from the dashboard too, for anyone who orders at the counter.",
    Scene: SceneKitchen,
  },
  {
    title: "Every table, and what it owes",
    body: "See which tables are occupied and what each has run up. Print QR codes for your tables, print the bill, close the session — the table is free again.",
    Scene: SceneTables,
  },
  {
    title: "The numbers, without a spreadsheet",
    body: "Revenue by day, week or month against the period before it. Busiest hours, best-selling dishes, category split, veg against non-veg, and which tables earn most.",
    Scene: SceneAnalytics,
  },
];

const FAQS = [
  {
    q: "Do my customers need to download anything?",
    a: "No. The QR code opens your menu in whatever browser is already on their phone. Nothing to install, and no sign-up before they can order.",
  },
  {
    q: "Does it take payments?",
    a: "Not yet. Diners order through the app; they pay you the way they already do — cash, UPI or card at your counter. The bill and GST invoice print from the dashboard.",
  },
  {
    q: "What if the internet drops mid-service?",
    a: "The diner's phone shows an offline notice rather than failing silently, and reconnects on its own. Your dashboard behaves the same way. Orders already placed are safe.",
  },
  {
    q: "How many tables can I run?",
    a: "As many as you set. There is no table limit and no per-table charge — one price covers the outlet.",
  },
  {
    q: "How do I get started?",
    a: "Fill in the signup form and we'll send payment details. Once payment is confirmed we activate your account — usually the same working day — and email you your login.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="shell grid items-center gap-12 pt-16 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
        <div>
          <p className="eyebrow">For Indian restaurants</p>
          <h1 className="t-hero mt-5">
            Orders that start
            <br />
            at the table.
          </h1>
          <p className="t-lede mt-6 max-w-[46ch]">
            One QR code on each table. Diners order from their own phone, the
            ticket lands in your kitchen, and the bill adds itself up.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary">
              Get started
            </Link>
            <Link href="/features" className="btn btn-secondary">
              See what it does
            </Link>
          </div>

          <p className="mt-6 font-mono text-xs text-ink-dim">
            {formatINR(SITE.plan.priceMonthly)} {SITE.plan.unit} · everything
            included
          </p>
        </div>

        <DrawOnScroll threshold={0.1}>
          <HeroThread className="w-full max-w-[460px] text-ink lg:ml-auto" />
        </DrawOnScroll>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="border-y border-rule bg-paper-2 py-20">
        <div className="shell">
          <p className="eyebrow">How it works</p>
          <h2 className="t-section mt-4 max-w-[18ch]">
            Three steps, and nobody waits.
          </h2>

          <ol className="mt-12 grid list-none gap-8 p-0 md:grid-cols-3">
            {STAGES.map((s) => (
              <li key={s.n} className="border-t-2 border-ink pt-5">
                <span className="font-mono text-xs font-bold text-amber-deep">
                  {s.n}
                </span>
                <h3 className="t-card mt-2">{s.title}</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="shell py-24">
        <p className="eyebrow">What you get</p>
        <h2 className="t-section mt-4 max-w-[20ch]">
          Everything the floor and the kitchen need.
        </h2>

        <div className="mt-16 space-y-20">
          {FEATURES.map((f, i) => (
            <DrawOnScroll key={f.title}>
              <div
                className={`grid items-center gap-10 md:grid-cols-2 ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="fade-up">
                  <h3 className="t-card text-2xl">{f.title}</h3>
                  <p className="mt-3 max-w-[46ch] text-[0.9375rem] text-ink-soft">
                    {f.body}
                  </p>
                </div>
                <div className="rounded-2xl border border-rule bg-paper-2 p-6">
                  <f.Scene className="mx-auto w-full max-w-[300px] text-ink" />
                </div>
              </div>
            </DrawOnScroll>
          ))}
        </div>
      </section>

      {/* ── Pricing teaser ───────────────────────────────────────────────── */}
      <section className="border-y border-rule bg-paper-2 py-20">
        <div className="shell-narrow text-center">
          <p className="eyebrow justify-center">Pricing</p>
          <h2 className="t-section mt-4">One plan. Everything in it.</h2>
          <p className="t-lede mx-auto mt-4 max-w-[44ch]">
            No feature tiers, no per-table charges, and no negotiating for the
            analytics. {formatINR(SITE.plan.priceMonthly)} {SITE.plan.unit}.
          </p>
          <Link href="/pricing" className="btn btn-primary mt-8">
            See what&rsquo;s included
          </Link>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="shell py-24 border-t border-rule/60">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16 items-start">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">Questions</p>
            <h2 className="t-section mt-4">Before you ask.</h2>
            <p className="mt-4 text-sm text-ink-soft max-w-[36ch] leading-relaxed">
              Everything you need to know about getting started, hardware requirements, and how Sit-N-Order works at your tables.
            </p>
            <div className="mt-8">
              <Link href="/contact" className="text-xs font-semibold text-amber-deep hover:underline">
                Have a different question? Talk to us →
              </Link>
            </div>
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

      {/* ── Close CTA ────────────────────────────────────────────────────── */}
      <section className="shell pb-24">
        <div className="rounded-2xl bg-ink px-8 py-16 text-center text-paper shadow-lg flex flex-col items-center justify-center">
          <h2 className="t-section text-paper">Put a QR on every table.</h2>
          <p className="mt-4 max-w-[46ch] text-[0.9375rem] text-slate-300 leading-relaxed text-center">
            Tell us about your restaurant and we&rsquo;ll set you up. Most
            accounts are live the same working day.
          </p>
          <Link
            href="/signup"
            className="btn mt-8 bg-amber font-semibold text-ink hover:brightness-95 !px-8 !py-3.5 shadow-md"
          >
            Get started
          </Link>
        </div>
      </section>
    </>
  );
}
