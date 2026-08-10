/**
 * Every business-specific value on the site lives here.
 *
 * Anything marked TODO must be replaced before launch — the same list appears
 * in LEGAL-CHECKLIST.md at the repo root. Placeholders are written in a form
 * that is obviously unfinished on the page rather than quietly wrong.
 */

export const SITE = {
  name: "Sit-N-Order",
  tagline: "Orders that start at the table.",

  // TODO: replace with your real domain once registered.
  url: "https://sitnorder.in",

  // TODO: replace with your real contact details.
  email: "hello@sitnorder.in",
  supportEmail: "support@sitnorder.in",
  phone: "+91 00000 00000",
  whatsapp: "+91 00000 00000",

  /**
   * Legal identity. Written for a sole proprietorship — see LEGAL-CHECKLIST.md
   * for what changes if you incorporate later.
   */
  legal: {
    // TODO: your full legal name, e.g. "Sambhav Sharma, trading as Sit-N-Order".
    entityName: "[YOUR FULL LEGAL NAME], sole proprietor, trading as Sit-N-Order",
    entityType: "Sole Proprietorship",
    // TODO: full registered address.
    address: "[YOUR REGISTERED BUSINESS ADDRESS]",
    // TODO: the city whose courts will have jurisdiction.
    jurisdictionCity: "[YOUR CITY]",
    jurisdictionState: "[YOUR STATE]",
    // TODO: leave null until you register for GST. Setting this switches on
    // the GST clauses in the Terms and shows GST on the pricing receipt.
    gstin: null as string | null,
    // DPDP Act 2023 requires a named contact for data grievances.
    grievanceOfficer: {
      name: "[YOUR NAME]",
      email: "privacy@sitnorder.in",
    },
    lastUpdated: "10 August 2026",
  },

  /**
   * One flat plan, everything included. Amount is in whole rupees per outlet
   * per month.
   */
  plan: {
    name: "Full access",
    // TODO: confirm your price. This figure appears on /pricing and in the
    // Terms — the two must not disagree.
    priceMonthly: 1499,
    currency: "₹",
    unit: "per outlet, per month",
    gstRatePercent: 18,
    trialDays: 14,
  },

  support: {
    channels: "Email and WhatsApp",
    responseTarget: "Same working day",
    hours: "Monday to Saturday, 9am – 9pm IST",
    uptimeGoal: "99%",
  },

  /** Where the dashboard is deployed — the login page hands off here. */
  // TODO: point at your deployed dashboard URL.
  dashboardUrl: "https://dashboard.sitnorder.in",
} as const;

export const LEGAL_PAGES = [
  { slug: "terms", title: "Terms of Service" },
  { slug: "privacy", title: "Privacy Policy" },
  { slug: "refund", title: "Refund & Cancellation" },
  { slug: "cookies", title: "Cookie Policy" },
  { slug: "sla", title: "Service Level Commitment" },
  { slug: "dpa", title: "Data Processing Addendum" },
  { slug: "acceptable-use", title: "Acceptable Use" },
] as const;

/** ₹1,499 — Indian digit grouping. */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
