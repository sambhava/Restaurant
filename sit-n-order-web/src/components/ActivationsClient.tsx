"use client";

import { useCallback, useMemo, useState } from "react";
import { formatINR } from "@/lib/site";

type Consent = { granted: boolean; at: string | null };

type Signup = {
  id: string;
  status: "pending" | "activated" | "rejected";
  subscriptionStatus?: "active" | "paused" | "cancelled" | "pending";
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
  activatedAt: string | null;
  pausedAt: string | null;
  cancelledAt: string | null;
  pauseReason: string | null;
  cancellationReason: string | null;
  restaurantId: string | null;
  uid: string | null;
};

type Metrics = {
  totalSignups: number;
  pendingCount: number;
  activeCount: number;
  pausedCount: number;
  cancelledCount: number;
  rejectedCount: number;
  totalOutlets: number;
  totalTables: number;
  estimatedMRR: number;
};

const TABS = [
  { id: "all", label: "All Accounts" },
  { id: "pending", label: "Pending Approvals" },
  { id: "active", label: "Active Subscriptions" },
  { id: "paused", label: "Paused" },
  { id: "cancelled", label: "Ended / Cancelled" },
  { id: "rejected", label: "Rejected" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type ModalAction = {
  type: "activate" | "pause" | "resume" | "end" | "resend";
  signup: Signup;
};

export function ActivationsClient() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<TabId>("all");
  const [rows, setRows] = useState<Signup[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);
  const [actionReason, setActionReason] = useState("");

  const load = useCallback(async (selectedTab: TabId, withToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/signups?status=${selectedTab}`, {
        headers: { "x-admin-token": withToken },
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not load signups.");
        setAuthed(false);
        return;
      }
      setRows(body.signups ?? []);
      if (body.metrics) {
        setMetrics(body.metrics);
      }
      setAuthed(true);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  function switchTab(next: TabId) {
    setTab(next);
    setFlash(null);
    if (authed && token) {
      load(next, token);
    }
  }

  async function executeAction() {
    if (!modalAction) return;
    const { type, signup } = modalAction;
    setBusyId(signup.id);
    setError(null);
    setFlash(null);

    let apiAction = "activate";
    if (type === "pause") apiAction = "pause_subscription";
    if (type === "resume") apiAction = "resume_subscription";
    if (type === "end") apiAction = "end_subscription";
    if (type === "resend") apiAction = "resend_credentials";

    try {
      const res = await fetch("/api/admin/signups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          signupId: signup.id,
          action: apiAction,
          reason: actionReason.trim() || undefined,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Action failed.");
        return;
      }

      setFlash(
        body.message ??
          (type === "activate"
            ? `${signup.businessName} activated successfully. Welcome email sent.`
            : `Updated subscription for ${signup.businessName}.`),
      );
      setModalAction(null);
      setActionReason("");
      await load(tab, token);
    } catch {
      setError("Could not reach server to complete action.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(signup: Signup) {
    if (!confirm(`Are you sure you want to reject registration for ${signup.businessName}?`)) {
      return;
    }
    setBusyId(signup.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/signups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ signupId: signup.id, action: "reject" }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to reject signup.");
        return;
      }
      setFlash(`${signup.businessName} marked as rejected.`);
      await load(tab, token);
    } catch {
      setError("Could not reach server.");
    } finally {
      setBusyId(null);
    }
  }

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((r) => {
      return (
        r.businessName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q) ||
        (r.restaurantId && r.restaurantId.toLowerCase().includes(q))
      );
    });
  }, [rows, searchQuery]);

  if (!authed) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-rule bg-paper p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/10 text-xl font-bold text-amber-deep">
            🛡️
          </span>
          <div>
            <h1 className="t-card text-xl">Admin Management Portal</h1>
            <p className="text-xs text-ink-dim">Sit-N-Order Restaurant Management</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-ink-soft">
          Enter your secure <code>ADMIN_TOKEN</code> from <code>.env.local</code> to access activations and subscription management.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            load(tab, token);
          }}
        >
          <div>
            <label className="field-label" htmlFor="admin-token">
              Admin Token Key
            </label>
            <input
              id="admin-token"
              type="password"
              className="input font-mono text-sm tracking-wide"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token..."
              autoComplete="off"
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full justify-center !py-3 text-sm font-semibold" disabled={loading}>
            {loading ? "Authenticating…" : "Sign in to Dashboard →"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="t-hero text-2xl sm:text-3xl">Restaurant Subscriptions & Activations</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Live
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Manage onboarding approvals, monitor active restaurants, and control subscription statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-secondary !px-4 !py-2 text-xs font-semibold"
            onClick={() => load(tab, token)}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "↻ Refresh Data"}
          </button>
          <button
            type="button"
            className="btn btn-secondary !px-4 !py-2 text-xs font-semibold text-ink-dim hover:text-red-700"
            onClick={() => {
              setAuthed(false);
              setToken("");
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          <MetricCard
            title="Active Restaurants"
            value={String(metrics.activeCount)}
            subtext="Live paying clients"
            color="text-emerald-700"
            bgColor="bg-emerald-50/50"
            borderColor="border-emerald-200"
            icon="🟢"
          />
          <MetricCard
            title="Estimated MRR"
            value={formatINR(metrics.estimatedMRR)}
            subtext={`₹999 × ${metrics.totalOutlets} outlets`}
            color="text-amber-deep"
            bgColor="bg-amber-50/50"
            borderColor="border-amber-200"
            icon="💳"
          />
          <MetricCard
            title="Pending Approvals"
            value={String(metrics.pendingCount)}
            subtext="Awaiting activation"
            color="text-blue-700"
            bgColor="bg-blue-50/50"
            borderColor="border-blue-200"
            icon="⏳"
          />
          <MetricCard
            title="Paused Accounts"
            value={String(metrics.pausedCount)}
            subtext="Temporarily paused"
            color="text-amber-800"
            bgColor="bg-amber-50/30"
            borderColor="border-amber-200"
            icon="⏸️"
          />
          <MetricCard
            title="Total Outlets / Tables"
            value={`${metrics.totalOutlets} / ${metrics.totalTables}`}
            subtext="Managed tables"
            color="text-ink"
            bgColor="bg-paper-2"
            borderColor="border-rule"
            icon="🍽️"
          />
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5 border-b border-rule pb-2 md:border-b-0 md:pb-0">
          {TABS.map((t) => {
            const count =
              metrics
                ? t.id === "all"
                  ? metrics.totalSignups
                  : t.id === "pending"
                  ? metrics.pendingCount
                  : t.id === "active"
                  ? metrics.activeCount
                  : t.id === "paused"
                  ? metrics.pausedCount
                  : t.id === "cancelled"
                  ? metrics.cancelledCount
                  : metrics.rejectedCount
                : null;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  tab === t.id
                    ? "bg-ink text-paper shadow-sm"
                    : "bg-paper text-ink-soft hover:bg-paper-2 hover:text-ink"
                }`}
              >
                <span>{t.label}</span>
                {count !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-bold ${
                      tab === t.id ? "bg-paper/20 text-paper" : "bg-paper-2 text-ink-dim"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            className="input !py-2 !pl-9 text-xs"
            placeholder="Search by name, email, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="pointer-events-none absolute left-3 top-2.5 text-xs text-ink-dim">
            🔍
          </span>
          {searchQuery && (
            <button
              type="button"
              className="absolute right-3 top-2 text-xs text-ink-dim hover:text-ink"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {flash && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>{flash}</span>
          </div>
          <button type="button" onClick={() => setFlash(null)} className="text-xs text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-xs">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-xs text-red-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Account Cards Listing */}
      {filteredRows.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-rule bg-paper p-12 text-center">
          <p className="text-3xl">📋</p>
          <h3 className="t-card mt-3 text-base">No accounts found</h3>
          <p className="mt-1 text-xs text-ink-dim">
            {searchQuery
              ? `No results matching "${searchQuery}".`
              : `There are currently no accounts in the "${tab}" category.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredRows.map((s) => {
            const isPending = s.status === "pending";
            const isRejected = s.status === "rejected";
            const isLive = s.status === "activated" && s.subscriptionStatus === "active";
            const isPaused = s.subscriptionStatus === "paused";
            const isCancelled = s.subscriptionStatus === "cancelled";

            return (
              <div
                key={s.id}
                className="flex flex-col justify-between rounded-2xl border border-rule bg-paper p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-md"
              >
                <div>
                  {/* Top Bar: Title & Badge */}
                  <div className="flex items-start justify-between gap-3 border-b border-rule/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="t-card text-lg text-ink font-bold">{s.businessName}</h2>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        Owner: <strong className="text-ink">{s.ownerName}</strong> · {s.city}, {s.state}
                      </p>
                    </div>

                    <StatusBadge
                      isPending={isPending}
                      isRejected={isRejected}
                      isLive={isLive}
                      isPaused={isPaused}
                      isCancelled={isCancelled}
                    />
                  </div>

                  {/* Details Grid */}
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <DetailItem label="Email" value={s.email} isMono />
                    <DetailItem label="Phone" value={s.phone} isMono />
                    <DetailItem label="Outlets / Tables" value={`${s.outletCount} outlet(s) · ${s.tableCount} tables`} />
                    <DetailItem label="Tenant ID" value={s.restaurantId ?? "Not assigned"} isMono />
                    {s.fssaiLicense && <DetailItem label="FSSAI" value={s.fssaiLicense} isMono />}
                    {s.gstin && <DetailItem label="GSTIN" value={s.gstin} isMono />}
                    {s.submittedAt && (
                      <DetailItem
                        label="Registered"
                        value={new Date(s.submittedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      />
                    )}
                    {s.activatedAt && (
                      <DetailItem
                        label="Activated"
                        value={new Date(s.activatedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      />
                    )}
                  </dl>

                  {/* Status Notes (Pause or Cancellation reasons) */}
                  {isPaused && s.pauseReason && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                      <strong>Pause Reason:</strong> {s.pauseReason}
                    </div>
                  )}

                  {isCancelled && s.cancellationReason && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50/70 p-3 text-xs text-red-900">
                      <strong>Termination Reason:</strong> {s.cancellationReason}
                    </div>
                  )}

                  {/* Consents */}
                  <div className="mt-4 border-t border-rule/50 pt-3">
                    <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-dim">
                      Consents:
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {Object.entries(s.consents).map(([k, v]) => (
                        <span
                          key={k}
                          className={`rounded-md px-2 py-0.5 text-[0.6875rem] ${
                            v.granted
                              ? "bg-emerald-50 font-medium text-emerald-800 border border-emerald-200"
                              : "bg-paper-2 text-ink-dim"
                          }`}
                        >
                          {v.granted ? "✓" : "○"} {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary !py-2 !px-4 text-xs font-semibold"
                        disabled={busyId === s.id}
                        onClick={() => setModalAction({ type: "activate", signup: s })}
                      >
                        ✓ Activate Account
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary !py-2 !px-3 text-xs text-red-700 hover:bg-red-50"
                        disabled={busyId === s.id}
                        onClick={() => handleReject(s)}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {isLive && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary !py-2 !px-3 text-xs font-semibold text-amber-900 hover:bg-amber-50"
                        disabled={busyId === s.id}
                        onClick={() => setModalAction({ type: "pause", signup: s })}
                      >
                        ⏸️ Pause Subscription
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary !py-2 !px-3 text-xs font-semibold text-ink-soft hover:text-ink"
                        disabled={busyId === s.id}
                        onClick={() => setModalAction({ type: "resend", signup: s })}
                      >
                        ✉️ Resend Password
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary !py-2 !px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                        disabled={busyId === s.id}
                        onClick={() => setModalAction({ type: "end", signup: s })}
                      >
                        ⛔ End Subscription
                      </button>
                    </>
                  )}

                  {isPaused && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary !py-2 !px-4 text-xs font-semibold"
                        disabled={busyId === s.id}
                        onClick={() => setModalAction({ type: "resume", signup: s })}
                      >
                        ▶️ Resume Subscription
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary !py-2 !px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                        disabled={busyId === s.id}
                        onClick={() => setModalAction({ type: "end", signup: s })}
                      >
                        ⛔ End Subscription
                      </button>
                    </>
                  )}

                  {isCancelled && (
                    <button
                      type="button"
                      className="btn btn-secondary !py-2 !px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                      disabled={busyId === s.id}
                      onClick={() => setModalAction({ type: "resume", signup: s })}
                    >
                      ↻ Reactivate Subscription
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation & Action Modal */}
      {modalAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl bg-paper p-6 sm:p-7 shadow-2xl border border-rule">
            <h2 className="t-card text-xl font-bold text-ink">
              {modalAction.type === "activate" && `Activate ${modalAction.signup.businessName}?`}
              {modalAction.type === "pause" && `Pause Subscription for ${modalAction.signup.businessName}?`}
              {modalAction.type === "resume" && `Resume Subscription for ${modalAction.signup.businessName}?`}
              {modalAction.type === "end" && `End Subscription for ${modalAction.signup.businessName}?`}
              {modalAction.type === "resend" && `Resend Credentials to ${modalAction.signup.email}?`}
            </h2>

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-ink-soft">
              {modalAction.type === "activate" &&
                "This creates the restaurant workspace in Firestore, generates an authentication user, and emails them a temporary password."}
              {modalAction.type === "pause" &&
                "Pausing disables dashboard login and stops QR customer ordering immediately. The restaurant's data and configuration will remain safely preserved."}
              {modalAction.type === "resume" &&
                "Resuming restores dashboard access and re-enables table ordering for this restaurant."}
              {modalAction.type === "end" &&
                "Ending the subscription revokes dashboard access and terminates this account's active plan."}
              {modalAction.type === "resend" &&
                "This will generate a fresh temporary password and email it directly to the owner's address."}
            </p>

            {(modalAction.type === "pause" || modalAction.type === "end") && (
              <div className="mt-4">
                <label className="field-label" htmlFor="action-reason">
                  Reason / Internal Notes (Optional)
                </label>
                <input
                  id="action-reason"
                  type="text"
                  className="input text-xs"
                  placeholder={modalAction.type === "pause" ? "e.g., Requested 1-month pause" : "e.g., Non-payment"}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="btn btn-secondary flex-1 text-xs font-semibold"
                onClick={() => {
                  setModalAction(null);
                  setActionReason("");
                }}
                disabled={busyId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn flex-1 text-xs font-semibold ${
                  modalAction.type === "end" ? "bg-red-700 text-white hover:bg-red-800" : "btn-primary"
                }`}
                onClick={executeAction}
                disabled={busyId !== null}
              >
                {busyId !== null ? "Processing…" : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtext,
  color,
  bgColor,
  borderColor,
  icon,
}: {
  title: string;
  value: string;
  subtext: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-xs ${bgColor} ${borderColor}`}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-ink-dim">
          {title}
        </p>
        <span className="text-sm">{icon}</span>
      </div>
      <p className={`mt-2 text-2xl font-extrabold tracking-tight ${color}`}>{value}</p>
      <p className="mt-1 text-[0.6875rem] text-ink-soft">{subtext}</p>
    </div>
  );
}

function StatusBadge({
  isPending,
  isRejected,
  isLive,
  isPaused,
  isCancelled,
}: {
  isPending: boolean;
  isRejected: boolean;
  isLive: boolean;
  isPaused: boolean;
  isCancelled: boolean;
}) {
  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-blue-800">
        ● Pending
      </span>
    );
  }
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-emerald-800">
        ● Active
      </span>
    );
  }
  if (isPaused) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-amber-800">
        ⏸️ Paused
      </span>
    );
  }
  if (isCancelled) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-red-800">
        ✕ Ended
      </span>
    );
  }
  if (isRejected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-neutral-100 px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-neutral-700">
        Rejected
      </span>
    );
  }
  return null;
}

function DetailItem({
  label,
  value,
  isMono,
}: {
  label: string;
  value: string;
  isMono?: boolean;
}) {
  return (
    <div>
      <dt className="text-ink-dim">{label}</dt>
      <dd className={`mt-0.5 truncate text-ink font-medium ${isMono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

