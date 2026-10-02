import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const STATS = [
  {
    label: "Verified Tutors",
    value: "2,400+",
    href: "/tutors?verifiedOnly=true",
    description: "Browse verified tutors",
  },
  {
    label: "Students Helped",
    value: "10,000+",
    href: "/#testimonials",
    description: "Read their stories",
  },
  {
    label: "States Covered",
    value: "12+",
    href: "/tutors",
    description: "See tutors near you",
  },
  {
    label: "Average Rating",
    value: "4.8/5",
    href: "/#testimonials",
    description: "See reviews",
  },
];

export default function StatsBar() {
  return (
    <section className="border-y border-slate-200 bg-white py-8">
      <div className="container-app grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {STATS.map((s) => (
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
