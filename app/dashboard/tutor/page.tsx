"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  Clock3,
  Laptop,
  Lock,
  MapPin,

  Plus,
  Send,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { getTutorById } from "@/lib/mock-data";
import type { AvailabilitySlot, Booking, ChatMessage } from "@/lib/types";

const DEMO_TUTOR_ID = "t1";
const DAYS: AvailabilitySlot["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function TutorDashboard() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tutorconnect_user");
      if (!raw) {
        router.replace("/login");
        return;
      }
      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed.role !== "tutor") {
        router.replace("/");
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount read of localStorage auth state after hydration
      setAuthUser(parsed);
    } catch {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  const tutor = getTutorById(DEMO_TUTOR_ID)!;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(tutor.availability);
  const [newSlot, setNewSlot] = useState<AvailabilitySlot>({ day: "Mon", start: "09:00", end: "11:00" });

  // Student chat (private, per student — unlocks once a booking is accepted)
  const [chatPartners, setChatPartners] = useState<{ key: string; name: string }[]>([]);
  const [activeChat, setActiveChat] = useState<{ key: string; name: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  async function handleDeleteAccount() {
    if (!authUser?.email) return;
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

  useEffect(() => {
    fetch(`/api/bookings?tutorId=${DEMO_TUTOR_ID}`)
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Chat partners = students with accepted (approved) bookings, plus anyone
  // who has already started a conversation.
  useEffect(() => {
    if (!authChecked || !authUser) return;
    const byKey = new Map<string, string>();
    for (const b of bookings) {
      if ((b.status === "accepted" || b.status === "completed") && b.studentId) {
        byKey.set(b.studentId, b.studentName || "Student");
      }
    }
    const merge = (extra: { partnerKey: string; partnerName: string }[]) => {
      for (const c of extra) {
        if (!byKey.has(c.partnerKey)) byKey.set(c.partnerKey, c.partnerName || "Student");
      }
      const merged = Array.from(byKey, ([key, name]) => ({ key, name }));
      setChatPartners(merged);
      setActiveChat((prev) => (prev && merged.some((p) => p.key === prev.key) ? prev : merged[0] ?? null));
    };
    const token = localStorage.getItem("tutorconnect_token") || "";
    fetch(`/api/messages?conversations=1&as=${DEMO_TUTOR_ID}${token ? `&token=${encodeURIComponent(token)}` : ""}`)
      .then((res) => (res.ok ? res.json() : { conversations: [] }))
      .then((data) => merge(data.conversations ?? []))
      .catch(() => merge([]));
  }, [authChecked, authUser, bookings]);

  // Load the active thread and poll for new messages every 5 seconds.
  useEffect(() => {
    if (!authChecked || !authUser || !activeChat) return;
    let active = true;
    const token = localStorage.getItem("tutorconnect_token") || "";
    const load = () =>
      fetch(`/api/messages?with=${encodeURIComponent(activeChat.key)}&as=${DEMO_TUTOR_ID}${token ? `&token=${encodeURIComponent(token)}` : ""}`)
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
  }, [authChecked, authUser, activeChat]);

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
        body: JSON.stringify({ from: DEMO_TUTOR_ID, to: activeChat.key, body: chatInput.trim() }),
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

  // Load the logged-in tutor's saved weekly availability (falls back to the
  // in-memory store in demo mode).
  useEffect(() => {
    if (!authChecked || !authUser) return;
    const token = localStorage.getItem("tutorconnect_token") || "";
    fetch(`/api/auth?action=availability${token ? `&token=${token}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.availability)) {
          setAvailability(data.availability);
        }
      })
      .catch(() => {});
  }, [authChecked, authUser]);

  const stats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "pending").length;
    const upcoming = bookings.filter((b) => b.status === "accepted").length;
    const completed = bookings.filter((b) => b.status === "completed");
    const earnings = completed.reduce((sum, b) => sum + b.totalPrice, 0);
    return { pending, upcoming, completed: completed.length, earnings };
  }, [bookings]);

  async function updateStatus(
  id: string,
  status: Booking["status"],
  booking?: Booking
) {
  let meetingLink: string | undefined;

  if (status === "accepted" && booking?.sessionMode === "online") {
    meetingLink = window.prompt(
      "Paste the Zoom or Google Meet link for this session:"
    )?.trim();

    if (!meetingLink) {
      return;
    }
  }

  setBookings((prev) =>
    prev.map((b) =>
      b.id === id
        ? { ...b, status, ...(meetingLink ? { meetingLink } : {}) }
        : b
    )
  );

  try {
    await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, meetingLink }),
    });
  } catch {
    // optimistic UI already applied; silently ignore demo network errors
  }
}
  async function addSlot() {
    if (newSlot.end <= newSlot.start) return;
    const token = localStorage.getItem("tutorconnect_token") || "";
    setAvailability((prev) => [...prev, newSlot]);
    try {
      await fetch("/api/auth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "add_availability", day: newSlot.day, start: newSlot.start, end: newSlot.end }),
      });
    } catch {
      // demo mode fallback
    }
  }

  async function removeSlot(day: string, start: string) {
    const token = localStorage.getItem("tutorconnect_token") || "";
    setAvailability((prev) =>
      prev.filter((s) => !(s.day === day && s.start === start))
    );
    try {
      await fetch("/api/auth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "delete_availability", day, start }),
      });
    } catch {
      // demo mode fallback
    }
  }


  const pendingRequests = bookings.filter((b) => b.status === "pending");
  const otherBookings = bookings.filter((b) => b.status !== "pending");

  if (!authChecked || !authUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-400">Checking authentication…</p>
      </div>
    );
  }

  return (
    <>
    <DashboardShell
      title={`Welcome back, ${(authUser?.full_name ?? "Tutor").split(" ")[0]}`}
      subtitle="Manage booking requests, your weekly availability, and track your earnings."
    >
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock3} label="Pending Requests" value={String(stats.pending)} accent="amber" />
        <StatCard icon={Calendar} label="Upcoming Sessions" value={String(stats.upcoming)} accent="navy" />
        <StatCard icon={Check} label="Completed Sessions" value={String(stats.completed)} accent="emerald" />
        <StatCard icon={Wallet} label="Total Earnings" value={formatNaira(stats.earnings)} accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-display font-bold text-slate-900">
                Pending Requests ({pendingRequests.length})
              </h2>
            </div>
            {loading ? (
              <p className="px-6 py-10 text-center text-sm text-slate-400">Loading requests...</p>
            ) : pendingRequests.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-400">No pending requests right now.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingRequests.map((b) => (
                  <li key={b.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {b.subject} <span className="font-normal text-slate-400">— {b.studentName}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{b.scheduledDate} · {b.startTime}–{b.endTime}</span>
                        <span className="flex items-center gap-1">
                          {b.sessionMode === "online" ? <Laptop size={13} /> : <MapPin size={13} />}
                          {b.sessionMode === "online" ? "Online" : "In-Person"}
                        </span>
                        <span>Grade: {b.gradeLevel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-navy-700">{formatNaira(b.totalPrice)}</span>
                      <button
                        onClick={() => updateStatus (b.id, "accepted", b)}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "rejected")}
                        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-display font-bold text-slate-900">Session History</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {otherBookings.map((b) => (
                <li key={b.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {b.subject} <span className="font-normal text-slate-400">— {b.studentName}</span>
                    </p>
                    <p className="text-xs text-slate-500">{b.scheduledDate} · {b.startTime}–{b.endTime}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700">{formatNaira(b.totalPrice)}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Availability editor */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-display font-bold text-slate-900">Weekly Availability</h2>
          <div className="space-y-2">
            {availability.map((slot) => (
              <div key={`${slot.day}-${slot.start}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                <span className="text-sm font-semibold text-slate-700">{slot.day}</span>
                <span className="text-sm text-slate-500">{slot.start} – {slot.end}</span>
                <button onClick={() => removeSlot(slot.day, slot.start)} className="text-slate-400 hover:text-rose-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {availability.length === 0 && (
              <p className="text-center text-sm text-slate-400">No availability set yet.</p>
            )}
          </div>

          <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Add a time slot</p>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={newSlot.day}
                onChange={(e) => setNewSlot((s) => ({ ...s, day: e.target.value as AvailabilitySlot["day"] }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:border-navy-600 focus:outline-none"
              >
                {DAYS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <input
                type="time"
                value={newSlot.start}
                onChange={(e) => setNewSlot((s) => ({ ...s, start: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:border-navy-600 focus:outline-none"
              />
              <input
                type="time"
                value={newSlot.end}
                onChange={(e) => setNewSlot((s) => ({ ...s, end: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:border-navy-600 focus:outline-none"
              />
            </div>
            <button
              onClick={addSlot}
              disabled={newSlot.end <= newSlot.start}
              className="btn-outline w-full !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} /> Add Slot
            </button>
            {newSlot.end <= newSlot.start && (
              <p className="text-center text-xs text-rose-500">End time must be after start time.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
          <h2 className="font-display font-bold text-slate-900">Student Messages</h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <Lock size={13} /> Private — only you and the student can see these messages
          </span>
        </div>
        {chatPartners.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">
            No student chats yet — conversations open here once you accept a booking request.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr]">
            <div className="border-slate-100 p-3 sm:border-r">
              <div className="space-y-1">
                {chatPartners.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setActiveChat(p)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                      activeChat?.key === p.key ? "bg-navy-50 text-navy-700" : "text-slate-600 hover:bg-slate-100"
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
            <div className="flex min-h-[320px] flex-col">
              {activeChat ? (
                <>
                  <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-600 text-xs font-bold text-white">
                      {activeChat.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{activeChat.name}</p>
                      <p className="text-[11px] text-slate-400">Messages refresh automatically</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {chatLoading ? (
                      <p className="py-10 text-center text-sm text-slate-400">Loading conversation…</p>
                    ) : chatMessages.length === 0 ? (
                      <p className="py-10 text-center text-sm text-slate-400">No messages yet.</p>
                    ) : (
                      chatMessages.map((m) => {
                        const mine = m.senderKey === DEMO_TUTOR_ID;
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
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage();
                          }
                        }}
                        placeholder="Reply to student…"
                        className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={sendChatMessage}
                        disabled={chatSending || !chatInput.trim()}
                        className="btn-primary !rounded-full !px-4 !py-2.5 disabled:opacity-50"
                        aria-label="Send message"
                      >
                        {chatSending ? "…" : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="py-10 text-center text-sm text-slate-400">Select a student to view the conversation.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-card">
        <h3 className="font-display text-lg font-bold text-rose-900">Delete Account</h3>
        <p className="mt-1 text-sm text-slate-600">
          This will permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700"
        >
          <Trash2 size={15} /> Delete My Account
        </button>
      </div>
    </DashboardShell>

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
    </>
  );
}
