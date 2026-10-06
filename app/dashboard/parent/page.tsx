"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  Clock3,
  Edit3,
  Home,
  Laptop,
  LayoutGrid,
  LogOut,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  User,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PrivateChat from "@/components/PrivateChat";
import Footer from "@/components/Footer";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import type { Booking } from "@/lib/types";
import type { Child } from "@/lib/auth-store";

type TabId = "overview" | "children" | "bookings" | "chat" | "profile";

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "children", label: "My Children", icon: UserCheck },
  { id: "bookings", label: "Bookings", icon: BookOpen },
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
  avatarUrl?: string;
  headline?: string;
}

const GRADE_LEVELS = [
  "Primary 1-3",
  "Primary 4-6",
  "JSS 1-3",
  "SS 1",
  "SS 2",
  "SS 3",
  "Undergraduate",
  "Adult Learner",
];

/** Headers for /api/bookings calls — attaches the logged-in user's token. */
function bookingAuthHeaders() {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("tutorconnect_token") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function ParentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Switch tab and smoothly scroll the user down to the content.
  function goToTab(tab: TabId) {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profileForm, setProfileForm] = useState<StoredUser>({});
  const [profileSaved, setProfileSaved] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [childForm, setChildForm] = useState<{ name: string; age: string; educationLevel: string }>({ name: "", age: "", educationLevel: "" });
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [showChildForm, setShowChildForm] = useState(false);
  const [childActionLoading, setChildActionLoading] = useState(false);
  const [childError, setChildError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Booking edit / cancel / delete (parents can fix their own mistakes)
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [bookingActionBusy, setBookingActionBusy] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tutorconnect_user");
      if (stored) {
        const parsed = JSON.parse(stored) as StoredUser;
        if (parsed && parsed.role === "parent") {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount read of localStorage auth state after hydration
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
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("tutorconnect_token") || "";
    fetch(`/api/auth?action=children${token ? `&token=${token}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        const fetchedChildren: Child[] = (data.children ?? []).map((c: { id: string; child_name: string; child_age: number; educational_level: string }) => ({
          id: c.id,
          name: c.child_name,
          age: c.child_age,
          educationLevel: c.educational_level,
        }));
        setChildren(fetchedChildren);
      })
      .catch(() => {})
      .finally(() => setChildrenLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/bookings${user.id ? `?studentId=${encodeURIComponent(user.id)}` : ""}`, { headers: bookingAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        const all: Booking[] = data.bookings ?? [];
        const userId = user?.id;
        const filtered = userId
          ? all.filter((b) => !b.studentId || b.studentId === userId || b.studentId === "demo_student")
          : all;
        setBookings(filtered);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const upcoming = bookings.filter((b) => b.status === "accepted").length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const totalSpent = bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + b.totalPrice, 0);
    return { totalBookings, upcoming, pending, totalSpent };
  }, [bookings]);

  const upcomingBookings = bookings.filter((b) => b.status === "accepted" || b.status === "pending");

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setUser(profileForm);
    try {
      localStorage.setItem("tutorconnect_user", JSON.stringify(profileForm));
    } catch {}
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

  async function handleAddChild() {
    setChildError("");
    if (!childForm.name.trim()) {
      setChildError("Child name is required.");
      return;
    }
    if (!childForm.age || Number(childForm.age) < 1 || Number(childForm.age) > 100) {
      setChildError("Please enter a valid age (1-100).");
      return;
    }
    if (!childForm.educationLevel) {
      setChildError("Please select an education level.");
      return;
    }
    setChildActionLoading(true);
    const token = localStorage.getItem("tutorconnect_token") || "";
    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "add_child",
          ...childForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add child");
      const newChild: Child = data.child;
      setChildren((prev) => [...prev, newChild]);
      setChildForm({ name: "", age: "", educationLevel: "" });
      setShowChildForm(false);
    } catch {
      setChildError("Something went wrong. Please try again.");
    } finally {
      setChildActionLoading(false);
    }
  }

  async function handleUpdateChild() {
    if (!editingChild) return;
    setChildError("");
    setChildActionLoading(true);
    const token = localStorage.getItem("tutorconnect_token") || "";
    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "update_child",
          childId: editingChild.id,
          name: editingChild.name,
          age: editingChild.age,
          educationLevel: editingChild.educationLevel,
        }),
      });
      if (!res.ok) throw new Error("Could not update child");
      setChildren((prev) =>
        prev.map((c) => (c.id === editingChild.id ? { ...editingChild } : c))
      );
      setEditingChild(null);
      setShowChildForm(false);
    } catch {
      setChildError("Something went wrong. Please try again.");
    } finally {
      setChildActionLoading(false);
    }
  }

  async function handleDeleteChild(id: string) {
    setChildActionLoading(true);
    const token = localStorage.getItem("tutorconnect_token") || "";
    try {
      const res = await fetch("/api/auth", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "delete_child", childId: id }),
      });
      if (!res.ok) throw new Error("Could not delete child");
      setChildren((prev) => prev.filter((c) => c.id !== id));
    } catch {}
    setChildActionLoading(false);
  }

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
        body: JSON.stringify({ action: "delete_account", email: user.email, password: "delete" }),
      });
      if (!res.ok) throw new Error("Could not delete account");
    } catch {}
    localStorage.removeItem("tutorconnect_token");
    localStorage.removeItem("tutorconnect_user");
    setShowDeleteConfirm(false);
    router.replace("/");
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

  async function handleCancelBooking() {
    if (!cancelTarget || bookingActionBusy) return;
    const target = cancelTarget;
    setBookingActionBusy(true);
    try {
      await fetch("/api/bookings", {
        method: "PATCH",
        headers: bookingAuthHeaders(),
        body: JSON.stringify({ id: target.id, status: "cancelled" }),
      });
    } catch {
      // still update locally; the list re-fetches on next dashboard load
    }
    setBookings((prev) => prev.map((b) => (b.id === target.id ? { ...b, status: "cancelled" as const } : b)));
    setCancelTarget(null);
    setBookingActionBusy(false);
  }

  async function handleDeleteBooking() {
    if (!deleteTarget || bookingActionBusy) return;
    const target = deleteTarget;
    setBookingActionBusy(true);
    try {
      await fetch("/api/bookings", {
        method: "DELETE",
        headers: bookingAuthHeaders(),
        body: JSON.stringify({ id: target.id }),
      });
    } catch {
      // still update locally; the list re-fetches on next dashboard load
    }
    setBookings((prev) => prev.filter((b) => b.id !== target.id));
    setDeleteTarget(null);
    setBookingActionBusy(false);
  }

  async function handleSaveBookingEdit(form: EditBookingForm) {
    if (!editTarget || bookingActionBusy) return;
    const target = editTarget;
    setBookingActionBusy(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: bookingAuthHeaders(),
        body: JSON.stringify({ id: target.id, edit: { ...form } }),
      });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === target.id ? { ...b, ...form } : b)));
        setEditTarget(null);
      }
    } catch {
      // ignore; the next load re-syncs
    } finally {
      setBookingActionBusy(false);
    }
  }

  const displayName = user?.full_name || "Parent";
  const displayEmail = user?.email || "parent@tutorconnect.ng";
  const displayAvatar = user?.avatarUrl || "";

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
              onClick={() => goToTab("children")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === "children" ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-navy-50 hover:text-navy-700"
              }`}
            >
              <UserCheck size={14} /> My Children
            </button>
            <button
              onClick={() => goToTab("bookings")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === "bookings" ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-navy-50 hover:text-navy-700"
              }`}
            >
              <Calendar size={14} /> My Bookings
            </button>
            <button
              onClick={() => goToTab("chat")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === "chat" ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-navy-50 hover:text-navy-700"
              }`}
            >
              <MessageCircle size={14} /> Chat
            </button>
            <button
              onClick={() => goToTab("profile")}
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
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-600 font-display text-lg font-extrabold text-white">
                  {displayAvatar ? (
                    <Image src={displayAvatar} alt={displayName} fill sizes="64px" className="object-cover" />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
                <h2 className="mt-3 truncate font-display text-base font-bold text-slate-900">
                  {displayName}
                </h2>
                <p className="truncate text-xs text-slate-500">{displayEmail}</p>
                <span className="mt-2 inline-block rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-700">
                  Parent Account
                </span>
              </div>

              <nav className="mt-4 space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
                {NAV_ITEMS.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => goToTab(item.id)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                        active ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <item.icon size={16} /> {item.label}
                    </button>
                  );
                })}
              </nav>

              <Link href="/tutors" className="btn-primary mt-4 w-full justify-center">
                Find a Tutor
              </Link>
            </aside>

            <div>
              <span className="inline-flex items-center rounded-full bg-navy-50 px-4 py-1.5 text-xs font-semibold text-navy-700">
                Parent Hub
              </span>
              <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Manage your children&apos;s tutoring
              </h1>
              <p className="mt-1 text-slate-500">
                Welcome back, {displayName.split(" ")[0]}. Track bookings, manage children, and more.
              </p>

              {/* Quick stats */}
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard icon={BookOpen} label="Total Bookings" value={String(stats.totalBookings)} accent="navy" live />
                <StatCard icon={CalendarDays} label="Upcoming Sessions" value={String(stats.upcoming)} accent="emerald" live />
                <StatCard icon={Clock3} label="Pending Requests" value={String(stats.pending)} accent="amber" live />
                <StatCard icon={Wallet} label="Total Spent" value={stats.totalSpent > 0 ? formatNaira(stats.totalSpent) : "—"} accent="rose" live />
              </div>

              {/* Tab content */}
              <div ref={contentRef} className="scroll-mt-24">
              {/* Overview */}
              {activeTab === "overview" && (
                <div className="mt-6 space-y-6">
                  <UpcomingBookingsPanel bookings={upcomingBookings} loading={loading} />
                </div>
              )}

              {/* Children */}
              {activeTab === "children" && (
                <ChildrenPanel
                  items={children}
                  loading={childrenLoading}
                  showForm={showChildForm}
                  onToggleForm={() => setShowChildForm(!showChildForm)}
                  childForm={childForm}
                  onChangeChildForm={setChildForm}
                  onAddChild={handleAddChild}
                  editingChild={editingChild}
                  onEditChild={setEditingChild}
                  onUpdateChild={handleUpdateChild}
                  onDeleteChild={handleDeleteChild}
                  childActionLoading={childActionLoading}
                  childError={childError}
                  setShowChildForm={setShowChildForm}
                  setEditingChild={setEditingChild}
                />
              )}

              {/* Bookings */}
              {activeTab === "bookings" && (
                <BookingsPanel
                  bookings={bookings}
                  loading={loading}
                  onEdit={setEditTarget}
                  onCancel={setCancelTarget}
                  onDelete={setDeleteTarget}
                />
              )}

              {/* Chat */}
              {activeTab === "chat" && (
                <PrivateChat
                  myKey={user?.id || ""}
                  pickerFetchAction="list_chat_tutors"
                  pickerLabel="＋ Chat a tutor"
                  emptyListHint="No conversations yet — pick a tutor above to start a private chat about your child's sessions."
                />
              )}

              {/* Profile */}
              {activeTab === "profile" && (
                <ProfilePanel
                  profileForm={profileForm}
                  onChangeProfile={setProfileForm}
                  onSave={saveProfile}
                  saved={profileSaved}
                />
              )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

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

      {deleteTarget && (
        <DeleteBookingModal
          booking={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteBooking}
          busy={bookingActionBusy}
        />
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
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
    </>
  );
}

function ChildrenPanel({
  items,
  loading,
  showForm,
  onToggleForm,
  childForm,
  onChangeChildForm,
  onAddChild,
  editingChild,
  onEditChild,
  onUpdateChild,
  onDeleteChild,
  childActionLoading,
  childError,
  setShowChildForm,
  setEditingChild,
}: {
  items: Child[];
  loading: boolean;
  showForm: boolean;
  onToggleForm: () => void;
  childForm: { name: string; age: string; educationLevel: string };
  onChangeChildForm: React.Dispatch<React.SetStateAction<{ name: string; age: string; educationLevel: string }>>;
  onAddChild: () => void;
  editingChild: Child | null;
  onEditChild: React.Dispatch<React.SetStateAction<Child | null>>;
  onUpdateChild: () => void;
  onDeleteChild: (id: string) => void;
  childActionLoading: boolean;
  childError: string;
  setShowChildForm: (v: boolean) => void;
  setEditingChild: React.Dispatch<React.SetStateAction<Child | null>>;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-slate-900">My Children</h2>
          {!showForm && (
            <button
              onClick={onToggleForm}
              className="inline-flex items-center gap-1.5 rounded-full bg-navy-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-800"
            >
              <Plus size={14} /> Add Child
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            {editingChild ? "Edit" : "Add"} Child
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Name</label>
              <input
                type="text"
                value={childForm.name}
                onChange={(e) => onChangeChildForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-navy-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Age</label>
              <input
                type="number"
                value={childForm.age}
                onChange={(e) => onChangeChildForm((p) => ({ ...p, age: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-navy-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Education Level</label>
              <select
                value={childForm.educationLevel}
                onChange={(e) => onChangeChildForm((p) => ({ ...p, educationLevel: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-navy-600 focus:outline-none"
              >
                <option value="">Select Level</option>
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          {childError && <p className="mt-2 text-xs text-red-600">{childError}</p>}
          <div className="mt-4 flex gap-2">
            <button
              onClick={editingChild ? onUpdateChild : onAddChild}
              disabled={childActionLoading}
              className="btn-primary text-sm !py-2"
            >
              {childActionLoading ? "Saving…" : editingChild ? "Update Child" : "Add Child"}
            </button>
            <button
              onClick={() => { setShowChildForm(false); setEditingChild(null); onChangeChildForm({ name: "", age: "", educationLevel: "" }); }}
              className="btn-outline text-sm !py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-slate-400">Loading children…</p>
      ) : items.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <UserCheck size={40} className="mx-auto mb-2 text-slate-200" />
          <p className="text-sm text-slate-500">No children added yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((child) => (
            <li key={child.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 font-display text-sm font-bold text-navy-700">
                  {getInitials(child.name)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{child.name}</p>
                  <p className="text-xs text-slate-500">Age: {child.age} · {child.educationLevel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onEditChild(child);
                    onChangeChildForm({ name: child.name, age: String(child.age), educationLevel: child.educationLevel });
                    setShowChildForm(true);
                  }}
                  className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-700"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => onDeleteChild(child.id)}
                  className="rounded-full p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UpcomingBookingsPanel({
  bookings,
  loading,
}: {
  bookings: Booking[];
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-display font-bold text-slate-900">Upcoming Sessions</h2>
      </div>
      {loading ? (
        <p className="px-6 py-8 text-center text-sm text-slate-400">Loading…</p>
      ) : bookings.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <BookOpen size={40} className="mx-auto mb-2 text-slate-200" />
          <p className="text-sm text-slate-500">No upcoming sessions.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-100 font-display text-sm font-bold text-navy-700">
                  {getInitials(b.tutorName)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {b.subject} <span className="font-normal text-slate-400">— {b.tutorName}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={13} /> {b.scheduledDate} · {b.startTime}–{b.endTime}</span>
                    <span className="flex items-center gap-1">
                      {b.sessionMode === "online" ? <Laptop size={13} /> : <MapPin size={13} />}
                      {b.sessionMode === "online" ? "Online" : "In-Person"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-navy-700">{formatNaira(b.totalPrice)}</span>
                <StatusBadge status={b.status} />
              </div>
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
  onEdit,
  onCancel,
  onDelete,
}: {
  bookings: Booking[];
  loading: boolean;
  onEdit: (b: Booking) => void;
  onCancel: (b: Booking) => void;
  onDelete: (b: Booking) => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-display font-bold text-slate-900">All Bookings</h2>
        <p className="mt-0.5 text-xs text-slate-400">
          You can edit or cancel a request while it is still pending, and delete any booking.
        </p>
      </div>
      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-slate-400">Loading bookings…</p>
      ) : bookings.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <BookOpen size={40} className="mx-auto mb-2 text-slate-200" />
          <p className="text-sm text-slate-500">No bookings yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {b.subject} <span className="font-normal text-slate-400">— {b.tutorName}</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{b.scheduledDate} · {b.startTime}–{b.endTime}</span>
                  <span className="flex items-center gap-1">
                    {b.sessionMode === "online" ? <Laptop size={13} /> : <MapPin size={13} />}
                    {b.sessionMode === "online" ? "Online" : "In-Person"}
                  </span>
                  <span>Grade: {b.gradeLevel}</span>
                  {b.sessionMode === "online" && b.meetingLink && b.status === "accepted" && (
                    <a
                      href={b.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Laptop size={14} /> Join Online Session
                    </a>
                  )}
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
                      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-100"
                    >
                      <X size={13} /> Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => onDelete(b)}
                  className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100"
                  title="Delete this booking"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
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

const EDIT_GRADE_LEVELS = ["Primary 1-6", "JSS 1-3", "SS 1", "SS 2", "SS 3", "Undergraduate", "Adult Learner"];

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
          {invalidTimes && <p className="text-xs font-semibold text-rose-500">End time must be after start time.</p>}

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
            <button type="submit" disabled={saving || invalidTimes} className="btn-primary flex-1 disabled:opacity-60">
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
        <h3 className="font-display text-lg font-bold text-amber-700">Cancel this booking?</h3>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{booking.subject}</span> with {booking.tutorName} on{" "}
          {booking.scheduledDate} ({booking.startTime}–{booking.endTime}) will be marked as cancelled.
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
            className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {busy ? "Cancelling…" : "Yes, cancel it"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteBookingModal({
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
        <h3 className="font-display text-lg font-bold text-rose-900">Delete this booking?</h3>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{booking.subject}</span> with {booking.tutorName} on{" "}
          {booking.scheduledDate} will be permanently removed from your bookings.
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
            {busy ? "Deleting…" : "Yes, delete it"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfilePanel({
  profileForm,
  onChangeProfile,
  onSave,
  saved,
}: {
  profileForm: StoredUser;
  onChangeProfile: React.Dispatch<React.SetStateAction<StoredUser>>;
  onSave: (e: React.FormEvent) => void;
  saved: boolean;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-display font-bold text-slate-900">Profile Settings</h2>
      </div>
      <form onSubmit={onSave} className="divide-y divide-slate-100">
        <div className="px-6 py-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                value={profileForm.full_name || ""}
                onChange={(e) => onChangeProfile((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={profileForm.email || ""}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
              <input
                type="tel"
                value={profileForm.phone || ""}
                onChange={(e) => onChangeProfile((p) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
              />
            </div>
            {profileForm.role === "tutor" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Headline</label>
                <input
                  type="text"
                  value={profileForm.headline || ""}
                  onChange={(e) => onChangeProfile((p) => ({ ...p, headline: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Location</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
              <input
                type="text"
                value={profileForm.city || ""}
                onChange={(e) => onChangeProfile((p) => ({ ...p, city: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">State</label>
              <input
                type="text"
                value={profileForm.state || ""}
                onChange={(e) => onChangeProfile((p) => ({ ...p, state: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-5">
          <p className="text-sm text-slate-500">
            Profile pictures and avatar uploads are managed via your account settings.
          </p>
          <button type="submit" className="btn-primary">
            {saved ? "Saved!" : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
