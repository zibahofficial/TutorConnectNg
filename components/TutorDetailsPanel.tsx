"use client";

import { useEffect, useState } from "react";
import { CalendarDays, FileText, Loader2, MapPin, Phone, Star } from "lucide-react";
import AccountStatusBadge from "@/components/AccountStatusBadge";

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

interface TutorDetailsData {
  tutor: {
    id: string;
    email: string | null;
    fullName: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    joinedAt: string | null;
    accountStatus: string | null;
    hasProfile: boolean;
    headline: string | null;
    bio: string | null;
    hourlyRate: number | null;
    currency: string;
    yearsExperience: number | null;
    ratingAvg: number | null;
    totalReviews: number | null;
    totalSessions: number | null;
    isVerified: boolean;
    verificationStatus: string | null;
    profileCreatedAt: string | null;
  };
  subjects: string[];
  availability: Array<{ day: string; start: string; end: string }>;
  documents: Array<{ id: string; type: string; name: string; dataUrl: string; uploadedAt: string }>;
  verification: { status: string; appliedAt: string; reviewedAt: string | null } | null;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function NotProvided({ label = "Not provided — not submitted" }: { label?: string }) {
  return <span className="text-sm italic text-slate-400">{label}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-0.5 break-words text-sm text-slate-700">{children}</div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ size?: number | string; className?: string }>; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-slate-900">
        <Icon size={14} className="text-navy-600" />
        <h4 className="text-xs font-bold uppercase tracking-wide">{title}</h4>
      </div>
      {children}
    </div>
  );
}

/**
 * Inline, read-only details view for one tutor in the admin dashboard.
 *
 * Every value is fetched live from PostgreSQL (`admin_tutor_details`). Fields
 * the tutor never submitted render honest "not provided" messages — nothing
 * is invented, and no mock data is ever shown.
 */
export default function TutorDetailsPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<TutorDetailsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      setData(null);
      const token = window.localStorage.getItem("tutorconnect_token") || "";
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: "admin_tutor_details", targetId: userId }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Could not load this tutor's details");
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this tutor's details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Loading real profile data from the database…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
        {error || "No details available for this tutor."}
      </div>
    );
  }

  const { tutor } = data;
  const location = [tutor.city, tutor.state].filter(Boolean).join(", ");
  const verificationDate = formatDate(data.verification?.appliedAt ?? null);
  const reviewedDate = formatDate(data.verification?.reviewedAt ?? null);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-sm font-bold text-slate-900">
          {tutor.fullName || "Tutor"}
        </span>
        <AccountStatusBadge status={tutor.accountStatus} verificationStatus={tutor.verificationStatus} />
        {tutor.isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
            <Star size={11} /> Verified
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Section title="Profile" icon={FileText}>
          <div className="space-y-2.5">
            <Field label="Headline">{tutor.headline ? tutor.headline : <NotProvided />}</Field>
            <Field label="Bio">{tutor.bio ? <p className="whitespace-pre-line">{tutor.bio}</p> : <NotProvided />}</Field>
            <Field label="Experience">
              {tutor.yearsExperience != null
                ? `${tutor.yearsExperience} year${tutor.yearsExperience === 1 ? "" : "s"}`
                : <NotProvided />}
            </Field>
          </div>
        </Section>

        <Section title="Contact & Location" icon={MapPin}>
          <div className="space-y-2.5">
            <Field label="Email">{tutor.email ? tutor.email : <NotProvided />}</Field>
            <Field label="Phone">
              {tutor.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone size={13} className="text-slate-400" /> {tutor.phone}
                </span>
              ) : (
                <NotProvided />
              )}
            </Field>
            <Field label="City / State">
              {location ? location : <NotProvided />}
            </Field>
          </div>
        </Section>

        <Section title="Rate & Reviews" icon={Star}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            <Field label="Rate">
              {tutor.hourlyRate != null
                ? `₦${tutor.hourlyRate.toLocaleString("en-NG")} / hour`
                : <NotProvided />}
            </Field>
            <Field label="Rating">
              {tutor.ratingAvg != null && tutor.ratingAvg > 0
                ? `${Number(tutor.ratingAvg).toFixed(1)} / 5`
                : <NotProvided label="No reviews yet" />}
            </Field>
            <Field label="Reviews">{tutor.totalReviews != null ? String(tutor.totalReviews) : "0"}</Field>
            <Field label="Sessions">{tutor.totalSessions != null ? String(tutor.totalSessions) : "0"}</Field>
          </div>
        </Section>

        <Section title="Subjects" icon={FileText}>
          {data.subjects.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {data.subjects.map((s) => (
                <span key={s} className="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-bold text-navy-700">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <NotProvided label="No subjects listed" />
          )}
        </Section>

        <Section title="Weekly Availability" icon={CalendarDays}>
          {data.availability.length > 0 ? (
            <ul className="space-y-1 text-sm text-slate-700">
              {data.availability.map((slot, i) => (
                <li key={`${slot.day}-${slot.start}-${i}`}>
                  <span className="font-semibold">{slot.day}</span> · {slot.start} – {slot.end}
                </li>
              ))}
            </ul>
          ) : (
            <NotProvided label="No availability set" />
          )}
        </Section>

        <Section title="Credential Documents" icon={FileText}>
          {data.documents.length > 0 ? (
            <ul className="space-y-2">
              {data.documents.map((d) => (
                <li key={d.id} className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL preview */}
                  <img
                    src={d.dataUrl}
                    alt={d.name}
                    className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-slate-100 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-700">{d.type}</p>
                    <a
                      href={d.dataUrl}
                      download={d.name}
                      className="text-[11px] font-semibold text-navy-700 hover:underline"
                    >
                      View / download
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <NotProvided label="No documents uploaded" />
          )}
        </Section>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-1.5 text-slate-900">
          <FileText size={14} className="text-navy-600" />
          <h4 className="text-xs font-bold uppercase tracking-wide">Verification Application</h4>
        </div>
        {data.verification ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-700">
            <span className="inline-flex items-center gap-1.5">
              Status
              <AccountStatusBadge status={data.verification.status === "declined" ? "rejected" : data.verification.status} />
            </span>
            <span>Applied: {verificationDate || "—"}</span>
            <span>Reviewed: {reviewedDate || (data.verification.status === "pending" ? "Awaiting review" : "—")}</span>
          </div>
        ) : (
          <p className="text-sm italic text-slate-400">No verification application submitted yet.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>
          Account joined: {formatDate(tutor.joinedAt) || "—"}
        </span>
        {tutor.profileCreatedAt && (
          <span>Profile created: {formatDate(tutor.profileCreatedAt)}</span>
        )}
        <span className="inline-flex items-center gap-1">
          {initials(tutor.fullName || "Tutor")} · record {tutor.id.slice(0, 8)}
        </span>
      </div>
    </div>
  );
}
