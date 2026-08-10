/**
 * Prepares the database for the new security rules, in the only order that
 * works: fix the user documents FIRST, while client writes are still open,
 * then deploy the rules.
 *
 * Deploying first would lock the owner out of their own dashboard — the new
 * rules require users/{uid}.status == 'active', and also forbid client writes
 * to users/, so there would be no way back in without a service-account key.
 *
 *   node scripts/prepare-for-rules.mjs --dry-run
 *   node scripts/prepare-for-rules.mjs
 *
 * What it does:
 *   1. Backs up users_auth to a local JSON file (passwords redacted).
 *   2. Adds status:'active' to every users/ doc with a real Firebase uid.
 *   3. Deletes synthetic users/ docs — `user_<email>` ids invented by the old
 *      login fallback, which no real login can ever match.
 */

import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const DRY_RUN = process.argv.includes("--dry-run");
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

console.log();
console.log(DRY_RUN ? "DRY RUN - nothing will be written" : "LIVE RUN - writing changes");
console.log("=".repeat(66));
console.log();

// --- 1. Back up users_auth before it becomes unreachable --------------------
const authSnap = await getDocs(collection(db, "users_auth"));
const backup = authSnap.docs.map((d) => {
  const v = d.data();
  return {
    id: d.id,
    email: v.email ?? null,
    // Deliberately not saved. The point is to stop storing these; the backup
    // records WHO had an account, not what their password was.
    password: "[REDACTED - reset via Forgot password?]",
    updatedAt: v.updatedAt?.toDate?.()?.toISOString() ?? null,
  };
});

const backupPath = path.join(here, "..", "..", "users_auth.backup.json");
if (!DRY_RUN) {
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf8");
  console.log(`Backed up ${backup.length} users_auth record(s) to users_auth.backup.json`);
} else {
  console.log(`Would back up ${backup.length} users_auth record(s)`);
}
backup.forEach((b) => console.log(`  - ${b.email ?? b.id}`));
console.log();

// --- 2 & 3. Fix real user docs, remove synthetic ones ----------------------
const usersSnap = await getDocs(collection(db, "users"));

for (const d of usersSnap.docs) {
  const v = d.data();
  const synthetic = d.id.startsWith("user_");

  if (synthetic) {
    console.log(`DELETE  ${d.id}`);
    console.log(`        synthetic id from the old login fallback - no real`);
    console.log(`        Firebase account can have this uid, so it is dead weight`);
    if (!DRY_RUN) await deleteDoc(doc(db, "users", d.id));
    console.log();
    continue;
  }

  if (v.status === "active") {
    console.log(`SKIP    ${d.id}  (${v.email}) - already active`);
    console.log();
    continue;
  }

  console.log(`UPDATE  ${d.id}`);
  console.log(`        ${v.email}  ->  tenant ${v.restaurantId}`);
  console.log(`        adding status:'active' so the new rules admit this account`);
  if (!DRY_RUN) {
    await updateDoc(doc(db, "users", d.id), { status: "active" });
  }
  console.log();
}

console.log("=".repeat(66));
if (DRY_RUN) {
  console.log("Dry run complete. Re-run without --dry-run to apply.");
} else {
  console.log("Done. The database is now ready for the new rules.");
  console.log("Next:  firebase deploy --only firestore:rules");
}
console.log();

process.exit(0);
