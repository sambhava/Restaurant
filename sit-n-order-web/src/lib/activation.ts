import { FieldValue } from "firebase-admin/firestore";
import { randomBytes, randomInt } from "node:crypto";
import { adminDb } from "./firebase-admin";
import { sendWelcomeEmail } from "./email";

/**
 * Turning a paid signup into a working account.
 *
 * This is the seam left for automation. Today a human calls it from
 * /admin/activations after confirming payment; later a Razorpay webhook can
 * call the same function with no other change. Keep it free of anything
 * request-specific.
 *
 * NOTE: `getAuth` from `firebase-admin/auth` is imported dynamically inside
 * `activateSignup()` rather than at the top of this file. `jwks-rsa`, a
 * transitive dependency of that subpath, calls `require()` on `jose`, which is
 * ESM-only — a static import crashes the whole module at load time in Vercel's
 * Node.js runtime, which surfaces as a zero-length 500 with no logs.
 */

/** Tenant ids are random, not sequential — nobody should be able to guess the
 *  next restaurant's id and go looking for it. */
function generateRestaurantId(): string {
  return `rest_${randomBytes(8).toString("hex")}`;
}

/** Readable temp password: no 0/O/1/l, since owners retype these from email. */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 14; i++) out += chars[randomInt(chars.length)];
  return out;
}

export type ActivationResult = {
  restaurantId: string;
  uid: string;
  email: string;
  emailSent: boolean;
};

export async function activateSignup(signupId: string): Promise<ActivationResult> {
  const db = adminDb();
  const { getAuth } = await import("firebase-admin/auth");
  const auth = getAuth();

  const ref = db.collection("signups").doc(signupId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("That signup no longer exists.");

  const signup = snap.data()!;
  if (signup.status === "activated") {
    throw new Error("This signup has already been activated.");
  }

  const email: string = signup.email;
  const restaurantId = generateRestaurantId();
  const tempPassword = generateTempPassword();

  // Reuse the auth user if one already exists for this email — re-running
  // activation after a partial failure must not throw on a duplicate.
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, { password: tempPassword });
  } catch {
    const created = await auth.createUser({
      email,
      password: tempPassword,
      displayName: signup.ownerName,
      emailVerified: false,
    });
    uid = created.uid;
  }

  // One batch: either the tenant exists completely or not at all. A half-built
  // account is worse than a failed activation, because it looks fine.
  const batch = db.batch();

  batch.set(db.collection("restaurants").doc(restaurantId), {
    name: signup.businessName,
    ownerId: uid,
    city: signup.city ?? null,
    state: signup.state ?? null,
    fssaiLicense: signup.fssaiLicense ?? null,
    gstin: signup.gstin ?? null,
    tableCount: signup.tableCount ?? 10,
    isOpen: true,
    subscriptionStatus: "active",
    createdAt: FieldValue.serverTimestamp(),
    subscriptionStartedAt: FieldValue.serverTimestamp(),
  });

  // The dashboard reads restaurantId and status from here on every load. This
  // document is what makes the account real.
  batch.set(db.collection("users").doc(uid), {
    email,
    restaurantId,
    restaurantName: signup.businessName,
    role: "owner",
    status: "active",
    subscriptionStatus: "active",
    createdAt: FieldValue.serverTimestamp(),
  });

  batch.update(ref, {
    status: "activated",
    subscriptionStatus: "active",
    activatedAt: FieldValue.serverTimestamp(),
    subscriptionStartedAt: FieldValue.serverTimestamp(),
    restaurantId,
    uid,
  });

  await batch.commit();

  // The account works whether or not this email lands; the owner can resend.
  const sent = await sendWelcomeEmail(email, signup.businessName, tempPassword);

  return { restaurantId, uid, email, emailSent: sent.ok };
}

export async function pauseSubscription(signupId: string, reason?: string) {
  const db = adminDb();
  const ref = db.collection("signups").doc(signupId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Signup record not found.");

  const signup = snap.data()!;
  const { restaurantId, uid } = signup;

  const batch = db.batch();

  batch.update(ref, {
    subscriptionStatus: "paused",
    pausedAt: FieldValue.serverTimestamp(),
    pauseReason: reason ?? "Admin paused",
  });

  if (restaurantId) {
    batch.update(db.collection("restaurants").doc(restaurantId), {
      isOpen: false,
      subscriptionStatus: "paused",
      pausedAt: FieldValue.serverTimestamp(),
    });
  }

  if (uid) {
    batch.update(db.collection("users").doc(uid), {
      status: "paused",
      subscriptionStatus: "paused",
      pausedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}

export async function resumeSubscription(signupId: string) {
  const db = adminDb();
  const ref = db.collection("signups").doc(signupId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Signup record not found.");

  const signup = snap.data()!;
  const { restaurantId, uid } = signup;

  const batch = db.batch();

  batch.update(ref, {
    subscriptionStatus: "active",
    resumedAt: FieldValue.serverTimestamp(),
    pauseReason: null,
  });

  if (restaurantId) {
    batch.update(db.collection("restaurants").doc(restaurantId), {
      isOpen: true,
      subscriptionStatus: "active",
      resumedAt: FieldValue.serverTimestamp(),
    });
  }

  if (uid) {
    batch.update(db.collection("users").doc(uid), {
      status: "active",
      subscriptionStatus: "active",
      resumedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}

export async function endSubscription(signupId: string, reason?: string) {
  const db = adminDb();
  const ref = db.collection("signups").doc(signupId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Signup record not found.");

  const signup = snap.data()!;
  const { restaurantId, uid } = signup;

  const batch = db.batch();

  batch.update(ref, {
    subscriptionStatus: "cancelled",
    cancelledAt: FieldValue.serverTimestamp(),
    cancellationReason: reason ?? "Subscription terminated by admin",
  });

  if (restaurantId) {
    batch.update(db.collection("restaurants").doc(restaurantId), {
      isOpen: false,
      subscriptionStatus: "cancelled",
      cancelledAt: FieldValue.serverTimestamp(),
    });
  }

  if (uid) {
    batch.update(db.collection("users").doc(uid), {
      status: "cancelled",
      subscriptionStatus: "cancelled",
      cancelledAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}

export async function resendCredentials(signupId: string): Promise<{ email: string; emailSent: boolean }> {
  const db = adminDb();
  const { getAuth } = await import("firebase-admin/auth");
  const auth = getAuth();

  const ref = db.collection("signups").doc(signupId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Signup record not found.");

  const signup = snap.data()!;
  const email: string = signup.email;
  const tempPassword = generateTempPassword();

  if (signup.uid) {
    await auth.updateUser(signup.uid, { password: tempPassword });
  } else {
    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password: tempPassword });
  }

  const sent = await sendWelcomeEmail(email, signup.businessName, tempPassword);
  return { email, emailSent: sent.ok };
}

export async function rejectSignup(signupId: string, reason?: string) {
  await adminDb().collection("signups").doc(signupId).update({
    status: "rejected",
    rejectedAt: FieldValue.serverTimestamp(),
    rejectionReason: reason ?? null,
  });
}

