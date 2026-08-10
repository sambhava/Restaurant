/**
 * Verifies that an activated tenant is genuinely isolated, and cleans up test
 * data afterwards.
 *
 *   node scripts/verify-tenant.mjs <restaurantId> <uid>          # check only
 *   node scripts/verify-tenant.mjs <restaurantId> <uid> --purge  # check + delete
 *
 * --purge removes the test tenant, its users/ doc, its Firebase Auth user, and
 * any signups matching that email. It refuses to touch rest-2.
 */

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const [restaurantId, uid] = process.argv.slice(2);
const PURGE = process.argv.includes("--purge");

if (!restaurantId || !uid) {
  console.error("Usage: node scripts/verify-tenant.mjs <restaurantId> <uid> [--purge]");
  process.exit(1);
}

// Guard: never let this script delete the real tenant.
if (PURGE && (restaurantId === "rest-2" || restaurantId === "rest_test123")) {
  console.error(`Refusing to purge ${restaurantId} — that is not a test tenant.`);
  process.exit(1);
}

const raw = readFileSync(".env.local", "utf8");
const env = (key) => {
  const m = raw.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
};

initializeApp({
  credential: cert({
    projectId: env("FIREBASE_PROJECT_ID"),
    clientEmail: env("FIREBASE_CLIENT_EMAIL"),
    privateKey: env("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const auth = getAuth();

console.log();
console.log(`Tenant: ${restaurantId}`);
console.log("=".repeat(60));

const userDoc = await db.collection("users").doc(uid).get();
const u = userDoc.data();
console.log();
console.log("users/ document:");
console.log(`  restaurantId : ${u?.restaurantId}`);
console.log(`  status       : ${u?.status}`);
console.log(`  role         : ${u?.role}`);
console.log(`  points at correct tenant: ${u?.restaurantId === restaurantId}`);

const menu = await db.collection("restaurants").doc(restaurantId).collection("menuItems").get();
const orders = await db.collection("restaurants").doc(restaurantId).collection("orders").get();

console.log();
console.log("Isolation — a new tenant must start empty:");
console.log(`  menu items : ${menu.size}`);
console.log(`  orders     : ${orders.size}`);
console.log(`  ISOLATED   : ${menu.size === 0 && orders.size === 0}`);

const mine = await db.collection("restaurants").doc("rest-2").collection("menuItems").get();
const myOrders = await db.collection("restaurants").doc("rest-2").collection("orders").get();
console.log();
console.log("Your own data, unaffected:");
console.log(`  rest-2 menu items : ${mine.size}`);
console.log(`  rest-2 orders     : ${myOrders.size}`);

if (!PURGE) {
  console.log();
  console.log("Run again with --purge to delete this test tenant.");
  console.log();
  process.exit(0);
}

// ── Cleanup ───────────────────────────────────────────────────────────────
console.log();
console.log("Purging test data...");

const email = u?.email;

await db.collection("restaurants").doc(restaurantId).delete();
console.log(`  deleted restaurants/${restaurantId}`);

await db.collection("users").doc(uid).delete();
console.log(`  deleted users/${uid}`);

try {
  await auth.deleteUser(uid);
  console.log(`  deleted auth user ${uid}`);
} catch (err) {
  console.log(`  auth user not deleted: ${err.code ?? err}`);
}

if (email) {
  const signups = await db.collection("signups").where("email", "==", email).get();
  for (const d of signups.docs) {
    await d.ref.delete();
    console.log(`  deleted signups/${d.id}`);
  }
}

console.log();
console.log("Test data removed.");
console.log();
