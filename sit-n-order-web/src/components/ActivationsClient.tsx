"use client";

import { useCallback, useState } from "react";

/**
 * The activation queue.
 *
 * Flow: confirm the payment landed in your bank, then activate. Activation
 * creates the tenant, the auth user and emails the login. It cannot be undone
 * from here.
 *
 * The admin token is held in component state only — never localStorage — so
 * closing the tab ends the session.
 */

type Consent = { granted: boolean; at: string | null };

type Signup = {
  id: string;
  status: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  outletCount: number;
  tableCount: number;
  fssaiLicense: string | null;
  gstin: string | null;
  consents: Record<string, Consent>;
  submittedAt: string | null;
  restaurantId: string | null;
};

const TABS = ["pending", "activated", "rejected"] as const;
type Tab = (typeof TABS)[number];

export function ActivationsClient() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");
  const [rows, setRows] = useState<Signup[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<Signup | null>(null);

  const load = useCallback(
    async (status: Tab, withToken: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/signups?status=${status}`, {
          headers: { "x-admin-token": withToken },
        });
        const body = await res.json();
        if (!res.ok) {
          setError(body.error ?? "Could not load signups.");
          setAuthed(false);
          return;
        }
        setRows(body.signups);
        setAuthed(true);
      } catch {
        setError("Could not reach the server.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /* Fetching is driven by the events that should cause it — signing in, and
     clicking a tab — rather than by an effect watching state. An effect here
     would also re-fire on every keystroke in the token field. */
  function switchTab(next: Tab) {
    setTab(next);
    setFlash(null);
    if (authed && token) load(next, token);
  }
  async function act(signup: Signup, action: "activate" | "reject") {
    setBusyId(signup.id);
    setError(null);
    setFlash(null);
    setConfirming(null);
    try {
      const res = await fetch("/api/admin/signups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ signupId: signup.id, action }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "That didn't work.");
        return;
      }
      setFlash(
        action === "activate"
          ? body.warning ??
              `${signup.businessName} is live. Login details emailed to ${signup.email}.`
          : `${signup.businessName} marked as rejected.`,
      );
      await load(tab, token);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusyId(null);
    }
  }

  if (!authed) {
    return (
      <form
        className="mx-auto max-w-sm rounded-2xl border border-rule p-7"
        onSubmit={(e) => {
          e.preventDefault();
          load("pending", token);
        }}
      >
        <h1 className="t-card text-xl">Activations</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Enter the admin token to continue.
        </p>
        <div className="mt-5">
          <label className="field-label" htmlFor="token">Admin token</label>
          <input
            id="token"
            type="password"
            className="input font-mono"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            required
          />
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary mt-5 w-full" disabled={loading}>
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="t-card text-2xl">Activations</h1>
        <button
          type="button"
          className="btn btn-secondary !px-4 !py-2 text-sm"
          onClick={() => load(tab, token)}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mt-6 flex gap-1 border-b border-rule">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`-mb-px border-b-2 px-4 py-2.5 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] transition-colors ${
              tab === t
                ? "border-amber text-ink"
                : "border-transparent text-ink-dim hover:text-ink-soft"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {flash && (
        <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {flash}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {rows.length === 0 && !loading ? (
        <p className="mt-10 rounded-2xl border border-dashed border-rule px-6 py-12 text-center text-sm text-ink-dim">
          Nothing {tab} right now.
        </p>
      ) : (
        <ul className="mt-6 list-none space-y-4 p-0">
          {rows.map((s) => (
            <li key={s.id} className="rounded-2xl border border-rule p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="t-card">{s.businessName}</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {s.ownerName} · {s.city}, {s.state}
                  </p>
                </div>
                {s.submittedAt && (
                  <p className="font-mono text-xs text-ink-dim">
                    {new Date(s.submittedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Row label="Email" value={s.email} mono />
                <Row label="Phone" value={s.phone} mono />
                <Row label="Outlets" value={String(s.outletCount)} />
                <Row label="Tables" value={String(s.tableCount)} />
                <Row label="FSSAI" value={s.fssaiLicense ?? "—"} mono />
                <Row label="GSTIN" value={s.gstin ?? "—"} mono />
                {s.restaurantId && (
                  <Row label="Tenant" value={s.restaurantId} mono />
                )}
              </dl>

              <div className="mt-5 border-t border-rule pt-4">
                <p className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-dim">
                  Consents
                </p>
                <ul className="mt-2 flex flex-wrap gap-2 p-0">
                  {Object.entries(s.consents).map(([k, v]) => (
                    <li
                      key={k}
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        v.granted
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-rule bg-paper-2 text-ink-dim"
                      }`}
                      title={v.at ? new Date(v.at).toLocaleString("en-IN") : "Not given"}
                    >
                      {v.granted ? "✓" : "○"} {k}
                    </li>
                  ))}
                </ul>
              </div>

              {s.status === "pending" && (
                <div className="mt-6 flex flex-wrap gap-3 border-t border-rule pt-5">
                  <button
                    type="button"
                    className="btn btn-primary w-full sm:w-auto !py-2.5 text-sm"
                    disabled={busyId === s.id}
                    onClick={() => setConfirming(s)}
                  >
                    {busyId === s.id ? "Activating…" : "Payment confirmed — activate"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary w-full sm:w-auto !py-2.5 text-sm"
                    disabled={busyId === s.id}
                    onClick={() => act(s, "reject")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl bg-paper p-7">
            <h2 id="confirm-title" className="t-card text-xl">
              Activate {confirming.businessName}?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              This creates their workspace and emails{" "}
              <span className="font-mono break-all">{confirming.email}</span> a temporary
              password. Only do this once the payment is actually in your
              account — it can&rsquo;t be undone from here.
            </p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => setConfirming(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => act(confirming, "activate")}
              >
                Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2">
      <dt className="shrink-0 text-ink-dim">{label}:</dt>
      <dd className={`break-all ${mono ? "font-mono text-[0.8125rem]" : ""}`}>{value}</dd>
    </div>
  );
}
