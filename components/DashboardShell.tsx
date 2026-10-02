"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";

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
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-700">
            <LogOut size={15} /> Exit to site
          </Link>
        </div>
        <div className="container-app flex gap-1 overflow-x-auto pb-3">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-navy-700 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
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
