/**
 * Diagnoses a login failure against the real Firebase project.
 *
 * Tests, in order:
 *   1. Is Email/Password sign-in even enabled on the project?
 *   2. Does a password reset actually dispatch for this address?
 *   3. If a password is supplied, does sign-in succeed, and does the
 *      users/{uid} document permit dashboard access?
 *
 * Nothing is written. Passwords are never printed.
 *
 *   node scripts/diagnose-login.mjs                    # checks 1 and 2
 *   node scripts/diagnose-login.mjs "your-password"    # all three
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const EMAIL = "sambhavajain512@gmail.com";
const password = process.argv[2] ?? null;

const raw = readFileSync(
  path.join(here, "..", "..", "restaurant-dashboard", ".env"),
  "utf8",
);
const apiKey = raw
  .match(/^\s*VITE_FIREBASE_API_KEY\s*=\s*(.*)$/m)?.[1]
  ?.trim()
  .replace(/^["']|["']$/g, "");

const api = async (method, body) => {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return { status: res.status, body: await res.json() };
};

console.log();
console.log(`Diagnosing login for ${EMAIL}`);
console.log("=".repeat(66));
console.log();

// --- 1. Is password reset even possible? ----------------------------------
console.log("[1] Requesting a password reset email...");
const reset = await api("sendOobCode", {
  requestType: "PASSWORD_RESET",
  email: EMAIL,
});

if (reset.status === 200) {
  console.log("    Firebase ACCEPTED the request and says it dispatched mail.");
  console.log("    -> If nothing arrives, the problem is delivery, not Firebase:");
  console.log("       check spam, and check the Authentication > Templates tab.");
} else {
  const code = reset.body?.error?.message ?? "unknown";
  console.log(`    REJECTED: ${code}`);
  if (code === "EMAIL_NOT_FOUND") {
    console.log("    -> No account with this email. It must be created.");
  } else if (code === "OPERATION_NOT_ALLOWED") {
    console.log("    -> Email/Password sign-in is DISABLED for this project.");
    console.log("       Enable it: Authentication > Sign-in method > Email/Password");
  } else if (code.startsWith("TOO_MANY_ATTEMPTS")) {
    console.log("    -> Rate limited by Firebase. Wait ~15 minutes.");
  }
}
console.log();

// --- 2. Try signing in, if a password was given ---------------------------
if (!password) {
  console.log("[2] No password supplied - skipping the sign-in test.");
  console.log("    Re-run as:  node scripts/diagnose-login.mjs \"your-password\"");
  console.log("    (the password is never printed or stored)");
  console.log();
  console.log("=".repeat(66));
  process.exit(0);
}

console.log("[2] Attempting sign-in with the supplied password...");
const signIn = await api("signInWithPassword", {
  email: EMAIL,
  password,
  returnSecureToken: true,
});

if (signIn.status !== 200) {
  const code = signIn.body?.error?.message ?? "unknown";
  console.log(`    FAILED: ${code}`);
  if (code === "INVALID_LOGIN_CREDENTIALS" || code === "INVALID_PASSWORD") {
    console.log("    -> This password is not the one Firebase holds.");
    console.log("       The reset either did not complete, or a different");
    console.log("       password was set. Reset again and follow the link fully.");
  } else if (code === "USER_DISABLED") {
    console.log("    -> The account is disabled in the Firebase console.");
  }
  console.log();
  console.log("=".repeat(66));
  process.exit(0);
}

const uid = signIn.body.localId;
console.log(`    SUCCESS - signed in. uid = ${uid}`);
console.log();

// --- 3. Would the dashboard let this account in? --------------------------
console.log("[3] Checking whether the dashboard would admit this account...");
const idToken = signIn.body.idToken;
const projectId = raw
  .match(/^\s*VITE_FIREBASE_PROJECT_ID\s*=\s*(.*)$/m)?.[1]
  ?.trim()
  .replace(/^["']|["']$/g, "");

const docRes = await fetch(
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
  { headers: { Authorization: `Bearer ${idToken}` } },
);

if (docRes.status !== 200) {
  console.log(`    Could not read users/${uid} (HTTP ${docRes.status})`);
  console.log("    -> Security rules are blocking it, or the document is missing.");
  console.log("       Without this document the dashboard shows 'not active yet'.");
} else {
  const fields = (await docRes.json()).fields ?? {};
  const val = (k) =>
    fields[k]?.stringValue ?? fields[k]?.integerValue ?? "(missing)";
  console.log(`    users/${uid} is readable:`);
  console.log(`      email:          ${val("email")}`);
  console.log(`      restaurantId:   ${val("restaurantId")}`);
  console.log(`      restaurantName: ${val("restaurantName")}`);
  console.log(`      status:         ${val("status")}`);
  console.log();
  const ok = val("status") === "active" && val("restaurantId") !== "(missing)";
  console.log(
    ok
      ? "    VERDICT: this account should reach the dashboard normally."
      : "    VERDICT: the dashboard would REFUSE this account (needs status:'active' + a restaurantId).",
  );
}

console.log();
console.log("=".repeat(66));
console.log();
