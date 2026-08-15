import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkAdminToken } from "@/lib/admin-auth";
import {
  activateSignup,
  rejectSignup,
  pauseSubscription,
  resumeSubscription,
  endSubscription,
  resendCredentials,
} from "@/lib/activation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SignupRow = {
  id: string;
  status: string;
  subscriptionStatus?: string;
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
  activatedAt: string | null;
  pausedAt: string | null;
  cancelledAt: string | null;
  pauseReason: string | null;
  cancellationReason: string | null;
  restaurantId: string | null;
  uid: string | null;
};

/** GET — list signups with full subscription metrics. */
export async function GET(request: Request) {
  try {
    const refusal = checkAdminToken(request);
    if (refusal) return NextResponse.json({ error: refusal }, { status: 401 });

    const url = new URL(request.url);
    const filterTab = url.searchParams.get("status") ?? "all";

    // Fetch all signups up to 250 records to compute dashboard stats & filter
    const snap = await adminDb().collection("signups").limit(250).get();

    let totalSignups = 0;
    let pendingCount = 0;
    let activeCount = 0;
    let pausedCount = 0;
    let cancelledCount = 0;
    let rejectedCount = 0;
    let totalOutlets = 0;
    let totalTables = 0;

    const allRows: SignupRow[] = snap.docs.map((d) => {
      const v = d.data();
      const signupStatus = v.status ?? "pending";
      const subStatus = v.subscriptionStatus ?? (signupStatus === "activated" ? "active" : "pending");

      totalSignups++;
      if (signupStatus === "pending") pendingCount++;
      else if (signupStatus === "rejected") rejectedCount++;
      else if (subStatus === "paused") pausedCount++;
      else if (subStatus === "cancelled") cancelledCount++;
      else if (signupStatus === "activated" && subStatus === "active") {
        activeCount++;
        totalOutlets += Number(v.outletCount) || 1;
        totalTables += Number(v.tableCount) || 10;
      }

      return {
        id: d.id,
        status: signupStatus,
        subscriptionStatus: subStatus,
        businessName: v.businessName ?? "Unnamed Restaurant",
        ownerName: v.ownerName ?? "Unknown Owner",
        email: v.email ?? "",
        phone: v.phone ?? "",
        city: v.city ?? "",
        state: v.state ?? "",
        outletCount: Number(v.outletCount) || 1,
        tableCount: Number(v.tableCount) || 10,
        fssaiLicense: v.fssaiLicense ?? null,
        gstin: v.gstin ?? null,
        consents: v.consents ?? {},
        submittedAt: v.submittedAt?.toDate?.()?.toISOString() ?? null,
        activatedAt: v.activatedAt?.toDate?.()?.toISOString() ?? null,
        pausedAt: v.pausedAt?.toDate?.()?.toISOString() ?? null,
        cancelledAt: v.cancelledAt?.toDate?.()?.toISOString() ?? null,
        pauseReason: v.pauseReason ?? null,
        cancellationReason: v.cancellationReason ?? null,
        restaurantId: v.restaurantId ?? null,
        uid: v.uid ?? null,
      };
    });

    // Sort by newest submission first
    allRows.sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

    // Filter based on selected tab
    const filteredRows = allRows.filter((row) => {
      if (filterTab === "all") return true;
      if (filterTab === "pending") return row.status === "pending";
      if (filterTab === "active") return row.status === "activated" && row.subscriptionStatus === "active";
      if (filterTab === "paused") return row.subscriptionStatus === "paused";
      if (filterTab === "cancelled") return row.subscriptionStatus === "cancelled";
      if (filterTab === "rejected") return row.status === "rejected";
      return true;
    });

    const metrics = {
      totalSignups,
      pendingCount,
      activeCount,
      pausedCount,
      cancelledCount,
      rejectedCount,
      totalOutlets,
      totalTables,
      estimatedMRR: activeCount * 999 * Math.max(1, Math.round(totalOutlets / (activeCount || 1))),
    };

    return NextResponse.json({ signups: filteredRows, metrics });
  } catch (err) {
    console.error("[admin] Could not list signups:", err);
    return NextResponse.json(
      { error: "Could not load signups." },
      { status: 500 },
    );
  }
}

/** POST — activate, pause, resume, end subscription, resend credentials, or reject. */
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
        warning: result.emailSent
          ? null
          : "Account created, but the welcome email could not be sent. Send the login details manually.",
      });
    }

    if (action === "pause_subscription") {
      await pauseSubscription(signupId, reason);
      return NextResponse.json({ ok: true, message: "Subscription paused." });
    }

    if (action === "resume_subscription") {
      await resumeSubscription(signupId);
      return NextResponse.json({ ok: true, message: "Subscription resumed." });
    }

    if (action === "end_subscription") {
      await endSubscription(signupId, reason);
      return NextResponse.json({ ok: true, message: "Subscription terminated." });
    }

    if (action === "resend_credentials") {
      const res = await resendCredentials(signupId);
      return NextResponse.json({
        ok: true,
        emailSent: res.emailSent,
        message: res.emailSent
          ? `Fresh credentials sent to ${res.email}.`
          : `Credentials reset, but email failed to send to ${res.email}.`,
      });
    }

    if (action === "reject") {
      await rejectSignup(signupId, reason);
      return NextResponse.json({ ok: true, message: "Signup rejected." });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    console.error(`[admin] ${action} failed for ${signupId}:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

