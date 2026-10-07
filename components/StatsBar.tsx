import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PlatformStats } from "@/db/tutors";

/**
 * Live platform counters. Every number is a database aggregate (verified
 * tutors, registered students/parents, states with verified tutors, average
 * review rating) — nothing here is hard-coded.
 */
function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k+`;
  return String(value);
}

export default function StatsBar({ stats }: { stats: PlatformStats | null }) {
  const items = [
    {
      label: "Verified Tutors",
      value: formatCount(stats?.verifiedTutors),
      href: "/tutors?verifiedOnly=true",
      description: "Browse verified tutors",
    },
    {
      label: "Students Helped",
      value: formatCount(stats?.studentsHelped),
      href: "/tutors",
      description: "Find a tutor",
    },
    {
      label: "States Covered",
      value: formatCount(stats?.statesCovered),
      href: "/tutors",
      description: "See tutors near you",
    },
    {
      label: "Average Rating",
      value: stats?.averageRating != null ? `${stats.averageRating.toFixed(1)}/5` : "—",
      href: "/tutors?verifiedOnly=true",
      description: "See top-rated tutors",
    },
  ];

  return (
    <section className="border-y border-slate-200 bg-white py-8">
      <div className="container-app grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {items.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            title={s.description}
            aria-label={`${s.value} ${s.label} — ${s.description}`}
            className="group rounded-2xl text-center transition-colors hover:bg-navy-50/60 focus-visible:bg-navy-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-300 px-2 py-3"
          >
            <p className="flex items-center justify-center gap-1 font-display text-2xl font-extrabold text-navy-700 transition-colors group-hover:text-navy-900 sm:text-3xl">
              {s.value}
              <ArrowUpRight
                size={16}
                className="mt-1 shrink-0 text-navy-300 opacity-0 transition-opacity group-hover:opacity-100 sm:mt-1.5"
              />
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400 group-hover:text-navy-500 sm:text-sm">
              {s.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
