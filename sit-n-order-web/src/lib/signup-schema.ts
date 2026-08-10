import { z } from "zod";

/**
 * Signup validation, shared by the browser form and the server route.
 *
 * The server re-parses whatever arrives regardless of what the client did —
 * client-side validation is a courtesy to the person filling the form, never a
 * security boundary.
 */

/** Accepts 9876543210, +91 98765 43210, 098765-43210. */
const phoneRegex = /^(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;

/** 15 characters: 2 state + 10 PAN + 1 entity + 1 Z + 1 checksum. */
const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/i;

/** FSSAI licence numbers are exactly 14 digits. */
const fssaiRegex = /^\d{14}$/;

const optionalText = (schema: z.ZodString) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional()
    .pipe(schema.optional());

export const signupSchema = z.object({
  // Step 1 — the business
  businessName: z
    .string()
    .trim()
    .min(2, "Enter your restaurant's name")
    .max(200, "That name is too long"),
  ownerName: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(120, "That name is too long"),
  city: z.string().trim().min(2, "Enter your city").max(80),
  state: z.string().trim().min(2, "Select your state").max(80),
  outletCount: z.coerce
    .number()
    .int()
    .min(1, "At least one outlet")
    .max(200, "Get in touch directly for more than 200 outlets"),
  tableCount: z.coerce
    .number()
    .int()
    .min(1, "At least one table")
    .max(500, "Get in touch directly for more than 500 tables"),

  // Step 2 — reaching you
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid Indian mobile number"),
  preferredLanguage: z.enum(["english", "hindi", "other"]),

  // Step 3 — compliance, both genuinely optional
  fssaiLicense: optionalText(
    z.string().regex(fssaiRegex, "An FSSAI licence number is 14 digits"),
  ),
  gstin: optionalText(
    z.string().regex(gstinRegex, "That doesn't look like a valid GSTIN"),
  ),

  // Step 4 — consent. Each is recorded independently with its own timestamp.
  // The three required ones must be literally true: z.literal(true) rejects
  // false rather than coercing it.
  consentTerms: z.literal(true, {
    error: "You'll need to accept these to continue",
  }),
  consentDataProcessing: z.literal(true, {
    error: "You'll need to accept this to continue",
  }),
  consentPayment: z.literal(true, {
    error: "You'll need to accept this to continue",
  }),
  // Genuinely optional — defaulting these to true would make the consent
  // meaningless and would not satisfy the DPDP Act.
  consentMarketing: z.boolean().default(false),
  consentWhatsapp: z.boolean().default(false),
});

export type SignupInput = z.input<typeof signupSchema>;
export type SignupData = z.output<typeof signupSchema>;

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
] as const;
