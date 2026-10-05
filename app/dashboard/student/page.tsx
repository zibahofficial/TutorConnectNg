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
  Home,
  Laptop,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquarePlus,
  Pencil,
  Phone,
  Save,
  Send,
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
import type { Booking, ChatMessage } from "@/lib/types";

type TabId = "overview" | "bookings" | "wishlist" | "certificates" | "chat" | "profile";

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "bookings", label: "My Bookings", icon: BookOpen },
  { id: "wishlist", label: "Saved Tutors", icon: Heart },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "chat", label: "Chat with Tutors", icon: MessageCircle },
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

  const [savedTutorIds, setSavedTutorIds] = useState<string[]>([]);

  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Booking edit / cancel (pending requests only)
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [bookingActionBusy, setBookingActionBusy] = useState(false);

  // Private tutor chat
  const [chatPartners, setChatPartners] = useState<{ key: string; name: string }[]>([]);
  const [activeChat, setActiveChat] = useState<{ key: string; name: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tutorconnect_user");
      if (stored) {
        const parsed = JSON.parse(stored) as StoredUser;
        if (parsed && (parsed.role === "student" || parsed.role === "parent")) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount read of localStorage auth state after hydration
          setUser(parsed);
          setProfileForm(parsed);
        } else if (parsed?.full_name || parsed?.email) {
          router.replace("/");
          return;
        } else {
          router.replace("/login");
          return;
        }
      } else {
        router.replace("/login");
        return;
      }
    } catch {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked || !user) return;
    let stored: string[] = [];
    try { stored = JSON.parse(localStorage.getItem("tutorconnect_saved_tutors") || "[]"); } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate cached saved-tutor ids once after mount
    setSavedTutorIds(stored);
    const token = localStorage.getItem("tutorconnect_token") || "";
    fetch(`/api/auth?action=saved_tutors${token ? `&token=${token}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        const ids: string[] = (data.savedTutors ?? []).map((s: { tutorId: string }) => s.tutorId);
        if (ids.length > 0) {
          setSavedTutorIds(ids);
          try { localStorage.setItem("tutorconnect_saved_tutors", JSON.stringify(ids)); } catch {}
        }
      })
      .catch(() => {});

    fetch(`/api/bookings${user?.id ? `?studentId=${encodeURIComponent(user.id)}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        const all = data.bookings ?? [];
        const userId = user?.id;
        const filtered = userId ? all.filter((b: Booking) => !b.studentId || b.studentId === userId || b.studentId === "demo_student") : all;
        setBookings(filtered);
      })
      .finally(() => setLoading(false));
  }, [authChecked, user]);

  // Chat partners = tutors whose booking with this student has been approved
  // (accepted), plus anyone the student already has a conversation with.
  useEffect(() => {
    if (!authChecked || !user) return;
    const byKey = new Map<string, string>();
    for (const b of bookings) {
      if ((b.status === "accepted" || b.status === "completed") && b.tutorId) {
        byKey.set(b.tutorId, b.tutorName || "Tutor");
      }
    }
    const merge = (extra: { partnerKey: string; partnerName: string }[]) => {
      for (const c of extra) {
        if (!byKey.has(c.partnerKey)) byKey.set(c.partnerKey, c.partnerName || "Tutor");
      }
      const merged = Array.from(byKey, ([key, name]) => ({ key, name }));
      setChatPartners(merged);
      setActiveChat((prev) => (prev && merged.some((p) => p.key === prev.key) ? prev : merged[0] ?? null));
    };
    const token = localStorage.getItem("tutorconnect_token") || "";
    fetch(`/api/messages?conversations=1${token ? `&token=${encodeURIComponent(token)}` : ""}`)
      .then((res) => (res.ok ? res.json() : { conversations: [] }))
      .then((data) => merge(data.conversations ?? []))
      .catch(() => merge([]));
  }, [authChecked, user, bookings]);

  // Load the active chat thread and poll for new messages every 5 seconds.
  useEffect(() => {
    if (!authChecked || !user || !activeChat) return;
    let active = true;
    const token = localStorage.getItem("tutorconnect_token") || "";
    const load = () =>
      fetch(`/api/messages?with=${encodeURIComponent(activeChat.key)}${token ? `&token=${encodeURIComponent(token)}` : ""}`)
        .then((res) => (res.ok ? res.json() : { messages: [] }))
        .then((data) => {
          if (active && Array.isArray(data.messages)) setChatMessages(data.messages);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setChatLoading(false);
        });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- flagging loading state while initiating the thread fetch
    setChatLoading(true);
    load();
    const interval = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [authChecked, user, activeChat]);

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

  async function toggleSavedTutor(id: string) {
    const tutor = TUTORS.find((t) => t.id === id);
    const isSaving = !savedTutorIds.includes(id);
    const newIds = isSaving ? [...savedTutorIds, id] : savedTutorIds.filter((t) => t !== id);
    setSavedTutorIds(newIds);
    try {
      localStorage.setItem("tutorconnect_saved_tutors", JSON.stringify(newIds));
    } catch {
      // ignore
    }
    try {
      const token = localStorage.getItem("tutorconnect_token") || "";
      await fetch("/api/auth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: isSaving ? "save_tutor" : "remove_tutor",
          tutorId: id,
          ...(tutor
            ? {
                tutorName: tutor.fullName,
                tutorAvatar: tutor.avatarUrl,
                tutorHeadline: tutor.headline,
                tutorRate: tutor.hourlyRate,
              }
            : {}),
        }),
      });
    } catch {
      // demo mode fallback
    }
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
          studentId: user?.id || undefined,
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

  async function sendChatMessage() {
    if (!activeChat || !chatInput.trim() || chatSending) return;
    setChatSending(true);
    try {
      const token = localStorage.getItem("tutorconnect_token") || "";
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ to: activeChat.key, body: chatInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setChatMessages((prev) => [...prev, data.message as ChatMessage]);
        setChatInput("");
      }
    } catch {
      // ignore; the next poll re-syncs the thread
    } finally {
      setChatSending(false);
    }
  }

  async function handleCancelBooking() {
    if (!cancelTarget || bookingActionBusy) return;
    const target = cancelTarget;
    setBookingActionBusy(true);
    try {
      await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: target.id, status: "cancelled" }),
      });
    } catch {
      // still update locally; the list re-fetches on next dashboard load
    }
    setBookings((prev) => prev.map((b) => (b.id === target.id ? { ...b, status: "cancelled" as const } : b)));
    setCancelTarget(null);
    setBookingActionBusy(false);
  }

  async function handleSaveBookingEdit(form: EditBookingForm) {
    if (!editTarget || bookingActionBusy) return;
    const target = editTarget;
    setBookingActionBusy(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: target.id, edit: { ...form } }),
      });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === target.id ? { ...b, ...form } : b)));
        setEditTarget(null);
      }
    } catch {
      // ignore; the next poll/load re-syncs
    } finally {
      setBookingActionBusy(false);
    }
  }

  function handleLogout() {
    try {
      localStorage.removeItem("tutorconnect_token");
      localStorage.removeItem("tutorconnect_user");
    } catch {
      // ignore storage errors in strict private modes
    }
    router.replace("/");
  }

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setUser(profileForm);
    try {
      localStorage.setItem("tutorconnect_user", JSON.stringify(profileForm));
    } catch {
      // demo-only persistence; safe to ignore storage errors
    }
    const token = localStorage.getItem("tutorconnect_token") || "";
    fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action: "update_profile", updates: { ...profileForm } }),
    }).catch(() => {});
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
      const token = localStorage.getItem("tutorconnect_token") || "";
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "delete_account" }),
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

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="container-app py-8 lg:py-10">
          {/* Quick navigation bar */}
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-card">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-navy-50 hover:text-navy-700"
            >
              <Home size={14} /> Home
            </Link>
            <Link
              href="/tutors"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-navy-50 hover:text-navy-700"
            >
              <BookOpen size={14} /> Find Tutors
            </Link>
            <button
              onClick={() => setActiveTab("chat")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === "chat" ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-navy-50 hover:text-navy-700"
              }`}
            >
              <MessageCircle size={14} /> Chat
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === "bookings" ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-navy-50 hover:text-navy-700"
              }`}
            >
              <CalendarClock size={14} /> My Bookings
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === "profile" ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-navy-50 hover:text-navy-700"
              }`}
            >
              <User size={14} /> Profile
            </button>
            <span className="ml-auto" />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
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
                    onEdit={setEditTarget}
                    onCancel={setCancelTarget}
                  />
                )}

                {activeTab === "wishlist" && (
                  <WishlistPanel savedTutors={savedTutors} onRemove={toggleSavedTutor} />
                )}

                {activeTab === "certificates" && <CertificatesPanel completed={completedBookings} studentName={displayName} />}

                {activeTab === "chat" && (
                  <ChatPanel
                    partners={chatPartners}
                    active={activeChat}
                    messages={chatMessages}
                    loading={chatLoading}
                    input={chatInput}
                    sending={chatSending}
                    onSelect={setActiveChat}
                    onInputChange={setChatInput}
                    onSend={sendChatMessage}
                    myKey={user?.id || ""}
                  />
                )}

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

      {editTarget && (
        <EditBookingModal
          booking={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveBookingEdit}
          saving={bookingActionBusy}
        />
      )}

      {cancelTarget && (
        <CancelBookingModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelBooking}
          busy={bookingActionBusy}
        />
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
  onEdit,
  onCancel,
}: {
  bookings: Booking[];
  loading: boolean;
  reviewedIds: string[];
  onReview: (b: Booking) => void;
  onEdit: (b: Booking) => void;
  onCancel: (b: Booking) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="font-display font-bold text-slate-900">My Bookings</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Pending requests can be edited or cancelled until the tutor approves them.
          </p>
        </div>
        <Link href="/tutors" className="shrink-0 text-sm font-semibold text-navy-700 hover:text-navy-900">
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

               <div className="flex flex-wrap items-center justify-end gap-2">
                 <span className="font-display font-bold text-navy-700">{formatNaira(b.totalPrice)}</span>
                 <StatusBadge status={b.status} />
                 {b.status === "pending" && (
                   <>
                     <button
                       onClick={() => onEdit(b)}
                       className="inline-flex items-center gap-1 rounded-full border border-navy-200 px-3 py-1.5 text-xs font-bold text-navy-700 transition-colors hover:bg-navy-50"
                     >
                       <Pencil size={13} /> Edit
                     </button>
                     <button
                       onClick={() => onCancel(b)}
                       className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100"
                     >
                       <X size={13} /> Cancel
                     </button>
                   </>
                 )}
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

interface EditBookingForm {
  subject: string;
  gradeLevel: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  sessionMode: "online" | "in_person";
  notes: string;
  totalPrice: number;
}

const EDIT_GRADE_LEVELS = [
  "Primary 1-6",
  "JSS 1-3",
  "SS 1",
  "SS 2",
  "SS 3",
  "Undergraduate",
  "Adult Learner",
];

function hoursBetween(start: string, end: string): number {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  return Math.max((toMinutes(end) - toMinutes(start)) / 60, 0);
}

function EditBookingModal({
  booking,
  onClose,
  onSave,
  saving,
}: {
  booking: Booking;
  onClose: () => void;
  onSave: (form: EditBookingForm) => void;
  saving: boolean;
}) {
  const originalHours = Math.max(hoursBetween(booking.startTime, booking.endTime), 1);
  const ratePerHour = booking.totalPrice / originalHours;

  const [form, setForm] = useState<EditBookingForm>({
    subject: booking.subject,
    gradeLevel: booking.gradeLevel,
    scheduledDate: booking.scheduledDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    sessionMode: booking.sessionMode,
    notes: booking.notes || "",
    totalPrice: booking.totalPrice,
  });

  const newHours = Math.max(hoursBetween(form.startTime, form.endTime), 1);
  const estimate = Math.round(ratePerHour * newHours);
  const invalidTimes = form.endTime <= form.startTime;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (invalidTimes) return;
    onSave({ ...form, totalPrice: estimate });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={() => !saving && onClose()}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-900">Edit Booking Request</h3>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-xs text-slate-400">
          with {booking.tutorName} &middot; still <span className="font-bold text-amber-600">pending</span> (not yet approved)
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Subject</label>
            <input
              type="text"
              required
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={form.scheduledDate}
                onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Grade Level</label>
              <select
                value={form.gradeLevel}
                onChange={(e) => setForm((f) => ({ ...f, gradeLevel: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
              >
                {EDIT_GRADE_LEVELS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Start Time</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">End Time</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
              />
            </div>
          </div>
          {invalidTimes && (
            <p className="text-xs font-semibold text-rose-500">End time must be after start time.</p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Learning Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, sessionMode: "online" }))}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  form.sessionMode === "online"
                    ? "border-navy-600 bg-navy-50 text-navy-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <Laptop size={16} /> Online
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, sessionMode: "in_person" }))}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  form.sessionMode === "in_person"
                    ? "border-navy-600 bg-navy-50 text-navy-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <MapPin size={16} /> In-Person
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Notes for the tutor</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="What should the tutor focus on?"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-500">Estimated total</span>
            <span className="font-display text-lg font-extrabold text-navy-700">{formatNaira(estimate)}</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Discard changes
            </button>
            <button
              type="submit"
              disabled={saving || invalidTimes}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CancelBookingModal({
  booking,
  onClose,
  onConfirm,
  busy,
}: {
  booking: Booking;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-rose-900">Cancel this booking?</h3>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{booking.subject}</span> with {booking.tutorName} on{" "}
          {booking.scheduledDate} ({booking.startTime}–{booking.endTime}) will be cancelled.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Keep booking
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? "Cancelling…" : "Yes, cancel it"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({
  partners,
  active,
  messages,
  loading,
  input,
  sending,
  onSelect,
  onInputChange,
  onSend,
  myKey,
}: {
  partners: { key: string; name: string }[];
  active: { key: string; name: string } | null;
  messages: ChatMessage[];
  loading: boolean;
  input: string;
  sending: boolean;
  onSelect: (p: { key: string; name: string }) => void;
  onInputChange: (v: string) => void;
  onSend: () => void;
  myKey: string;
}) {
  if (partners.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-display font-bold text-slate-900">Chat with Tutors</h2>
        </div>
        <div className="px-6 py-6">
          <EmptyState
            icon={MessageCircle}
            title="No chats yet"
            description="Your private chat with a tutor opens here as soon as they accept your booking request."
          />
          <div className="mt-2 text-center">
            <Link href="/tutors" className="btn-primary !px-6 !py-2.5 text-sm">
              Browse Tutors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
        <h2 className="font-display font-bold text-slate-900">Chat with Tutors</h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <Lock size={13} /> Private — only you and the tutor can see these messages
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr]">
        {/* Partner list (hidden on mobile while a thread is open) */}
        <div className={`border-slate-100 p-3 sm:border-r ${active ? "hidden sm:block" : "block"}`}>
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Approved tutors</p>
          <div className="space-y-1">
            {partners.map((p) => (
              <button
                key={p.key}
                onClick={() => onSelect(p)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  active?.key === p.key ? "bg-navy-50 text-navy-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-600 text-xs font-bold text-white">
                  {p.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                </span>
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className={`flex min-h-[380px] flex-col ${active ? "flex" : "hidden sm:flex"}`}>
          {active ? (
            <>
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-600 text-xs font-bold text-white">
                  {active.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{active.name}</p>
                  <p className="text-[11px] text-slate-400">Messages refresh automatically</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loading ? (
                  <p className="py-10 text-center text-sm text-slate-400">Loading conversation…</p>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    No messages yet — say hello to {active.name.split(" ")[0]} to plan your session.
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderKey === myKey;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            mine ? "rounded-br-md bg-navy-700 text-white" : "rounded-bl-md bg-slate-100 text-slate-800"
                          }`}
                        >
                          <p>{m.body}</p>
                          <p className={`mt-1 text-[10px] ${mine ? "text-navy-200" : "text-slate-400"}`}>
                            {mine ? "You" : m.senderName} ·{" "}
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-100 p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    placeholder={`Message ${active.name.split(" ")[0]}…`}
                    className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={sending || !input.trim()}
                    className="btn-primary !rounded-full !px-4 !py-2.5 disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {sending ? "…" : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">Select a tutor to start chatting.</p>
          )}
        </div>
      </div>
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
