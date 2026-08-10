"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupSchema, INDIAN_STATES } from "@/lib/signup-schema";

/**
 * The shape the form itself holds.
 *
 * Deliberately not z.input<typeof signupSchema>: z.coerce.number() types its
 * input as `unknown`, which is right for the API boundary but useless for a
 * controlled input. The schema still validates every value before submit.
 */
type SignupInput = {
  businessName: string;
  ownerName: string;
  city: string;
  state: string;
  outletCount: number;
  tableCount: number;
  email: string;
  phone: string;
  preferredLanguage: "english" | "hindi" | "other";
  fssaiLicense: string;
  gstin: string;
  consentTerms: boolean;
  consentDataProcessing: boolean;
  consentPayment: boolean;
  consentMarketing: boolean;
  consentWhatsapp: boolean;
};

/* Four steps, because consent deserves its own screen rather than a checkbox
   buried under a submit button. */
const STEPS = [
  { n: 1, label: "Restaurant" },
  { n: 2, label: "Contact" },
  { n: 3, label: "Compliance" },
  { n: 4, label: "Consent" },
] as const;

const FIELDS_BY_STEP: Record<number, (keyof SignupInput)[]> = {
  1: ["businessName", "ownerName", "city", "state", "outletCount", "tableCount"],
  2: ["email", "phone", "preferredLanguage"],
  3: ["fssaiLicense", "gstin"],
  4: ["consentTerms", "consentDataProcessing", "consentPayment"],
};

const EMPTY: SignupInput = {
  businessName: "", ownerName: "", city: "", state: "",
  outletCount: 1, tableCount: 10,
  email: "", phone: "", preferredLanguage: "english",
  fssaiLicense: "", gstin: "",
  consentTerms: false,
  consentDataProcessing: false,
  consentPayment: false,
  consentMarketing: false,
  consentWhatsapp: false,
};

