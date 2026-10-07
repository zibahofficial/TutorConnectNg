"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import AdminLink from "@/components/AdminLink";

const TABS = [
  { href: "/dashboard/student", label: "Student / Parent", icon: UserRound },
  { href: "/dashboard/tutor", label: "Tutor", icon: GraduationCap },
  { href: "/dashboard/admin", label: "Admin", icon: ShieldCheck },
];

export default function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    try {
      localStorage.removeItem("tutorconnect_token");
      localStorage.removeItem("tutorconnect_user");
    } catch {
      // ignore storage errors in strict private modes
    }
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-app flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy-700 to-navy-600 text-white">
              <LayoutDashboard size={18} />
            </span>
            <span className="font-display text-sm font-extrabold text-navy-700">
              TutorConnect NG <span className="font-medium text-slate-400">· Dashboard</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-navy-50 hover:text-navy-700"
            >
              <Home size={15} /> Home
            </Link>
            <Link
              href="/tutors"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-navy-50 hover:text-navy-700"
            >
              <Search size={15} /> Find Tutors
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        </div>
        <div className="container-app flex gap-1 overflow-x-auto pb-3">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            const classes = `flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active ? "bg-navy-700 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`;
            // The Admin tab routes by role so a non-admin is sent to their own
            // dashboard instead of the admin panel.
            if (tab.href === "/dashboard/admin") {
              return (
                <AdminLink key={tab.href} href={tab.href} className={classes}>
                  <tab.icon size={14} /> {tab.label}
                </AdminLink>
              );
            }
            return (
              <Link key={tab.href} href={tab.href} className={classes}>
                <tab.icon size={14} /> {tab.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="container-app py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-1 text-slate-500">{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
