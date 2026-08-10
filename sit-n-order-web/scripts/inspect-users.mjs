/**
 * Read-only. Prints the full users documents including their UIDs, so we can
 * tell the real Firebase Auth uid apart from the fallback ids the old login
 * flow invented (`user_email_at_domain_com`).
 *
 *   node scripts/inspect-users.mjs
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const here = path.dirname(fileURLToPath(import.meta.url));

function loadDashboardConfig() {
  const raw = readFileSync(
    path.join(here, "..", "..", "restaurant-dashboard", ".env"),
    "utf8",
  );
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

const db = getFirestore(initializeApp(loadDashboardConfig()));

const snap = await getDocs(collection(db, "users"));

console.log();
snap.docs.forEach((d) => {
  const v = d.data();
  // A real Firebase uid is 28 chars of mixed case. The old code fell back to
  // `user_<sanitised email>` when Firebase auth failed.
  const looksSynthetic = d.id.startsWith("user_");
  console.log(`uid: ${d.id}`);
  console.log(`  kind:          ${looksSynthetic ? "SYNTHETIC (old fallback, not a real login)" : "real Firebase Auth uid"}`);
  console.log(`  email:         ${v.email ?? "(none)"}`);
  console.log(`  restaurantId:  ${v.restaurantId ?? "(none)"}`);
  console.log(`  restaurantName:${v.restaurantName ?? "(none)"}`);
  console.log(`  role:          ${v.role ?? "(none)"}`);
  console.log(`  status:        ${v.status ?? "*** MISSING ***"}`);
  console.log();
});

process.exit(0);
