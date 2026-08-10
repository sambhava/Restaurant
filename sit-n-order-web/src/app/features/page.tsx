import type { Metadata } from "next";
import Link from "next/link";
import { DrawOnScroll } from "@/components/DrawOnScroll";
import {
  SceneQrTable,
  ScenePhoneMenu,
  SceneKitchen,
  SceneTables,
  SceneBill,
  SceneAnalytics,
} from "@/components/illustrations/Scenes";
import { SITE, formatINR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Features",
  description:
    "QR ordering, a live kitchen display, menu management with variants and add-ons, table-wise billing with GST invoices, and daily analytics.",
};

/**
 * Every claim below describes behaviour that exists in the product today.
 * Nothing here is aspirational — if a capability is not built, it belongs in
 * "Not in the box" at the foot of the page, not in a feature card.
 */
const SECTIONS = [
  {
    id: "ordering",
    eyebrow: "At the table",
    title: "A QR code per table, and no app to install",
    body: "Print a code for every table from the dashboard. A diner scans it and your menu opens in their browser, already knowing which table they're sitting at — so the order arrives labelled, and nobody has to flag down a waiter to start.",
    points: [
      "Table number travels with the order, encoded in a signed link",
      "Works in any phone browser; nothing to download and no account to create",
      "Tampering with the link is rejected rather than silently accepted",
      "An offline notice appears if the connection drops, and it reconnects on its own",
    ],
    Scene: SceneQrTable,
  },
  {
    id: "menu",
    eyebrow: "Your menu",
    title: "Portions, add-ons and the marks diners look for",
    body: "Build the menu the way you actually serve it. Half and full, extra cheese, categories, photographs, and the green and red FSSAI veg indicators on every item.",
    points: [
      "Variants with their own price difference — half, full, small, large",
      "Add-ons priced individually",
      "Categories, descriptions and photographs per item",
      "Veg and non-veg marks shown to diners and staff alike",
      "Mark an item unavailable and it leaves the live menu at once",
      "Search across name, category and description",
    ],
    Scene: ScenePhoneMenu,
  },
  {
    id: "kitchen",
    eyebrow: "In the kitchen",
    title: "New, cooking, ready — on one screen",
    body: "Orders arrive on the kitchen display the moment they're placed. Staff tap a ticket to move it along, and the diner sees the same status change on their phone.",
    points: [
      "Three columns, with a live count on each",
      "One tap moves a ticket from new to cooking to ready to served",
      "Special instructions shown against the order they belong to",
      "Live orders update without anyone refreshing anything",
    ],
    Scene: SceneKitchen,
  },
  {
    id: "tables",
    eyebrow: "On the floor",
    title: "Every table, and what it owes right now",
    body: "A grid of your tables showing which are occupied and what each has run up. Open one to see its running bill, add items for someone who ordered at the counter, or remove something sent back.",
    points: [
      "Set your table count; occupied tables show their running total",
      "Add items to a table's bill directly from the dashboard",
      "Remove an item before the kitchen marks it ready",
      "Print or reprint a table's QR code",
      "Close the bill and the table frees up",
    ],
    Scene: SceneTables,
  },
  {
    id: "billing",
    eyebrow: "Settling up",
    title: "A GST invoice that prints on your existing printer",
    body: "Everything ordered at a table stays on one bill across as many rounds as they order. Print it as a tax invoice — subtotal, GST at 5%, total — sized for a standard thermal roll.",
    points: [
      "Repeat rounds consolidate onto a single bill",
      "Subtotal, GST at 5% and total calculated as items change",
      "Prints to any printer already attached to your computer",
      "Closing a table prints the bill and marks the session paid",
    ],
    Scene: SceneBill,
  },
  {
    id: "analytics",
    eyebrow: "Afterwards",
    title: "What sold, when, and how that compares",
    body: "Revenue for today, this week or any month this year, measured against the period before it. No exports, no spreadsheet.",
    points: [
      "Revenue trend with the change against the previous period",
      "Busiest hours across the day",
      "Best-selling dishes, ranked",
      "Category split and veg against non-veg",
      "Which tables bring in the most",
      "Average order value and average monthly revenue",
    ],
    Scene: SceneAnalytics,
  },
];

