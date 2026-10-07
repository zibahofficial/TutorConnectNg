"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  Clock3,
  Laptop,
  MapPin,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import PrivateChat from "@/components/PrivateChat";
import { TUTOR_HEADLINES, TUTOR_STATES, QUALIFICATIONS, TEACHING_MODES, TUTOR_DOCUMENT_TYPES } from "@/lib/tutor-options";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import type { AvailabilitySlot, Booking } from "@/lib/types";

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

/** Headers for /api/bookings calls — attaches the logged-in user's token. */
function bookingAuthHeaders() {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("tutorconnect_token") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  // Weekly availability is loaded from the tutor's own saved slots below.
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [newSlot, setNewSlot] = useState<AvailabilitySlot>({ day: "Mon", start: "09:00", end: "11:00" });


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
    // The API scopes results to the signed-in tutor's own profile server-side.
    fetch("/api/bookings", { headers: bookingAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings ?? []))
      .catch((err) => console.error("Could not load tutor bookings:", err))
      .finally(() => setLoading(false));
  }, []);

  // Credentials & Verification: documents uploaded from the tutor's gallery
  // and their verification application to the admin.
  const [documents, setDocuments] = useState<Array<{ id: string; type: string; name: string; dataUrl: string; uploadedAt: string }>>([]);
  const [verification, setVerification] = useState<{ status: "pending" | "approved" | "declined"; appliedAt: string } | null>(null);
  const [docType, setDocType] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [docError, setDocError] = useState("");
  const [docDone, setDocDone] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  const [applyError, setApplyError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // My Profile: load the tutor's full profile so it can be edited
  const [profileForm, setProfileForm] = useState<{
    fullName: string;
    phone: string;
    city: string;
    state: string;
    headline: string;
    teachingMode: string;
    bio: string;
    yearsExperience: string;
    hourlyRate: string;
    qualification: string;
  }>({
    fullName: "",
    phone: "",
    city: "",
    state: "",
    headline: "",
    teachingMode: "",
    bio: "",
    yearsExperience: "",
    hourlyRate: "",
    qualification: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!authChecked || !authUser) return;
    const token = localStorage.getItem("tutorconnect_token") || "";
    fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action: "get_user" }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u) return;
        setDocuments(Array.isArray(u.documents) ? u.documents : []);
        setVerification(u.verification ?? null);
        setProfileForm({
          fullName: u.full_name || "",
          phone: u.phone || "",
          city: u.city || "",
          state: u.state || "",
          headline: u.headline || "",
          teachingMode: u.teachingMode || "",
          bio: u.bio || "",
          yearsExperience: u.yearsExperience != null ? String(u.yearsExperience) : "",
          hourlyRate: u.hourlyRate != null ? String(u.hourlyRate) : "",
          qualification: u.qualification || "",
        });
      })
      .catch(() => {});
  }, [authChecked, authUser]);

  // Shrink a gallery photo in the browser before uploading so requests stay small.
  function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read that photo."));
      reader.onload = () => {
        const img = document.createElement("img");
        img.onerror = () => reject(new Error("That file is not a valid photo."));
        img.onload = () => {
          const maxSide = 1280;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Could not process that photo."));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadDocument(e: React.FormEvent) {
    e.preventDefault();
    setDocError("");
    // The document type dropdown is compulsory.
    if (!docType) return setDocError("Please select the document type — it is required.");
    if (!docFile) return setDocError("Please choose a photo of the document from your gallery.");
    setDocBusy(true);
    try {
      const dataUrl = await compressImage(docFile);
      const token = localStorage.getItem("tutorconnect_token") || "";
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "add_document", type: docType, name: docFile.name, dataUrl }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.document) throw new Error(data?.error || "Upload failed. Please try again.");
      setDocuments((prev) => [...prev, data.document]);
      setDocType("");
      setDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setDocDone(true);
      setTimeout(() => setDocDone(false), 2500);
    } catch (err) {
      setDocError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setDocBusy(false);
    }
  }

  async function removeDocument(id: string) {
    const token = localStorage.getItem("tutorconnect_token") || "";
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "remove_document", documentId: id }),
      });
      if (res.ok) setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // ignore — list stays as-is if the request fails
    }
  }

  async function applyToAdmin() {
    setApplyError("");
    if (!documents.some((d) => d.type === "Government-issued ID")) {
      return setApplyError("Please upload your government-issued ID before applying.");
    }
    if (!documents.some((d) => d.type === "Academic credential")) {
      return setApplyError("Please upload at least one academic credential before applying.");
    }
    setApplyBusy(true);
    try {
      const token = localStorage.getItem("tutorconnect_token") || "";
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "apply_verification" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.verification) throw new Error(data?.error || "Could not submit your application.");
      setVerification(data.verification);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Could not submit your application.");
    } finally {
      setApplyBusy(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    // Compulsory dropdowns: headline, state and teaching mode must be chosen
    if (!profileForm.headline) return setProfileError("Please select your professional headline.");
    if (!profileForm.state) return setProfileError("Please select your state.");
    if (!profileForm.teachingMode) return setProfileError("Please select your teaching mode.");
    setProfileSaving(true);
    try {
      const token = localStorage.getItem("tutorconnect_token") || "";
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "update_profile",
          updates: {
            fullName: profileForm.fullName,
            phone: profileForm.phone,
            city: profileForm.city,
            state: profileForm.state,
            headline: profileForm.headline,
            teachingMode: profileForm.teachingMode,
            bio: profileForm.bio,
            yearsExperience: profileForm.yearsExperience ? Number(profileForm.yearsExperience) : undefined,
            hourlyRate: profileForm.hourlyRate ? Number(profileForm.hourlyRate) : undefined,
            qualification: profileForm.qualification || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      setProfileError("Could not save your profile. Please try again.");
    } finally {
      setProfileSaving(false);
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
    return { pending, upcoming, completed: completed.length };
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
      headers: bookingAuthHeaders(),
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
      subtitle="Manage booking requests, your weekly availability, and your credentials."
    >
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Clock3} label="Pending Requests" value={String(stats.pending)} accent="amber" />
        <StatCard icon={Calendar} label="Upcoming Sessions" value={String(stats.upcoming)} accent="navy" />
        <StatCard icon={Check} label="Completed Sessions" value={String(stats.completed)} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
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

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="font-display font-bold text-slate-900">My Profile</h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Keep your details up to date — students see these when deciding to book you.
        </p>
        <form onSubmit={saveProfile} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Phone</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
              placeholder="08012345678"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Professional Headline <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={profileForm.headline}
              onChange={(e) => setProfileForm((f) => ({ ...f, headline: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            >
              <option value="">Select your professional headline…</option>
              {TUTOR_HEADLINES.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Teaching Mode <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={profileForm.teachingMode}
              onChange={(e) => setProfileForm((f) => ({ ...f, teachingMode: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            >
              <option value="">Select teaching mode…</option>
              {TEACHING_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              City <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={profileForm.city}
              onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              State <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={profileForm.state}
              onChange={(e) => setProfileForm((f) => ({ ...f, state: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            >
              <option value="">Select your state…</option>
              {TUTOR_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Qualification</label>
            <select
              value={profileForm.qualification}
              onChange={(e) => setProfileForm((f) => ({ ...f, qualification: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            >
              <option value="">Select qualification (optional)…</option>
              {QUALIFICATIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Experience (yrs)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={profileForm.yearsExperience}
                onChange={(e) => setProfileForm((f) => ({ ...f, yearsExperience: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Rate (₦)</label>
              <input
                type="number"
                min={0}
                step={500}
                value={profileForm.hourlyRate}
                onChange={(e) => setProfileForm((f) => ({ ...f, hourlyRate: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Bio</label>
            <textarea
              rows={4}
              maxLength={4000}
              value={profileForm.bio}
              onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Tell students and parents about your teaching style, experience, and results..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            />
          </div>

          {profileError && (
            <p className="text-sm font-semibold text-rose-500 sm:col-span-2">{profileError}</p>
          )}
          {profileSaved && (
            <p className="text-sm font-semibold text-emerald-600 sm:col-span-2">Profile saved successfully.</p>
          )}

          <div className="sm:col-span-2">
            <button type="submit" disabled={profileSaving} className="btn-primary disabled:opacity-60">
              {profileSaving ? "Saving…" : (<><Save size={16} /> Save Profile</>)}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-slate-900">Credentials &amp; Verification</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Upload photos of your credentials from your gallery, then apply for admin verification.
            </p>
          </div>
          {verification?.status === "approved" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck size={13} /> Verified
            </span>
          ) : verification?.status === "pending" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              <ShieldAlert size={13} /> Pending Review
            </span>
          ) : verification?.status === "declined" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600">
              <ShieldAlert size={13} /> Declined
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
              <ShieldAlert size={13} /> Not Submitted
            </span>
          )}
        </div>

        {verification?.status === "pending" && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            Your application is being reviewed by the admin. The outcome will appear here.
          </p>
        )}
        {verification?.status === "approved" && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Your credentials have been approved by the admin — you are a verified tutor!
          </p>
        )}
        {verification?.status === "declined" && (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            Your application was declined. Please review your documents and apply again.
          </p>
        )}

        {documents.length > 0 && (
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((d) => (
              <li key={d.id} className="rounded-xl border border-slate-200 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL preview */}
                <img src={d.dataUrl} alt={d.name} className="h-28 w-full rounded-lg bg-slate-100 object-cover" />
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-700">{d.type}</p>
                    <a href={d.dataUrl} download={d.name} className="block truncate text-[11px] font-semibold text-navy-700 hover:underline">
                      {d.name}
                    </a>
                  </div>
                  {verification?.status !== "pending" && verification?.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => removeDocument(d.id)}
                      className="rounded-lg bg-rose-50 p-1.5 text-rose-500 transition-colors hover:bg-rose-100"
                      aria-label={`Remove ${d.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={uploadDocument} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Document Type <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            >
              <option value="">Select document type…</option>
              {TUTOR_DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.value} ({t.hint})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Photo of the Document <span className="text-rose-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              required
              type="file"
              accept="image/*"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-700 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">Choose a clear photo from your gallery (NIN slip, certificate, etc.).</p>
          </div>
          {docError && <p className="text-sm font-semibold text-rose-500 sm:col-span-2">{docError}</p>}
          {docDone && <p className="text-sm font-semibold text-emerald-600 sm:col-span-2">Document uploaded. Add more, or apply for verification below.</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={docBusy} className="btn-primary disabled:opacity-60">
              {docBusy ? "Uploading…" : (<><Upload size={16} /> Upload Document</>)}
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500">
            To apply you need at least one <span className="font-bold text-slate-700">government-issued ID</span> and one{" "}
            <span className="font-bold text-slate-700">academic credential</span>.
          </p>
          {verification?.status === "approved" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck size={13} /> Approved
            </span>
          ) : (
            <button
              type="button"
              onClick={applyToAdmin}
              disabled={applyBusy || verification?.status === "pending"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
            >
              {verification?.status === "pending" ? (
                (<><ShieldAlert size={16} /> Awaiting Admin Review…</>)
              ) : (
                (<><ShieldCheck size={16} /> Apply to Admin for Verification</>)
              )}
            </button>
          )}
        </div>
        {applyError && <p className="mt-2 text-sm font-semibold text-rose-500">{applyError}</p>}
      </div>

      <div className="mt-6">
        <PrivateChat
          myKey={authUser?.id || ""}
          emptyListHint="Students appear here as soon as they message you. Chats are private between you and the student."
          minThreadHeight="min-h-[340px]"
        />
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
