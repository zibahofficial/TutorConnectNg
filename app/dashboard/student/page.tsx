"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Heart,
  Laptop,
  LayoutGrid,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  Receipt,
  Save,
  Star,
  User,
  Wallet,
  X,
   Video,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { TUTORS } from "@/lib/mock-data";
import type { Booking } from "@/lib/types";

type TabId = "overview" | "bookings" | "wishlist" | "certificates" | "payments" | "profile";

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "bookings", label: "My Bookings", icon: BookOpen },
  { id: "wishlist", label: "Saved Tutors", icon: Heart },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "payments", label: "Payment History", icon: Receipt },
  { id: "profile", label: "Profile", icon: User },
];

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

interface StoredUser {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  role?: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [user, setUser] = useState<StoredUser | null>(null);

  const [profileForm, setProfileForm] = useState<StoredUser>({});
  const [profileSaved, setProfileSaved] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [savedTutorIds, setSavedTutorIds] = useState<string[]>(["t1"]);

  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tutorconnect_user");
      if (stored) {
        const parsed = JSON.parse(stored) as StoredUser;
        if (parsed && (parsed.role === "student" || parsed.role === "parent")) {
          setUser(parsed);
          setProfileForm(parsed);
        } else if (parsed?.full_name || parsed?.email) {
          router.replace("/");
        } else {
          router.replace("/login");
        }
      } else {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }

    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings ?? []))
      .finally(() => setLoading(false));
  }, [router]);

  const stats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "pending").length;
    const upcoming = bookings.filter((b) => b.status === "accepted").length;
    const completed = bookings.filter((b) => b.status === "completed");
    const totalSpent = completed.reduce((sum, b) => sum + b.totalPrice, 0);
    return {
      myBookings: bookings.length,
      upcoming,
      pending,
      completed: completed.length,
      totalSpent,
    };
  }, [bookings]);

  const savedTutors = TUTORS.filter((t) => savedTutorIds.includes(t.id));
  const completedBookings = bookings.filter((b) => b.status === "completed");

  function toggleSavedTutor(id: string) {
    setSavedTutorIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function submitReview() {
    if (!reviewTarget) return;
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: reviewTarget.id,
          tutorId: reviewTarget.tutorId,
          studentName: user?.full_name || "Student",
          rating,
          comment,
        }),
      });
    } catch {
      // demo mode; API may not persist in mock
    }
    setReviewedIds((prev) => [...prev, reviewTarget.id]);
    setReviewTarget(null);
    setRating(5);
    setComment("");
  }

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setUser(profileForm);
    try {
      localStorage.setItem("tutorconnect_user", JSON.stringify(profileForm));
    } catch {
      // demo-only persistence; safe to ignore storage errors
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  const displayName = user?.full_name || "Student";
  const displayEmail = user?.email || "student@tutorconnect.ng";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (!user?.email) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_account", email: user.email, password: "delete" }),
      });
      if (!res.ok) throw new Error("Could not delete account");
    } catch {
      // demo mode; proceed with client-side cleanup regardless
    }
    localStorage.removeItem("tutorconnect_token");
    localStorage.removeItem("tutorconnect_user");
    setShowDeleteConfirm(false);
    router.replace("/");
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-400">Checking authentication…</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="container-app py-8 lg:py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-600 font-display text-lg font-extrabold text-white">
                  {getInitials(displayName)}
                </div>
                <h2 className="mt-3 truncate font-display text-base font-bold text-slate-900">
                  {displayName}
                </h2>
                <p className="truncate text-xs text-slate-500">{displayEmail}</p>
              </div>

              <nav className="mt-4 space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
                {NAV_ITEMS.map((item) => {
                  const active = activeTab === item.id;
                  const count =
                    item.id === "bookings"
                      ? stats.myBookings
                      : item.id === "wishlist"
                      ? savedTutorIds.length
                      : item.id === "certificates"
                      ? completedBookings.length
                      : undefined;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                        active ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon size={16} /> {item.label}
                      </span>
                      {typeof count === "number" && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <Link href="/tutors" className="btn-primary mt-4 w-full justify-center">
                Browse Tutors
              </Link>
            </aside>

            {/* Main content */}
            <div>
              <span className="inline-flex items-center rounded-full bg-navy-50 px-4 py-1.5 text-xs font-semibold text-navy-700">
                Student Hub
              </span>
              <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Your tutoring dashboard
              </h1>
              <p className="mt-1 text-slate-500">
                Welcome back, {displayName}. Pick up where you left off.
              </p>

              {/* Quick stats */}
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard icon={BookOpen} label="My Bookings" value={String(stats.myBookings)} accent="navy" live />
                <StatCard icon={CalendarClock} label="Upcoming Sessions" value={String(stats.upcoming)} accent="emerald" live />
                <StatCard icon={Heart} label="Saved Tutors" value={String(savedTutorIds.length)} accent="rose" live />
                <StatCard
                  icon={Wallet}
                  label="Total Spent"
                  value={stats.totalSpent > 0 ? formatNaira(stats.totalSpent) : "—"}
                  accent="amber"
                  live
                />
                <StatCard icon={Award} label="Certificates" value={String(completedBookings.length)} accent="navy" live />
              </div>

              {/* Continue learning panel */}
              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-navy-700 to-navy-900 p-7 text-white shadow-soft">
                <h3 className="font-display text-lg font-bold">Continue learning</h3>
                <p className="mt-1 text-sm font-semibold text-emerald-300">
                  {stats.upcoming + stats.pending} session{stats.upcoming + stats.pending === 1 ? "" : "s"} ready to resume
                </p>
                <p className="mt-2 max-w-xl text-sm text-navy-100">
                  Open a booking to view your tutor&apos;s meeting link, track session status, and leave a
                  review once it&apos;s complete.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button onClick={() => setActiveTab("bookings")} className="btn-primary !bg-white !bg-none !text-navy-800">
                    Go to my bookings
                  </button>
                  <Link href="/tutors" className="btn-outline !border-white/40 !bg-transparent !text-white hover:!text-white hover:!border-white">
                    Browse catalog
                  </Link>
                </div>
              </div>

              {/* Tab content */}
              <div className="mt-8">
                {activeTab === "overview" && (
                  <OverviewPanel bookings={bookings} loading={loading} onViewAll={() => setActiveTab("bookings")} />
                )}

                {activeTab === "bookings" && (
                  <BookingsPanel
                    bookings={bookings}
                    loading={loading}
                    reviewedIds={reviewedIds}
                    onReview={setReviewTarget}
                  />
                )}

                {activeTab === "wishlist" && (
                  <WishlistPanel savedTutors={savedTutors} onRemove={toggleSavedTutor} />
                )}

                {activeTab === "certificates" && <CertificatesPanel completed={completedBookings} studentName={displayName} />}

                {activeTab === "payments" && <PaymentsPanel bookings={bookings} loading={loading} />}

                {activeTab === "profile" && (
                  <>
                    <ProfilePanel
                      form={profileForm}
                      onChange={setProfileForm}
                      onSubmit={saveProfile}
                      saved={profileSaved}
                    />
                    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-card">
                      <h3 className="font-display text-lg font-bold text-rose-900">Delete Account</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        This will permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700"
                      >
                        Delete My Account
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Secondary CTA */}
              <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card">
                <h3 className="font-display text-xl font-extrabold text-slate-900">Ready to grow?</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  Book another session with a verified Nigerian tutor and keep your momentum going.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/tutors" className="btn-primary">Browse Tutors</Link>
                  <Link href="/contact" className="btn-outline">Contact Us</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {reviewTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setReviewTarget(null)}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Review {reviewTarget.tutorName}
              </h3>
              <button onClick={() => setReviewTarget(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="mb-4 flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star size={28} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share how the session went..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            />
            <button onClick={submitReview} className="btn-primary mt-4 w-full">
              Submit Review
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-rose-900">Confirm Account Deletion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to permanently delete your account? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof LayoutGrid; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <Icon size={32} className="mb-3 text-slate-300" />
      <h3 className="font-display text-base font-bold text-slate-700">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
    </div>
  );
}

function OverviewPanel({
  bookings,
  loading,
  onViewAll,
}: {
  bookings: Booking[];
  loading: boolean;
  onViewAll: () => void;
}) {
  const recent = bookings.slice(0, 3);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="font-display font-bold text-slate-900">Recent Activity</h2>
        <button onClick={onViewAll} className="text-sm font-semibold text-navy-700 hover:text-navy-900">
          View all bookings
        </button>
      </div>
      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-slate-400">Loading your activity...</p>
      ) : recent.length === 0 ? (
        <div className="px-6 py-6">
          <EmptyState icon={BookOpen} title="No activity yet" description="Book your first session to see it here." />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {recent.map((b) => (
            <li key={b.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {b.subject} <span className="font-normal text-slate-400">with {b.tutorName}</span>
                </p>
                <p className="text-xs text-slate-500">{b.scheduledDate} · {b.startTime}–{b.endTime}</p>
              </div>
              <StatusBadge status={b.status} />
              {b.sessionMode === "online" &&
  b.meetingLink &&
  b.status === "accepted" && (
    <a
      href={b.meetingLink}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
    >
      <Video size={14} />
      Join Online Session
    </a>
  )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookingsPanel({
  bookings,
  loading,
  reviewedIds,
  onReview,
}: {
  bookings: Booking[];
  loading: boolean;
  reviewedIds: string[];
  onReview: (b: Booking) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="font-display font-bold text-slate-900">My Bookings</h2>
        <Link href="/tutors" className="text-sm font-semibold text-navy-700 hover:text-navy-900">
          + Book a new session
        </Link>
      </div>

      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-slate-400">Loading your bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="px-6 py-6">
          <EmptyState icon={BookOpen} title="No bookings yet" description="Browse tutors to get started!" />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {b.subject} <span className="font-normal text-slate-400">with {b.tutorName}</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><CalendarClock size={13} /> {b.scheduledDate} · {b.startTime}–{b.endTime}</span>
                  <span className="flex items-center gap-1">
                    {b.sessionMode === "online" ? <Laptop size={13} /> : <MapPin size={13} />}
                    {b.sessionMode === "online" ? "Online" : "In-Person"}
                  </span>
                  <span>Grade: {b.gradeLevel}</span>
                </div>
                {b.notes && <p className="mt-1.5 text-xs italic text-slate-400">&ldquo;{b.notes}&rdquo;</p>}
              </div>

               <div className="flex items-center gap-3">
                 <span className="font-display font-bold text-navy-700">{formatNaira(b.totalPrice)}</span>
                 <StatusBadge status={b.status} />
                 {b.sessionMode === "online" && b.meetingLink && b.status === "accepted" && (
                   <a
                     href={b.meetingLink}
                     target="_blank"
                     rel="noreferrer"
                     className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                   >
                     <Video size={14} /> Join
                   </a>
                 )}
                 {b.status === "completed" && !reviewedIds.includes(b.id) && (
                  <button
                    onClick={() => onReview(b)}
                    className="inline-flex items-center gap-1 rounded-full border border-navy-200 px-3 py-1.5 text-xs font-bold text-navy-700 hover:bg-navy-50"
                  >
                    <MessageSquarePlus size={14} /> Review
                  </button>
                )}
                {reviewedIds.includes(b.id) && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <Star size={14} className="fill-emerald-500 text-emerald-500" /> Reviewed
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WishlistPanel({
  savedTutors,
  onRemove,
}: {
  savedTutors: typeof TUTORS;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-display font-bold text-slate-900">Saved Tutors</h2>
      </div>
      {savedTutors.length === 0 ? (
        <div className="px-6 py-6">
          <EmptyState icon={Heart} title="No saved tutors yet" description="Save tutors you like while browsing to find them quickly here." />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {savedTutors.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full">
                  <Image src={t.avatarUrl} alt={t.fullName} fill sizes="44px" className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.fullName}</p>
                  <p className="text-xs text-slate-500">{t.headline}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/tutors/${t.id}`} className="btn-outline !px-3 !py-1.5 text-xs">
                  View Profile
                </Link>
                <button
                  onClick={() => onRemove(t.id)}
                  className="rounded-full p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Remove from saved tutors"
                >
                  <Heart size={16} className="fill-current" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CertificatesPanel({ completed, studentName }: { completed: Booking[]; studentName: string }) {
  if (completed.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-display font-bold text-slate-900">Certificates</h2>
        </div>
        <div className="px-6 py-6">
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Complete a session with a tutor to earn a certificate of completion."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 font-display font-bold text-slate-900">Certificates</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {completed.map((b) => (
          <div
            key={b.id}
            className="relative overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-card"
          >
            <Award size={28} className="text-amber-500" />
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-600">
              Certificate of Completion
            </p>
            <h3 className="mt-1 font-display text-lg font-extrabold text-slate-900">{b.subject}</h3>
            <p className="mt-1 text-sm text-slate-500">
              Awarded to <span className="font-semibold text-slate-700">{studentName}</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Tutor: {b.tutorName} · {b.scheduledDate}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsPanel({ bookings, loading }: { bookings: Booking[]; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-display font-bold text-slate-900">Payment History</h2>
      </div>
      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-slate-400">Loading payment history...</p>
      ) : bookings.length === 0 ? (
        <div className="px-6 py-6">
          <EmptyState icon={Receipt} title="No payments yet" description="Your booking payments will appear here." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Tutor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-6 py-3 text-slate-500">{b.scheduledDate}</td>
                  <td className="px-6 py-3 font-semibold text-slate-800">{b.subject}</td>
                  <td className="px-6 py-3 text-slate-500">{b.tutorName}</td>
                  <td className="px-6 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-6 py-3 text-right font-bold text-navy-700">{formatNaira(b.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProfilePanel({
  form,
  onChange,
  onSubmit,
  saved,
}: {
  form: StoredUser;
  onChange: (u: StoredUser) => void;
  onSubmit: (e: React.FormEvent) => void;
  saved: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="mb-5 font-display font-bold text-slate-900">Profile</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Full Name</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
            <User size={16} className="text-slate-400" />
            <input
              value={form.full_name || ""}
              onChange={(e) => onChange({ ...form, full_name: e.target.value })}
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="Your full name"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
            <Mail size={16} className="text-slate-400" />
            <input
              type="email"
              value={form.email || ""}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Phone</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <Phone size={16} className="text-slate-400" />
              <input
                value={form.phone || ""}
                onChange={(e) => onChange({ ...form, phone: e.target.value })}
                className="w-full bg-transparent text-sm focus:outline-none"
                placeholder="08012345678"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">City</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <MapPin size={16} className="text-slate-400" />
              <input
                value={form.city || ""}
                onChange={(e) => onChange({ ...form, city: e.target.value })}
                className="w-full bg-transparent text-sm focus:outline-none"
                placeholder="e.g. Ibadan"
              />
            </div>
          </div>
        </div>

        {saved && (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <CheckCircle2 size={16} /> Profile saved
          </p>
        )}

        <button type="submit" className="btn-primary">
          <Save size={16} /> Save Changes
        </button>
      </form>
    </div>
  );
}
