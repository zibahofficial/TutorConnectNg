"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Ban,
  BarChart3,
  CalendarCheck2,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
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
  const [tutors, setTutors] = useState<Tutor[]>(TUTORS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

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

  function toggleVerification(id: string) {
    setTutors((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isVerified: !t.isVerified } : t))
    );
  }

  const maxCount = Math.max(1, ...bookingBreakdown.map((b) => b.count));

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
    </DashboardShell>
  );
}
