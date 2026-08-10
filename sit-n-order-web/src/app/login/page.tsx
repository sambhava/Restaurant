import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to the ${SITE.name} dashboard.`,
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <section className="shell grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
      <div>
        <p className="eyebrow">Sign in</p>
        <h1 className="t-hero mt-5 text-[clamp(2.25rem,5vw,3.25rem)]">
          Your restaurant,
          <br />
          your numbers.
        </h1>
        <p className="t-lede mt-5 max-w-[40ch]">
          Menu, live orders, tables and analytics — one place, for the people
          you&rsquo;ve given access.
        </p>

        <ul className="mt-9 list-none space-y-3 border-t border-rule p-0 pt-7 text-sm text-ink-soft">
          <li>Live orders and the kitchen display</li>
          <li>Tables, QR codes and GST billing</li>
          <li>Revenue and what&rsquo;s selling</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-rule bg-paper p-7 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:p-9">
        <LoginForm />
        <p className="mt-8 text-center text-xs text-ink-dim">
          First time here?{" "}
          <Link href="/signup" className="text-amber-deep">
            Register your restaurant
          </Link>
        </p>
      </div>
    </section>
  );
}
