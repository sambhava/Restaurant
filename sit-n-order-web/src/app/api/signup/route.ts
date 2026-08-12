import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { signupSchema } from "@/lib/signup-schema";
import { sendSignupAcknowledgement, sendOwnerNotification } from "@/lib/email";

export const runtime = "nodejs";

// In-memory token bucket rate limiting for /api/signup (per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_WINDOW = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  record.count += 1;
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

/**
 * POST /api/signup — record a registration as `pending`.
 *
 * This route deliberately does NOT create an auth account. Access is granted
 * only by activation, after payment has been confirmed by a human. See
 * /admin/activations.
 */
export async function POST(request: Request) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many signup requests. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Invalid content type. Expected application/json." },
      { status: 400 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn't read that submission. Please try again." },
      { status: 400 },
    );
  }

  // Re-validate everything server-side, whatever the client believed.
  const parsed = signupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Some details need fixing.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const now = new Date().toISOString();

  // Each consent is stored as its own record with its own timestamp — the DPDP
  // Act expects consent to be demonstrable per purpose, not as one lump.
  const consents = {
    terms: { granted: d.consentTerms, at: now },
    dataProcessing: { granted: d.consentDataProcessing, at: now },
    payment: { granted: d.consentPayment, at: now },
    marketing: { granted: d.consentMarketing, at: d.consentMarketing ? now : null },
    whatsapp: { granted: d.consentWhatsapp, at: d.consentWhatsapp ? now : null },
  };

  try {
    const db = adminDb();

    // One pending signup per email, so a double submit doesn't create two
    // accounts for the same restaurant.
    const existing = await db
      .collection("signups")
      .where("email", "==", d.email)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        {
          error:
            "We already have a registration for this email and it's being processed. Check your inbox, or get in touch if you haven't heard from us.",
        },
        { status: 409 },
      );
    }

    await db.collection("signups").add({
      status: "pending",
      businessName: d.businessName,
      ownerName: d.ownerName,
      email: d.email,
      phone: d.phone,
      city: d.city,
      state: d.state,
      outletCount: d.outletCount,
      tableCount: d.tableCount,
      fssaiLicense: d.fssaiLicense ?? null,
      gstin: d.gstin ?? null,
      preferredLanguage: d.preferredLanguage,
      consents,
      submittedAt: FieldValue.serverTimestamp(),
      activatedAt: null,
      restaurantId: null,
    });
  } catch (err) {
    console.error("[signup] Could not save submission:", err);
    return NextResponse.json(
      {
        error:
          "We couldn't save your details just now. Please try again, or email us directly.",
      },
      { status: 500 },
    );
  }

  // Email is best-effort — the submission is already safely recorded, so a
  // failed send must not turn into a failed signup.
  await Promise.allSettled([
    sendSignupAcknowledgement(d.email, d.businessName),
    sendOwnerNotification(d),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
