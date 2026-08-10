"use client";

import { useState } from "react";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { clientAuth, clientDb } from "@/lib/firebase-client";
import { SITE } from "@/lib/site";

type View = "signin" | "forgot" | "pending";

/** Firebase codes are for logs; people need to know what to do next. */
function readableError(code: string): string {
  if (code.includes("too-many-requests"))
    return "Too many attempts. Wait a few minutes, or reset your password.";
  if (code.includes("network-request-failed"))
    return "Couldn't reach the server. Check your connection and try again.";
  if (code.includes("user-disabled"))
    return "This account has been disabled. Get in touch and we'll sort it out.";
  if (
    code.includes("invalid-credential") ||
    code.includes("user-not-found") ||
    code.includes("wrong-password") ||
    code.includes("invalid-email")
  )
    return "Incorrect email or password.";
  return "Couldn't sign you in. Please try again.";
}

export function LoginForm() {
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const auth = clientAuth();
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );

      // Authenticated — but access depends on activation having provisioned a
      // workspace. Check before handing off to the dashboard, so nobody lands
      // on a broken screen.
      const profile = await getDoc(doc(clientDb(), "users", cred.user.uid));
      const data = profile.data();

      if (!profile.exists() || !data?.restaurantId || data?.status !== "active") {
        await signOut(auth);
        setView("pending");
        return;
      }

      window.location.href = SITE.dashboardUrl;
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(readableError(code));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendPasswordResetEmail(clientAuth(), email.trim().toLowerCase());
    } catch {
      // Deliberately swallowed — see the message below.
    }
    // Identical response either way, so this page can't be used to discover
    // which email addresses have accounts.
    setNotice(
      `If an account exists for ${email}, a reset link is on its way. Check your inbox and spam folder.`,
    );
    setBusy(false);
  }

  if (view === "pending") {
    return (
      <div>
        <h2 className="t-card text-xl">Your account isn&rsquo;t active yet</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Those details are right, but we haven&rsquo;t activated this account.
          That usually means we&rsquo;re still waiting on payment, or it landed
          very recently.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Once it clears we&rsquo;ll email your login — normally the same
          working day. If you think this is wrong, get in touch and we&rsquo;ll
          check.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/contact" className="btn btn-primary">
            Contact us
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setView("signin");
              setPassword("");
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (view === "forgot") {
    return (
      <form onSubmit={resetPassword} noValidate>
        <h2 className="t-card text-xl">Reset your password</h2>
        <p className="mt-2 text-sm text-ink-soft">
          We&rsquo;ll email you a link to set a new one.
        </p>

        {notice && (
          <p role="status" className="mt-5 rounded-xl border border-rule bg-paper-2 px-4 py-3 text-sm text-ink-soft">
            {notice}
          </p>
        )}

        <div className="mt-6">
          <label className="field-label" htmlFor="reset-email">Email</label>
          <input
            id="reset-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </button>

        <button
          type="button"
          className="mt-4 w-full text-sm text-ink-soft hover:text-ink"
          onClick={() => {
            setView("signin");
            setNotice(null);
          }}
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={signIn} noValidate>
      <h2 className="t-card text-xl">Sign in</h2>
      <p className="mt-2 text-sm text-ink-soft">
        For restaurants already set up with {SITE.name}.
      </p>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-6">
        <label className="field-label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="mt-4">
        <label className="field-label" htmlFor="password">Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className="input pr-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink-soft"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {showPassword ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </div>
        <button
          type="button"
          className="mt-2 block text-xs font-semibold text-amber-deep"
          onClick={() => {
            setView("forgot");
            setError(null);
          }}
        >
          Forgot password?
        </button>
      </div>

      <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Not set up yet?{" "}
        <Link href="/signup" className="text-amber-deep">
          Register your restaurant
        </Link>
      </p>
    </form>
  );
}
