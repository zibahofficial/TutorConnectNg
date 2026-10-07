"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BadgeCheck,
  Ban,
  BarChart3,
  CalendarCheck2,
  FileCheck2,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import PrivateChat from "@/components/PrivateChat";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import AccountStatusBadge from "@/components/AccountStatusBadge";
import type { Booking } from "@/lib/types";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Headers for API calls — attaches the logged-in user's token. */
function authHeaders() {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("tutorconnect_token") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  account_status?: string | null;
  verification_status?: string | null;
  is_verified?: boolean | null;
  created_at: string;
}

interface AdminTutor {
  tutor_profile_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  headline: string | null;
  is_verified: boolean | null;
  verification_status: string | null;
  account_status: string | null;
  id_card_uploaded: boolean | null;
  degree_uploaded: boolean | null;
  created_at?: string;
}

interface VerificationApplication {
  userId: string;
  fullName: string;
  email: string;
  status: string;
  appliedAt: string;
  reviewedAt: string | null;
  documents: Array<{ id: string; type: string; name: string; dataUrl: string }>;
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "T"
  );
}

export default function AdminDashboard() {
  const router = useRouter();

  const [tutors, setTutors] = useState<AdminTutor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [loading, setLoading] = useState(true);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const [tutorsError, setTutorsError] = useState("");
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState("");
  const [userActionId, setUserActionId] = useState("");
  const [actionError, setActionError] = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    const rawUser = localStorage.getItem("tutorconnect_user");
    if (!rawUser) {
      router.replace("/login");
      return;
    }
    try {
      const user = JSON.parse(rawUser);
      if (user.role !== "admin") {
        router.replace("/");
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount read of localStorage auth state after hydration
        setAuthChecked(true);
        setAdminId(user.id || "");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  /** Live admin data — every list below is fetched from the database. */
  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "admin_list_users" }),
      });
      const data = await res.json();
      setAdminUsers(data.users ?? []);
    } catch (err) {
      console.error("Could not load users:", err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadTutors = useCallback(async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "admin_list_tutors" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load tutor profiles");
      setTutors(data.tutors ?? []);
      setTutorsError(data.source === "none" ? data.hint ?? "No database configured." : "");
    } catch (err) {
      console.error("Could not load tutors:", err);
      setTutorsError(err instanceof Error ? err.message : "Could not load tutor profiles");
    } finally {
      setTutorsLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "verification_applications" }),
      });
      const data = await res.json();
      setApplications(data.applications ?? []);
    } catch (err) {
      console.error("Could not load verification applications:", err);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time admin data load after the auth check resolves
    void loadUsers();
    void loadTutors();
    void loadApplications();
  }, [authChecked, loadUsers, loadTutors, loadApplications]);

  useEffect(() => {
    if (!authChecked) return;
    fetch("/api/bookings", { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings ?? []))
      .catch((err) => console.error("Could not load bookings:", err))
      .finally(() => setLoading(false));
  }, [authChecked]);

  const pendingApplications = applications.filter((a) => a.status === "pending").length;
  const pendingTutors = tutors.filter(
    (t) => (t.verification_status ?? "pending") === "pending" || (t.account_status ?? "pending") === "pending"
  ).length;

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const revenue = bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
    return { totalTutors: tutors.length, pendingVerifications: pendingTutors, totalBookings, revenue };
  }, [tutors.length, pendingTutors, bookings]);

  const bookingBreakdown = useMemo(() => {
    const statuses: Booking["status"][] = ["pending", "accepted", "completed", "rejected", "cancelled"];
    return statuses.map((status) => ({
      status,
      count: bookings.filter((b) => b.status === status).length,
    }));
  }, [bookings]);

  const filteredUsers = useMemo(() => {
    const needle = userSearch.trim().toLowerCase();
    if (!needle) return adminUsers;
    return adminUsers.filter(
      (u) =>
        (u.email ?? "").toLowerCase().includes(needle) ||
        (u.full_name ?? "").toLowerCase().includes(needle) ||
        (u.role ?? "").toLowerCase().includes(needle)
    );
  }, [adminUsers, userSearch]);

  async function reviewApplication(userId: string, decision: "approved" | "declined") {
    setReviewingId(userId);
    setActionError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "review_verification", userId, decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not record that decision");
      // Re-read from the database so the UI can never show a state it invented.
      await Promise.all([loadApplications(), loadTutors(), loadUsers()]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not record that decision");
    } finally {
      setReviewingId("");
    }
  }

  async function updateTutorStatus(userId: string, status: "approved" | "rejected" | "suspended" | "pending") {
    setReviewingId(userId);
    setActionError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "admin_update_tutor_status", targetId: userId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update that tutor");
      await Promise.all([loadTutors(), loadUsers(), loadApplications()]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update that tutor");
    } finally {
      setReviewingId("");
    }
  }

  async function updateUserStatus(userId: string, status: "approved" | "rejected" | "suspended" | "pending") {
    setUserActionId(userId);
    setActionError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "admin_update_user_status", targetId: userId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update that account");
      await Promise.all([loadUsers(), loadTutors()]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update that account");
    } finally {
      setUserActionId("");
    }
  }

  async function deleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      `Permanently delete ${user.full_name || user.email}? Their bookings and uploaded documents will also be removed. This cannot be undone.`
    );
    if (!confirmed) return;
    setUserActionId(user.id);
    setActionError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "admin_delete_user", targetEmail: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete that account");
      await Promise.all([loadUsers(), loadTutors()]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete that account");
    } finally {
      setUserActionId("");
    }
  }

  const maxCount = Math.max(1, ...bookingBreakdown.map((b) => b.count));

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-400">Checking authentication…</p>
      </div>
    );
  }

  return (
    <DashboardShell
      title="Admin Panel"
      subtitle="Review tutor credentials, approve or reject accounts, and monitor platform-wide booking metrics."
    >
      {actionError && (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <span className="min-w-0 break-words">{actionError}</span>
          <button onClick={() => setActionError("")} className="shrink-0 text-xs font-bold uppercase tracking-wide">
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Tutors" value={String(stats.totalTutors)} accent="navy" href="#tutor-queue" />
        <StatCard
          icon={ShieldAlert}
          label="Pending Verifications"
          value={String(stats.pendingVerifications)}
          accent="amber"
          href="#pending-verifications"
        />
        <StatCard icon={CalendarCheck2} label="Total Bookings" value={String(stats.totalBookings)} accent="emerald" href="#booking-metrics" />
        <StatCard icon={Wallet} label="Platform Revenue" value={formatNaira(stats.revenue)} accent="rose" href="#booking-metrics" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
        {/* Credential applications */}
        <div id="pending-verifications" className="min-w-0 scroll-mt-24 rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-display font-bold text-slate-900">Credential Applications</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                {pendingApplications} pending
              </span>
              <button
                onClick={() => {
                  setAppsLoading(true);
                  void loadApplications();
                }}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Refresh applications"
                aria-label="Refresh applications"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          {appsLoading ? (
            <p className="px-6 py-8 text-sm text-slate-400">Loading credential applications…</p>
          ) : applications.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-400">
              No tutor has applied for verification yet. Applications appear here as soon as a
              registered tutor submits their ID and academic credential.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {applications.map((a) => (
                <li key={a.userId} className="px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">{a.fullName}</p>
                      <p className="break-all text-xs text-slate-500">{a.email}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Applied{" "}
                        {new Date(a.appliedAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <AccountStatusBadge status={a.status === "declined" ? "rejected" : a.status} />
                  </div>

                  {a.documents.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {a.documents.map((d) => (
                        <div key={d.id} className="w-32 rounded-xl border border-slate-200 p-2 sm:w-36">
                          {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL preview */}
                          <img src={d.dataUrl} alt={d.name} className="h-20 w-full rounded-lg bg-slate-100 object-cover" />
                          <p className="mt-1.5 truncate text-[11px] font-bold text-slate-700">{d.type}</p>
                          <a
                            href={d.dataUrl}
                            download={d.name}
                            className="mt-0.5 block truncate text-[11px] font-semibold text-navy-700 hover:underline"
                          >
                            View / download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {a.status === "pending" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => reviewApplication(a.userId, "approved")}
                        disabled={reviewingId === a.userId}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <ShieldCheck size={13} /> Approve
                      </button>
                      <button
                        onClick={() => reviewApplication(a.userId, "declined")}
                        disabled={reviewingId === a.userId}
                        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-4 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-60"
                      >
                        <Ban size={13} /> Reject
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Reviewed
                      {a.reviewedAt
                        ? ` — ${new Date(a.reviewedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
                        : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tutor verification queue */}
        <div id="tutor-queue" className="min-w-0 scroll-mt-24 rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-display font-bold text-slate-900">Tutor Verification Queue</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              {tutors.length} tutor{tutors.length === 1 ? "" : "s"}
            </span>
          </div>
          {tutorsLoading ? (
            <p className="px-5 py-8 text-sm text-slate-400 sm:px-6">Loading tutor profiles…</p>
          ) : tutors.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 sm:px-6">
              {tutorsError || "No tutor profiles yet. Registered tutors appear here for review."}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tutors.map((t) => {
                const name = t.full_name || "Tutor";
                const status = t.verification_status ?? (t.is_verified ? "approved" : "pending");
                const busy = reviewingId === t.user_id;
                return (
                  <li key={t.tutor_profile_id} className="px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        {t.avatar_url ? (
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                            <Image src={t.avatar_url} alt={name} fill sizes="44px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-100 font-display text-xs font-bold text-navy-700">
                            {initials(name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-slate-900">{name}</p>
                          <p className="break-all text-xs text-slate-500">{t.email}</p>
                          <p className="mt-0.5 break-words text-xs text-slate-500">
                            {t.headline || "No headline provided"}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <FileCheck2 size={12} className={t.id_card_uploaded ? "text-emerald-500" : "text-slate-300"} />
                              ID {t.id_card_uploaded ? "uploaded" : "missing"}
                            </span>
                            <span className="flex items-center gap-1">
                              <BadgeCheck size={12} className={t.degree_uploaded ? "text-emerald-500" : "text-slate-300"} />
                              Credential {t.degree_uploaded ? "uploaded" : "missing"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <AccountStatusBadge status={t.account_status} verificationStatus={status} />
                        {status !== "approved" && (
                          <button
                            onClick={() => updateTutorStatus(t.user_id, "approved")}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-full bg-navy-700 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
                          >
                            <ShieldCheck size={13} /> Approve
                          </button>
                        )}
                        {status !== "rejected" && (
                          <button
                            onClick={() => updateTutorStatus(t.user_id, "rejected")}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-60"
                          >
                            <Ban size={13} /> Reject
                          </button>
                        )}
                        {status === "approved" && (
                          <button
                            onClick={() => updateTutorStatus(t.user_id, "suspended")}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-60"
                          >
                            <Ban size={13} /> Suspend
                          </button>
                        )}
                        {status === "suspended" && (
                          <button
                            onClick={() => updateTutorStatus(t.user_id, "approved")}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
                          >
                            <ShieldCheck size={13} /> Reinstate
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Booking metrics + disputes */}
        <div className="min-w-0 space-y-6">
          <div id="booking-metrics" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <BarChart3 size={18} className="text-navy-600" />
              <h2 className="font-display font-bold">Booking Metrics</h2>
            </div>
            {loading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : (
              <div className="space-y-3">
                {bookingBreakdown.map((row) => (
                  <div key={row.status}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                      <StatusBadge status={row.status} />
                      <span>{row.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-navy-600 to-emerald-500"
                        style={{ width: `${(row.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-3 font-display font-bold text-slate-900">Dispute Management</h2>
            <p className="text-sm leading-relaxed text-slate-500">
              No open disputes at this time. Booking cancellations and complaints will appear here
              for admin mediation.
            </p>
          </div>
        </div>
      </div>

      {/* User management */}
      <div id="user-management" className="mt-8 min-w-0 scroll-mt-24 rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-slate-900">User Management</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              {filteredUsers.length}
            </span>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name, email, or role…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-navy-600 focus:outline-none"
            />
          </div>
        </div>
        {usersLoading ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">Loading users…</p>
        ) : adminUsers.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Users size={40} className="mx-auto mb-2 text-slate-200" />
            <p className="text-sm text-slate-500">No users registered yet.</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            No accounts match “{userSearch}”.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <th className="w-[28%] px-4 py-3">User</th>
                  <th className="w-[12%] px-4 py-3">Role</th>
                  <th className="w-[20%] px-4 py-3">Status</th>
                  <th className="w-[14%] px-4 py-3">Joined</th>
                  <th className="w-[26%] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const status = (u.account_status ?? (u.role === "admin" ? "approved" : "pending")) as
                    | "pending"
                    | "approved"
                    | "rejected"
                    | "suspended";
                  const busy = userActionId === u.id;
                  return (
                    <tr key={u.id} className="align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 font-display text-xs font-bold text-navy-700">
                            {u.full_name ? initials(u.full_name) : <Lock size={14} />}
                          </div>
                          <div className="min-w-0">
                            <p className="break-words font-semibold text-slate-900">{u.full_name || "Unknown"}</p>
                            <p className="truncate text-xs text-slate-500" title={u.email}>
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase text-white"
                          style={{ backgroundColor: roleColor(u.role) }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <AccountStatusBadge status={status} verificationStatus={u.verification_status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {u.role !== "admin" && status !== "approved" && (
                            <button
                              onClick={() => updateUserStatus(u.id, "approved")}
                              disabled={busy}
                              className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                            >
                              Approve
                            </button>
                          )}
                          {u.role !== "admin" && status !== "rejected" && (
                            <button
                              onClick={() => updateUserStatus(u.id, "rejected")}
                              disabled={busy}
                              className="rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-60"
                            >
                              Reject
                            </button>
                          )}
                          {u.role !== "admin" && status !== "suspended" && (
                            <button
                              onClick={() => updateUserStatus(u.id, "suspended")}
                              disabled={busy}
                              className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-60"
                            >
                              Suspend
                            </button>
                          )}
                          {u.role !== "admin" && status !== "pending" && (
                            <button
                              onClick={() => updateUserStatus(u.id, "pending")}
                              disabled={busy}
                              className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                            >
                              Re-review
                            </button>
                          )}
                          {u.role !== "admin" && (
                            <button
                              onClick={() => deleteUser(u)}
                              disabled={busy}
                              className="rounded-full p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                              title="Delete user"
                              aria-label={`Delete ${u.email}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-8">
        <PrivateChat
          myKey={adminId}
          pickerOptions={adminUsers
            .filter((u) => u.id !== adminId)
            .map((u) => ({ key: u.id, name: u.full_name || u.email }))}
          pickerLabel="＋ Message a user"
          emptyListHint="No conversations yet — pick a user above to start a private support chat."
          minThreadHeight="min-h-[340px]"
        />
      </div>
    </DashboardShell>
  );
}

function roleColor(role: string): string {
  switch (role) {
    case "admin": return "#fbbf24";
    case "tutor": return "#3b82f6";
    case "parent": return "#10b981";
    default: return "#94a3b8";
  }
}
