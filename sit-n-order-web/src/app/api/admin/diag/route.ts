import { NextResponse } from "next/server";
import { checkAdminToken } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Temporary diagnostic. Loads each dependency of the admin route one at a time
 * and reports which one fails, so a module-load crash shows up as readable JSON
 * instead of a zero-length 500.
 *
 * Delete once the admin route is confirmed working.
 */
export async function GET(request: Request) {
  const refusal = checkAdminToken(request);
  if (refusal) return NextResponse.json({ error: refusal }, { status: 401 });

  const steps: Record<string, string> = {};

  steps.env_ADMIN_TOKEN = process.env.ADMIN_TOKEN ? "set" : "MISSING";
  steps.env_FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ? "set" : "MISSING";
  steps.env_FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ? "set" : "MISSING";
  steps.env_FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY
    ? `set (${process.env.FIREBASE_PRIVATE_KEY.length} chars, newlines: ${
        process.env.FIREBASE_PRIVATE_KEY.includes("\\n") ? "escaped" : "real"
      })`
    : "MISSING";

  try {
    await import("@/lib/admin-auth");
    steps.import_admin_auth = "ok";
  } catch (e) {
    steps.import_admin_auth = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    await import("@/lib/firebase-admin");
    steps.import_firebase_admin = "ok";
  } catch (e) {
    steps.import_firebase_admin = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    await import("@/lib/email");
    steps.import_email = "ok";
  } catch (e) {
    steps.import_email = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    await import("@/lib/activation");
    steps.import_activation = "ok";
  } catch (e) {
    steps.import_activation = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Actually talk to Firestore, which is what the real route does.
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const snap = await adminDb().collection("signups").limit(1).get();
    steps.firestore_query = `ok (${snap.size} doc(s))`;
  } catch (e) {
    steps.firestore_query = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(steps);
}
