import { Ban, Clock, ShieldCheck, ShieldAlert } from "lucide-react";
import type { AccountStatus, VerificationStatus } from "@/lib/types";

const STYLES: Record<AccountStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-600",
  suspended: "bg-slate-100 text-slate-600",
};

const LABELS: Record<AccountStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

function Icon({ status }: { status: AccountStatus }) {
  if (status === "approved") return <ShieldCheck size={13} />;
  if (status === "rejected") return <Ban size={13} />;
  if (status === "suspended") return <Ban size={13} />;
  return <Clock size={13} />;
}

/**
 * Renders the real `users.account_status` value returned by the API. Nothing
 * here is inferred from the client — a status the database does not hold is
 * shown as "Pending Review" rather than being assumed approved.
 */
export default function AccountStatusBadge({
  status,
  verificationStatus,
}: {
  status?: string | null;
  /** Optional tutor credential-review state (tutor rows only). */
  verificationStatus?: string | null;
}) {
  const normalized = (
    ["pending", "approved", "rejected", "suspended"].includes(String(status ?? ""))
      ? status
      : "pending"
  ) as AccountStatus;

  const verification = verificationStatus
    ? (["pending", "approved", "rejected", "suspended"].includes(String(verificationStatus))
        ? (verificationStatus as VerificationStatus)
        : null)
    : null;

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${STYLES[normalized]}`}
      >
        <Icon status={normalized} />
        {LABELS[normalized]}
      </span>
      {verification === "pending" && normalized !== "pending" && (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
          <ShieldAlert size={12} /> Credentials pending
        </span>
      )}
    </span>
  );
}
