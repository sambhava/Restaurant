import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE.name} — email and WhatsApp, with a same-working-day response target.`,
};

export default function ContactPage() {
  return (
    <>
      <section className="shell pt-16 pb-12 lg:pt-24">
        <p className="eyebrow">Contact</p>
        <h1 className="t-hero mt-5 max-w-[16ch] text-[clamp(2.5rem,6vw,4rem)]">
          Talk to a person.
        </h1>
        <p className="t-lede mt-6 max-w-[48ch]">
          Questions before you sign up, or something not working after? Either
          way, the same two channels reach us.
        </p>
      </section>

      <section className="shell pb-20">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-rule p-7">
            <p className="eyebrow">Email</p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-3 block font-mono text-base text-ink no-underline hover:text-amber-deep"
            >
              {SITE.email}
            </a>
            <p className="mt-3 text-sm text-ink-soft">
              Best for anything with detail — a question about your menu setup,
              billing, or a bug with steps to reproduce it.
            </p>
          </div>

          <div className="rounded-2xl border border-rule p-7">
            <p className="eyebrow">WhatsApp</p>
            <p className="mt-3 font-mono text-base text-ink">{SITE.whatsapp}</p>
            <p className="mt-3 text-sm text-ink-soft">
              Best mid-service, when something needs sorting now and typing an
              email isn&rsquo;t realistic.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-rule bg-paper-2 p-7">
          <p className="eyebrow">What to expect</p>
          <dl className="mt-4 grid gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-dim">
                Response target
              </dt>
              <dd className="mt-1 text-[0.9375rem] text-ink">
                {SITE.support.responseTarget}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-dim">
                Hours
              </dt>
              <dd className="mt-1 text-[0.9375rem] text-ink">
                {SITE.support.hours}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-dim">
                Uptime goal
              </dt>
              <dd className="mt-1 text-[0.9375rem] text-ink">
                {SITE.support.uptimeGoal}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-ink-soft">
            A target is not a guarantee, and we&rsquo;d rather say so here than
            bury it. The{" "}
            <Link href="/legal/sla" className="text-amber-deep">
              Service Level Commitment
            </Link>{" "}
            sets out what we do and don&rsquo;t promise.
          </p>
        </div>

        {/* Required by the DPDP Act 2023: a named contact for data grievances. */}
        <div className="mt-5 rounded-2xl border border-rule p-7">
          <p className="eyebrow">Grievance officer</p>
          <p className="mt-3 max-w-[62ch] text-sm text-ink-soft">
            Under India&rsquo;s Digital Personal Data Protection Act 2023, you
            can raise any concern about how your personal data is handled with
            our grievance officer, who is required to respond.
          </p>
          <dl className="mt-4 space-y-1 text-[0.9375rem]">
            <div className="flex gap-2">
              <dt className="text-ink-dim">Name:</dt>
              <dd>{SITE.legal.grievanceOfficer.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-dim">Email:</dt>
              <dd>
                <a
                  href={`mailto:${SITE.legal.grievanceOfficer.email}`}
                  className="font-mono text-sm text-amber-deep no-underline"
                >
                  {SITE.legal.grievanceOfficer.email}
                </a>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-ink-dim">Address:</dt>
              <dd>{SITE.legal.address}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-12 rounded-2xl bg-ink px-8 py-16 text-center text-paper shadow-lg flex flex-col items-center justify-center">
          <h2 className="t-section text-paper text-[clamp(1.75rem,3.5vw,2.5rem)]">
            Ready to set it up?
          </h2>
          <p className="mt-4 max-w-[46ch] text-[0.9375rem] text-slate-300 leading-relaxed text-center mx-auto">
            The signup form takes a couple of minutes. We&rsquo;ll review and activate your account the same working day.
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
