import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-side Firebase, for the signup route and the activation script.
 *
 * The service-account key never reaches the browser: this module is imported
 * only from server code, and reading it at call time rather than at module load
 * keeps `next build` working on a machine without the secret present.
 */

let cached: App | null = null;

function adminApp(): App {
  if (cached) return cached;

  const existing = getApps();
  if (existing.length > 0) {
    cached = existing[0];
    return cached;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(
      "Firebase admin is not configured. Set FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY — see .env.example.",
    );
  }

  cached = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // Env vars store the key with literal \n sequences; restore real newlines.
      privateKey: rawKey.replace(/\\n/g, "\n"),
    }),
  });

  return cached;
}

export function adminDb() {
  return getFirestore(adminApp());
}