type Errors = Partial<Record<string, string>>;

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<SignupInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof SignupInput>(key: K, value: SignupInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  /** Validate only the current step's fields, so step 1 isn't blocked by step 4. */
  function validateStep(n: number): boolean {
    const result = signupSchema.safeParse(values);
    if (result.success) return true;

    const all = result.error.flatten().fieldErrors as Errors;
    const mine: Errors = {};
    for (const f of FIELDS_BY_STEP[n]) {
      const msg = (all as Record<string, string[] | undefined>)[f as string]?.[0];
      if (msg) mine[f as string] = msg;
    }
    setErrors(mine);
    return Object.keys(mine).length === 0;
  }

  function next() {
    if (validateStep(step)) {
      setStep((s) => Math.min(4, s + 1));
      setFormError(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep(4)) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        router.push("/thank-you");
        return;
      }

      const body = await res.json().catch(() => ({}));
      if (body.fields) {
        setErrors(
          Object.fromEntries(
            Object.entries(body.fields as Record<string, string[]>).map(
              ([k, v]) => [k, v[0]],
            ),
          ),
        );
      }
      setFormError(body.error ?? "Something went wrong. Please try again.");
    } catch {
      setFormError(
        "We couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const label = "block text-sm font-medium text-ink mb-1.5";
  const err = (k: string) =>
    errors[k] ? (
      <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate>
      {/* Progress */}
      <ol className="mb-9 flex list-none gap-1.5 p-0">
        {STEPS.map((s) => (
          <li key={s.n} className="flex-1">
            <div
              className={`h-[3px] rounded-full transition-colors ${
                s.n <= step ? "bg-amber" : "bg-rule"
              }`}
            />
            <p
              className={`mt-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] ${
                s.n === step ? "text-ink" : "text-ink-dim"
              }`}
            >
              {s.label}
            </p>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <fieldset className="space-y-5 border-0 p-0">
          <legend className="sr-only">About your restaurant</legend>
          <div>
            <label className={label} htmlFor="businessName">Restaurant name</label>
            <input id="businessName" className="input" value={values.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              autoComplete="organization" required />
            {err("businessName")}
          </div>
          <div>
            <label className={label} htmlFor="ownerName">Your name</label>
            <input id="ownerName" className="input" value={values.ownerName}
              onChange={(e) => set("ownerName", e.target.value)}
              autoComplete="name" required />
            {err("ownerName")}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="city">City</label>
              <input id="city" className="input" value={values.city}
                onChange={(e) => set("city", e.target.value)}
                autoComplete="address-level2" required />
              {err("city")}
            </div>
            <div>
              <label className={label} htmlFor="state">State</label>
              <select id="state" className="input" value={values.state}
                onChange={(e) => set("state", e.target.value)} required>
                <option value="">Select a state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {err("state")}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="outletCount">Outlets</label>
              <input id="outletCount" type="number" min={1} className="input"
                value={values.outletCount}
                onChange={(e) => set("outletCount", Number(e.target.value))} required />
              {err("outletCount")}
            </div>
            <div>
              <label className={label} htmlFor="tableCount">Tables</label>
              <input id="tableCount" type="number" min={1} className="input"
                value={values.tableCount}
                onChange={(e) => set("tableCount", Number(e.target.value))} required />
              {err("tableCount")}
            </div>
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="space-y-5 border-0 p-0">
          <legend className="sr-only">How we reach you</legend>
          <div>
            <label className={label} htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={values.email}
              onChange={(e) => set("email", e.target.value)}
              autoComplete="email" required />
            <p className="mt-1.5 text-xs text-ink-dim">
              This becomes your sign-in address.
            </p>
            {err("email")}
          </div>
          <div>
            <label className={label} htmlFor="phone">Mobile number</label>
            <input id="phone" type="tel" className="input" value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              autoComplete="tel" placeholder="98765 43210" required />
            {err("phone")}
          </div>
          <div>
            <label className={label} htmlFor="preferredLanguage">
              Language you&rsquo;d prefer we use
            </label>
            <select id="preferredLanguage" className="input"
              value={values.preferredLanguage}
              onChange={(e) =>
                set("preferredLanguage", e.target.value as SignupInput["preferredLanguage"])
              }>
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="other">Something else</option>
            </select>
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="space-y-5 border-0 p-0">
          <legend className="sr-only">Compliance details</legend>
          <p className="text-sm text-ink-soft">
            Both optional. Give them now and your invoices and menu are set up
            correctly from the start; add them later if you&rsquo;d rather.
          </p>
          <div>
            <label className={label} htmlFor="fssaiLicense">
              FSSAI licence number{" "}
              <span className="font-normal text-ink-dim">â€” optional</span>
            </label>
            <input id="fssaiLicense" className="input font-mono"
              value={values.fssaiLicense} inputMode="numeric"
              onChange={(e) => set("fssaiLicense", e.target.value)}
              placeholder="14 digits" />
            <p className="mt-1.5 text-xs text-ink-dim">
              Printed on your bills, as food-safety rules require.
            </p>
            {err("fssaiLicense")}
          </div>
          <div>
            <label className={label} htmlFor="gstin">
              GSTIN <span className="font-normal text-ink-dim">â€” optional</span>
            </label>
            <input id="gstin" className="input font-mono uppercase"
              value={values.gstin}
              onChange={(e) => set("gstin", e.target.value.toUpperCase())}
              placeholder="22AAAAA0000A1Z5" />
            <p className="mt-1.5 text-xs text-ink-dim">
              Needed if you want GST invoices from us, or GST on your own bills.
            </p>
            {err("gstin")}
          </div>
        </fieldset>
      )}

      {step === 4 && (
        <fieldset className="space-y-4 border-0 p-0">
          <legend className="sr-only">Consent</legend>
          <p className="text-sm text-ink-soft">
            Please read these. The first three are required; the last two are
            genuinely up to you and you can change them any time.
          </p>

          <Consent
            id="consentTerms" required checked={values.consentTerms}
            onChange={(v) => set("consentTerms", v)} error={errors.consentTerms}>
            I&rsquo;ve read and accept the{" "}
            <Link href="/legal/terms" target="_blank" className="text-amber-deep">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/legal/acceptable-use" target="_blank" className="text-amber-deep">Acceptable Use Policy</Link>.
          </Consent>

          <Consent
            id="consentDataProcessing" required checked={values.consentDataProcessing}
            onChange={(v) => set("consentDataProcessing", v)} error={errors.consentDataProcessing}>
            I consent to my restaurant&rsquo;s data being processed as set out in
            the{" "}
            <Link href="/legal/privacy" target="_blank" className="text-amber-deep">Privacy Policy</Link>{" "}
            and{" "}
            <Link href="/legal/dpa" target="_blank" className="text-amber-deep">Data Processing Addendum</Link>.
          </Consent>

          <Consent
            id="consentPayment" required checked={values.consentPayment}
            onChange={(v) => set("consentPayment", v)} error={errors.consentPayment}>
            I understand my account is activated only after payment is
            confirmed, and I accept the{" "}
            <Link href="/legal/refund" target="_blank" className="text-amber-deep">Refund &amp; Cancellation policy</Link>.
          </Consent>

          <hr className="!my-6 border-rule" />

          <Consent id="consentWhatsapp" checked={values.consentWhatsapp}
            onChange={(v) => set("consentWhatsapp", v)}>
            You can contact me on WhatsApp about my account and support.
          </Consent>

          <Consent id="consentMarketing" checked={values.consentMarketing}
            onChange={(v) => set("consentMarketing", v)}>
            Send me occasional product updates. No third-party marketing.
          </Consent>
        </fieldset>
      )}

      {formError && (
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {formError}
        </p>
      )}

      <div className="mt-9 flex items-center gap-3">
        {step > 1 && (
          <button type="button" className="btn btn-secondary"
            onClick={() => { setStep((s) => s - 1); setFormError(null); }}>
            Back
          </button>
        )}
        {step < 4 ? (
          <button type="button" className="btn btn-primary" onClick={next}>
            Continue
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Sendingâ€¦" : "Submit registration"}
          </button>
        )}
      </div>
    </form>
  );
}

function Consent({
  id, checked, onChange, children, required, error,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer gap-3 rounded-xl border border-rule p-4 transition-colors hover:border-ink-dim">
        <input id={id} type="checkbox" checked={checked} required={required}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-amber-deep" />
        <span className="text-sm leading-relaxed text-ink-soft">
          {children}
          {required && <span className="ml-1 text-red-700" aria-label="required">*</span>}
        </span>
      </label>
      {error && <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
