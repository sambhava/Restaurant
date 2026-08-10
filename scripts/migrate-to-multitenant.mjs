/**
 * One-off migration: move the single hardcoded `rest-2` tenant onto the new
 * per-restaurant model, and provision existing logins so they can sign in.
 *
 * Run it twice: once with --dry-run to see the plan, once for real.
 *
 *   node scripts/migrate-to-multitenant.mjs --dry-run
 *   node scripts/migrate-to-multitenant.mjs
 *
 * Needs the service-account env vars from sit-n-order-web/.env.local:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *
 * What it does:
 *   1. Reads the legacy users_auth collection to find who had accounts.
 *   2. Creates (or reuses) a Firebase Auth user for each email.
 *   3. Creates a users/{uid} document with its own restaurantId.
 *   4. Leaves the existing rest-2 data alone by default. The FIRST account
 *      keeps rest-2 as its tenant id so its menu and orders still work;
 *      any others get fresh empty tenants.
 *
 * What it does NOT do:
 *   - Delete users_auth. Do that by hand in the console once logins work.
 *   - Copy data between tenants. If two different restaurants were sharing
 *     rest-2, their orders are genuinely intermingled and no script can
 *     reliably separate them - you would have to do that by inspection.
 */

import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const DRY_RUN = process.argv.includes("--dry-run");
const here = path.dirname(fileURLToPath(import.meta.url));

// Load env from sit-n-order-web/.env.local without adding a dotenv dependency.
function loadEnv() {
  const envPath = path.join(here, "..", "sit-n-order-web", ".env.local");
  let raw;
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    console.error(`Could not read ${envPath}`);
    console.error("Copy sit-n-order-web/.env.example to .env.local and fill it in first.");
    process.exit(1);
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}

loadEnv();

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error("Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.");
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const auth = getAuth();

const tempPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 14 }, () => chars[randomBytes(1)[0] % chars.length]).join("");
};

const newTenantId = () => `rest_${randomBytes(8).toString("hex")}`;

async function main() {
  console.log(`\n${DRY_RUN ? "DRY RUN - nothing will be written" : "LIVE RUN - writing changes"}`);
  console.log(`Project: ${FIREBASE_PROJECT_ID}\n`);

  // 1. Who had accounts under the old scheme?
  const legacy = await db.collection("users_auth").get();
  if (legacy.empty) {
    console.log("No users_auth documents found. Either already migrated, or there were");
    console.log("never any accounts. Check the Firebase console to confirm.\n");
    return;
  }

  const emails = legacy.docs.map((d) => d.data().email ?? d.id).filter(Boolean);
  console.log(`Found ${emails.length} legacy account(s):`);
  emails.forEach((e) => console.log(`  - ${e}`));
  console.log();

  // 2. Does the legacy rest-2 tenant have data worth preserving?
  const [menuSnap, orderSnap, restDoc] = await Promise.all([
    db.collection("restaurants").doc("rest-2").collection("menuItems").limit(1).get(),
    db.collection("restaurants").doc("rest-2").collection("orders").limit(1).get(),
    db.collection("restaurants").doc("rest-2").get(),
  ]);
  const legacyHasData = !menuSnap.empty || !orderSnap.empty;
  const legacyName = restDoc.exists ? (restDoc.data().name ?? "My Restaurant") : "My Restaurant";

  console.log(`Legacy rest-2 tenant: ${legacyHasData ? "HAS DATA" : "empty"} (name: "${legacyName}")`);
  if (legacyHasData && emails.length > 1) {
    console.log("\n  WARNING: more than one account existed, and rest-2 holds data.");
    console.log("  Only the first account below will inherit it. If these were genuinely");
    console.log("  different restaurants, their orders are intermingled and you will need");
    console.log("  to sort that out by hand.\n");
  }
  console.log();

  const credentials = [];

  for (const [i, email] of emails.entries()) {
    // First account inherits rest-2 so its existing menu and orders keep working.
    const restaurantId = i === 0 && legacyHasData ? "rest-2" : newTenantId();
    const restaurantName = i === 0 ? legacyName : "My Restaurant";
    const password = tempPassword();

    console.log(`${email}`);
    console.log(`  tenant:   ${restaurantId}${restaurantId === "rest-2" ? "  (inherits existing data)" : "  (fresh, empty)"}`);
    console.log(`  name:     ${restaurantName}`);

    if (DRY_RUN) {
      console.log(`  password: (would be generated)\n`);
      continue;
    }

    // Reuse the auth user if one exists; otherwise create it.
    let uid;
    try {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      await auth.updateUser(uid, { password });
      console.log(`  auth:     reused existing user, password reset`);
    } catch {
      const created = await auth.createUser({ email, password, emailVerified: false });
      uid = created.uid;
      console.log(`  auth:     created new user`);
    }

    const batch = db.batch();

    batch.set(
      db.collection("restaurants").doc(restaurantId),
      {
        name: restaurantName,
        ownerId: uid,
        tableCount: restDoc.exists ? (restDoc.data().tableCount ?? 10) : 10,
        isOpen: true,
        migratedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // This document is what makes the account real - the dashboard reads
    // restaurantId and status from it on every load.
    batch.set(
      db.collection("users").doc(uid),
      {
        email,
        restaurantId,
        restaurantName,
        role: "owner",
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await batch.commit();
    console.log(`  users/${uid} written`);
    console.log(`  PASSWORD: ${password}\n`);

    credentials.push({ email, password, restaurantId });
  }

  if (DRY_RUN) {
    console.log("Dry run complete. Re-run without --dry-run to apply.\n");
    return;
  }

  console.log("=".repeat(64));
  console.log("TEMPORARY PASSWORDS - send these to their owners, then delete this output");
  console.log("=".repeat(64));
  credentials.forEach((c) => console.log(`  ${c.email}  ->  ${c.password}`));
  console.log("=".repeat(64));
  console.log("\nNext:");
  console.log("  1. Send each owner their password over a private channel.");
  console.log("  2. Tell them to change it immediately via 'Forgot password?'.");
  console.log("  3. Confirm each can sign in and sees their own data.");
  console.log("  4. THEN delete the users_auth collection in the Firebase console.\n");
}

main().catch((err) => {
  console.error("\nMigration failed:", err);
  process.exit(1);
});
