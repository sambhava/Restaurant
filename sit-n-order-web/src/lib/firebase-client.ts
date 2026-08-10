"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Browser Firebase, shared with the dashboard app.
 *
 * These NEXT_PUBLIC_ values are meant to be visible in the client bundle —
 * a Firebase web config is an identifier, not a secret. What actually protects
 * the data is firestore.rules at the repo root.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;

function firebaseApp(): FirebaseApp {
  if (app) return app;
  if (!config.apiKey || !config.projectId) {
    throw new Error(
      "Firebase is not configured. Copy .env.example to .env.local and fill in " +
        "the NEXT_PUBLIC_FIREBASE_* values.",
    );
  }
  app = getApps()[0] ?? initializeApp(config);
  return app;
}

export function clientAuth(): Auth {
  return getAuth(firebaseApp());
}

export function clientDb(): Firestore {
  return getFirestore(firebaseApp());
}
