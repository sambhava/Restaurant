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

  // TODO: replace once a domain is registered. Until then the site is served
  // from its Cloudflare Pages address, which is a working public URL.
  url: "https://sit-n-order-web.pages.dev",

  email: "sambhavajain512@gmail.com",
  supportEmail: "sambhavajain512@gmail.com",
  phone: "+91 89496 84405",
  whatsapp: "+91 89496 84405",

  /**
   * Legal identity. Written for a sole proprietorship — see LEGAL-CHECKLIST.md
   * for what changes if you incorporate later.
   */
  legal: {
    entityName: "Sambhava Jain, sole proprietor, trading as Sit-N-Order",
    entityType: "Sole Proprietorship",
    address: "M19 Madhuban Colony, Tonk Phatak, Jaipur, Rajasthan 302015",
    jurisdictionCity: "Jaipur",
    jurisdictionState: "Rajasthan",
    // TODO: leave null until you register for GST. Setting this switches on
    // the GST clauses in the Terms and shows GST on the pricing receipt.
    gstin: null as string | null,
    // DPDP Act 2023 requires a named contact for data grievances.
    grievanceOfficer: {
      name: "Sambhava Jain",
      email: "sambhavajain512@gmail.com",
    },
    lastUpdated: "11 August 2026",
  },

  /**
   * One flat plan, everything included. Amount is in whole rupees per outlet
   * per month.
   */
  plan: {
    name: "Full access",
    priceMonthly: 999,
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
  dashboardUrl: "https://restaurant-dashboard-sno.pages.dev",
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