/* Stating the limits plainly is worth more than one more feature card. An owner
   who finds this out after paying asks for a refund. */
const NOT_INCLUDED = [
  "Online payment collection — diners pay you at the counter as they do now",
  "Inventory or stock tracking",
  "A combined view across multiple outlets — each outlet is its own account",
  "Integrations with Swiggy, Zomato or third-party POS systems",
];

export default function FeaturesPage() {
  return (
    <>
      <section className="shell pt-16 pb-14 lg:pt-24">
        <p className="eyebrow">Features</p>
        <h1 className="t-hero mt-5 max-w-[14ch] text-[clamp(2.5rem,6vw,4rem)]">
          What it does, in full.
        </h1>
        <p className="t-lede mt-6 max-w-[52ch]">
          Two apps that work together: the menu your diners see on their phones,
          and the dashboard your staff run the floor from.
        </p>
      </section>

      <nav aria-label="Sections" className="border-y border-rule bg-paper-2">
        <div className="shell flex gap-6 overflow-x-auto py-4">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-dim no-underline transition-colors hover:text-amber-deep"
            >
              {s.eyebrow}
            </a>
          ))}
        </div>
      </nav>

      <div className="shell space-y-24 py-20">
        {SECTIONS.map((s, i) => (
          <DrawOnScroll key={s.id}>
            <section
              id={s.id}
              className={`grid items-start gap-10 scroll-mt-24 md:grid-cols-2 ${
                i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="fade-up">
                <p className="eyebrow">{s.eyebrow}</p>
                <h2 className="t-card mt-3 text-[1.625rem]">{s.title}</h2>
                <p className="mt-3 max-w-[48ch] text-[0.9375rem] text-ink-soft">
                  {s.body}
                </p>

                <ul className="mt-6 list-none space-y-2.5 p-0">
                  {s.points.map((p) => (
                    <li
                      key={p}
                      className="flex gap-3 text-[0.9375rem] text-ink-soft"
                    >
                      {/* The veg mark again, doing structural work as the bullet */}
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        className="mt-[6px] shrink-0"
                        aria-hidden="true"
                      >
                        <rect
                          x="0.75"
                          y="0.75"
                          width="11.5"
                          height="11.5"
                          rx="2.5"
                          fill="none"
                          stroke="#b45309"
                          strokeWidth="1.5"
                        />
                        <circle cx="6.5" cy="6.5" r="2.6" fill="#b45309" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-rule bg-paper-2 p-7">
                <s.Scene className="mx-auto w-full max-w-[300px] text-ink" />
              </div>
            </section>
          </DrawOnScroll>
        ))}
      </div>

      <section className="border-t border-rule bg-paper-2 py-20">
        <div className="shell-narrow">
          <p className="eyebrow">Worth knowing</p>
          <h2 className="t-section mt-4 text-[2rem]">Not in the box</h2>
          <p className="mt-4 text-[0.9375rem] text-ink-soft">
            Better you know now than after you&rsquo;ve paid.
          </p>
          <ul className="mt-6 list-none space-y-2.5 p-0">
            {NOT_INCLUDED.map((n) => (
              <li
                key={n}
                className="flex gap-3 text-[0.9375rem] text-ink-soft"
              >
                <span aria-hidden="true" className="mt-[1px] text-ink-dim">
                  —
                </span>
                {n}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/pricing" className="btn btn-primary">
              See pricing
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Ask us something
            </Link>
          </div>

          <p className="mt-6 font-mono text-xs text-ink-dim">
            {formatINR(SITE.plan.priceMonthly)} {SITE.plan.unit}
          </p>
        </div>
      </section>
    </>
  );
}
