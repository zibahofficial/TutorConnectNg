import type { LucideIcon } from "lucide-react";

/**
 * Dashboard summary card. When `href` is provided the card becomes a real
 * link (e.g. to the section it summarises) — otherwise it stays a plain,
 * non-interactive stat so nothing looks clickable without an action.
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  accent = "navy",
  live = false,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: "navy" | "emerald" | "amber" | "rose";
  live?: boolean;
  href?: string;
}) {
  const accents: Record<string, string> = {
    navy: "bg-navy-50 text-navy-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };

  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accents[accent]}`}>
          <Icon size={20} />
        </div>
        {live && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
    </>
  );

  const base = "rounded-2xl border border-slate-200 bg-white p-5 shadow-card";

  if (!href) return <div className={base}>{body}</div>;

  return (
    <a
      href={href}
      title={`Go to ${label}`}
      className={`${base} block transition-colors hover:border-navy-300 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-300`}
    >
      {body}
    </a>
  );
}
