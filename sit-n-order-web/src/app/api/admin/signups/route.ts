import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkAdminToken } from "@/lib/admin-auth";
import { activateSignup, rejectSignup } from "@/lib/activation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SignupRow = {
  id: string;
  status: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  outletCount: number;
  tableCount: number;
  fssaiLicense: string | null;
  gstin: string | null;
  consents: Record<string, { granted: boolean; at: string | null }>;
  submittedAt: string | null;
  restaurantId: string | null;
};

/** GET — list signups for the activation queue. */
export async function GET(request: Request) {
  // The whole handler is wrapped: a throw before the inner try (in the token
  // check, or while resolving imports) otherwise surfaces as a zero-length 500
  // with no body, which is very hard to diagnose from outside.
  try {
    const refusal = checkAdminToken(request);
    if (refusal) return NextResponse.json({ error: refusal }, { status: 401 });

    const status = new URL(request.url).searchParams.get("status") ?? "pending";

    const snap = await adminDb()
      .collection("signups")
      .where("status", "==", status)
      .limit(100)
      .get();

    const rows: SignupRow[] = snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        status: v.status,
        businessName: v.businessName,
        ownerName: v.ownerName,
        email: v.email,
        phone: v.phone,
        city: v.city,
        state: v.state,
        outletCount: v.outletCount,
        tableCount: v.tableCount,
        fssaiLicense: v.fssaiLicense ?? null,
        gstin: v.gstin ?? null,
        consents: v.consents ?? {},
        submittedAt: v.submittedAt?.toDate?.()?.toISOString() ?? null,
        restaurantId: v.restaurantId ?? null,
      };
    });

    // Sorted here rather than in the query: ordering by submittedAt alongside
    // the status filter needs a composite index, and this list is capped at 100.
    rows.sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

    return NextResponse.json({ signups: rows });
  } catch (err) {
    console.error("[admin] Could not list signups:", err);
    return NextResponse.json(
      { error: "Could not load signups." },
      { status: 500 },
    );
  }
}

/** POST — activate or reject one signup. */
export async function POST(request: Request) {
  const refusal = checkAdminToken(request);
  if (refusal) return NextResponse.json({ error: refusal }, { status: 401 });

  let body: { signupId?: string; action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { signupId, action, reason } = body;
  if (!signupId || !action) {
    return NextResponse.json(
      { error: "signupId and action are both required." },
      { status: 400 },
    );
  }

  try {
    if (action === "activate") {
      const result = await activateSignup(signupId);
      return NextResponse.json({
        ok: true,
        ...result,
        // Surfaced so the owner knows to pass credentials on by hand if the
        // email didn't go out.
        warning: result.emailSent
          ? null
          : "Account created, but the welcome email could not be sent. Send the login details manually.",
      });
    }

    if (action === "reject") {
      await rejectSignup(signupId, reason);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    console.error(`[admin] ${action} failed for ${signupId}:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
