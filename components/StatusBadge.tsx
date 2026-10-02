import type { BookingStatus } from "@/lib/types";

const STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  completed: "bg-navy-50 text-navy-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const LABELS: Record<BookingStatus, string> = {
  pending: "Pending Approval",
  accepted: "Accepted",
  rejected: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
