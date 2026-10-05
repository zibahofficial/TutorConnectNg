"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BadgeCheck,
  Ban,
  BarChart3,
  CalendarCheck2,
  FileCheck2,
  Lock,
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
import { TUTORS } from "@/lib/mock-data";
import type { Booking, Tutor } from "@/lib/types";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
export default function AdminDashboard() {
  const router = useRouter();

  const [tutors, setTutors] = useState<Tutor[]>(TUTORS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; email: string; full_name: string; role: string; is_active: boolean; created_at: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!authChecked) return;
    const token = localStorage.getItem("tutorconnect_token") || "";
    fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action: "admin_list_users" }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAdminUsers(data.users ?? []);
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, [authChecked]);

  useEffect(() => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings ?? []))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const pendingVerifications = tutors.filter((t) => !t.isVerified).length;
    const totalBookings = bookings.length;
    const revenue = bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + b.totalPrice, 0);
    return { pendingVerifications, totalBookings, revenue };
  }, [tutors, bookings]);

  const bookingBreakdown = useMemo(() => {
    const statuses: Booking["status"][] = ["pending", "accepted", "completed", "rejected", "cancelled"];
    return statuses.map((status) => ({
      status,
      count: bookings.filter((b) => b.status === status).length,
    }));
  }, [bookings]);

  async function toggleVerification(id: string) {
    const currentTutor = tutors.find((t) => t.id === id);
    const newVerified = !currentTutor?.isVerified;
    setTutors((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isVerified: newVerified } : t))
    );
    const token = localStorage.getItem("tutorconnect_token") || "";
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "admin_update_tutor_status",
          targetId: id,
          isVerified: newVerified,
        }),
      });
    } catch {
      // demo mode; local state already updated
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
      subtitle="Review tutor credential uploads, manage account status, and monitor platform-wide booking metrics."
    >
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Tutors" value={String(tutors.length)} accent="navy" />
        <StatCard icon={ShieldAlert} label="Pending Verifications" value={String(stats.pendingVerifications)} accent="amber" />
        <StatCard icon={CalendarCheck2} label="Total Bookings" value={String(stats.totalBookings)} accent="emerald" />
        <StatCard icon={Wallet} label="Platform Revenue" value={formatNaira(stats.revenue)} accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-display font-bold text-slate-900">Tutor Verification Queue</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {tutors.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 overflow-hidden rounded-full">
                    <Image src={t.avatarUrl} alt={t.fullName} fill sizes="44px" className="object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{t.fullName}</p>
                    <p className="text-xs text-slate-500">{t.headline}</p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileCheck2 size={12} className={t.idCardUploaded ? "text-emerald-500" : "text-slate-300"} /> ID {t.idCardUploaded ? "uploaded" : "missing"}
                      </span>
                      <span className="flex items-center gap-1">
                        <BadgeCheck size={12} className={t.degreeUploaded ? "text-emerald-500" : "text-slate-300"} /> Degree {t.degreeUploaded ? "uploaded" : "missing"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {t.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      <ShieldCheck size={13} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                      <ShieldAlert size={13} /> Pending Review
                    </span>
                  )}
                  <button
                    onClick={() => toggleVerification(t.id)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      t.isVerified
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        : "bg-navy-700 text-white hover:bg-navy-800"
                    }`}
                  >
                    {t.isVerified ? (
                      <>
                        <Ban size={13} /> Suspend
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={13} /> Approve
                      </>
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <BarChart3 size={18} className="text-navy-600" />
              <h2 className="font-display font-bold">Booking Metrics</h2>
            </div>
            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : (
              <div className="space-y-3">
                {bookingBreakdown.map((row) => (
                  <div key={row.status}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-3 font-display font-bold text-slate-900">Dispute Management</h2>
            <p className="text-sm leading-relaxed text-slate-500">
              No open disputes at this time. Booking cancellations and
              complaints will appear here for admin mediation.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-slate-900">User Management</h2>
            <div className="relative w-64">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:border-navy-600 focus:outline-none"
                defaultValue=""
              />
            </div>
          </div>
        </div>
        {usersLoading ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">Loading users…</p>
        ) : adminUsers.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Users size={40} className="mx-auto mb-2 text-slate-200" />
            <p className="text-sm text-slate-500">No users registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminUsers.map((u) => (
                  <tr key={u.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 font-display text-xs font-bold text-navy-700">
                          {u.full_name ? getInitials(u.full_name) : <Lock size={14} />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.full_name || "Unknown"}</p>
                          <p className="truncate text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase text-white" style={{ backgroundColor: roleColor(u.role) }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.is_active ? "accepted" : "cancelled"} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== "admin" && (
                        <button
                          onClick={async () => {
                            const token = localStorage.getItem("tutorconnect_token") || "";
                            await fetch("/api/auth", {
                              method: "POST",
                              headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                              body: JSON.stringify({ action: "admin_delete_user", targetEmail: u.email }),
                            }).catch(() => {});
                            setAdminUsers((prev) => prev.filter((x) => x.id !== u.id));
                          }}
                          className="rounded-full p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function roleColor(role: string): string {
  switch (role) {
    case "admin": return "#fbbf24";
    case "tutor": return "#3b82f6";
    case "parent": return "#10b981";
    default: return "#94a3b8";
  }
}
