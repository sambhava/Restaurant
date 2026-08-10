/**
 * Read-only diagnostic. Answers three questions before we change anything:
 *
 *   1. How many legacy accounts exist? (= how many people get locked out)
 *   2. Does the rest-2 tenant hold real data or test data?
 *   3. Is anything actively in service right now?
 *
 * It connects with the PUBLIC web config and no credentials, which works only
 * because the current rules allow anonymous reads. That is itself the finding.
 *
 * Prints counts and emails. Never prints passwords.
 *
 *   cd sit-n-order-web && node scripts/check-state.mjs
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

const here = path.dirname(fileURLToPath(import.meta.url));

function loadDashboardConfig() {
  const envPath = path.join(here, "..", "..", "restaurant-dashboard", ".env");
  const raw = readFileSync(envPath, "utf8");
  const get = (key) => {
    const m = raw.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : undefined;
  };
  return {
    apiKey: get("VITE_FIREBASE_API_KEY"),
    authDomain: get("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: get("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: get("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: get("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: get("VITE_FIREBASE_APP_ID"),
  };
}

const config = loadDashboardConfig();
const db = getFirestore(initializeApp(config));

const line = (s = "") => console.log(s);

async function count(ref, label) {
  try {
    const snap = await getDocs(ref);
    return { label, n: snap.size, docs: snap.docs };
  } catch (err) {
    return { label, n: null, error: err.code ?? String(err) };
  }
}

async function main() {
  line();
  line(`Project: ${config.projectId}`);
  line("Connecting with NO credentials, as an anonymous internet visitor.");
  line("=".repeat(66));
  line();

  // 1. Can an anonymous visitor read the password collection?
  const auth = await count(collection(db, "users_auth"), "users_auth");
  if (auth.error) {
    line(`users_auth        : unreadable (${auth.error})`);
    line("                    -> rules may already be locked down. Good.");
  } else {
    line(`users_auth        : ${auth.n} document(s)  <-- READABLE WITHOUT LOGIN`);
    auth.docs.forEach((d) => {
      const data = d.data();
      const hasPassword = typeof data.password === "string" && data.password.length > 0;
      line(`                    - ${data.email ?? d.id}${hasPassword ? "  [password stored in plain text]" : ""}`);
    });
  }
  line();

  // 2. What is in the legacy tenant?
  const restRef = doc(db, "restaurants", "rest-2");
  try {
    const rest = await getDoc(restRef);
    line(`rest-2 tenant     : ${rest.exists() ? `exists, name = "${rest.data().name ?? "(unnamed)"}"` : "does not exist"}`);
  } catch (err) {
    line(`rest-2 tenant     : unreadable (${err.code ?? err})`);
  }

  const menu = await count(collection(db, "restaurants", "rest-2", "menuItems"), "menuItems");
  const orders = await count(collection(db, "restaurants", "rest-2", "orders"), "orders");
  const sessions = await count(collection(db, "restaurants", "rest-2", "sessions"), "sessions");

  line(`  menu items      : ${menu.n ?? `unreadable (${menu.error})`}`);
  line(`  orders          : ${orders.n ?? `unreadable (${orders.error})`}`);
  line(`  sessions        : ${sessions.n ?? `unreadable (${sessions.error})`}`);
  line();

  // 3. Is anything live right now? An open session means someone is mid-meal.
  if (sessions.docs) {
    const active = sessions.docs.filter((d) => d.data().status === "active");
    line(`  ACTIVE sessions : ${active.length}`);
    if (active.length > 0) {
      line("                    ^ tables are open RIGHT NOW - do not deploy mid-service");
      active.forEach((d) => line(`                    - table ${d.data().tableNumber}, ₹${d.data().total ?? 0}`));
    }
  }
  line();

  // 4. Has anyone already been migrated?
  const users = await count(collection(db, "users"), "users");
  line(`users collection  : ${users.n ?? `unreadable (${users.error})`} document(s)`);
  if (users.docs) {
    users.docs.forEach((d) => {
      const v = d.data();
      line(`                    - ${v.email ?? d.id} -> ${v.restaurantId ?? "(no tenant)"} [${v.status ?? "no status"}]`);
    });
  }

  // 5. Any other tenants?
  const all = await count(collection(db, "restaurants"), "restaurants");
  if (all.docs) {
    line();
    line(`restaurants       : ${all.n} tenant(s)`);
    all.docs.forEach((d) => line(`                    - ${d.id}  "${d.data().name ?? ""}"`));
  }

  line();
  line("=".repeat(66));
  line();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nDiagnostic failed:", err);
    process.exit(1);
  });
