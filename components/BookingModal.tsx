"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpenCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Laptop,
  MapPin,
  Notebook,
  X,
} from "lucide-react";
import type { AvailabilitySlot, Tutor } from "@/lib/types";

const GRADE_LEVELS = [
  "Primary 1-6",
  "JSS 1-3",
  "SS 1",
  "SS 2",
  "SS 3",
  "Undergraduate",
  "Adult Learner",
];

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BookingModal({
  tutor,
  open,
  onClose,
  initialSlot,
}: {
  tutor: Tutor;
  open: boolean;
  onClose: () => void;
  initialSlot?: Tutor["availability"][number] | null;
}) {
  const [grade, setGrade] = useState(GRADE_LEVELS[2]);
  const [subject, setSubject] = useState(tutor.subjects[0] ?? "");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<AvailabilitySlot | null>(
    initialSlot ?? tutor.availability[0] ?? null
  );
  const [mode, setMode] = useState<"online" | "in_person">(
    tutor.isOnline ? "online" : "in_person"
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // This modal stays mounted while closed, so the `initialSlot` prop (the slot
  // tapped in the tutor's Weekly Availability calendar) is only read by
  // useState on the very first render. Re-sync the selected slot every time
  // the modal opens so the form always reflects the slot the user selected.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: adopt the calendar-selected slot each time the modal opens
      setSlot(initialSlot ?? tutor.availability[0] ?? null);
    }
  }, [open, initialSlot, tutor.availability]);

  if (!open) return null;

  const duration =
    slot != null
      ? (Number(slot.end.split(":")[0]) - Number(slot.start.split(":")[0])) || 1
      : 1;
  const estimate = tutor.hourlyRate * Math.max(duration, 1);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      let studentName = "";
      let studentId = "";
      try {
        const stored = localStorage.getItem("tutorconnect_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          studentName = (parsed.full_name as string) || "";
          studentId = (parsed.id as string) || "";
        }
      } catch {
        // ignore; studentName/studentId will be empty
      }
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: tutor.id,
          tutorName: tutor.fullName,
          studentName: studentName || "Guest Student",
          studentId,
          subject,
          gradeLevel: grade,
          scheduledDate: date,
          startTime: slot?.start,
          endTime: slot?.end,
          sessionMode: mode,
          notes,
          totalPrice: estimate,
        }),
      });
      if (!res.ok) throw new Error("Could not submit booking request");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSuccess(false);
    setError("");
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-soft sm:rounded-3xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-2 text-navy-700">
              <BookOpenCheck size={20} />
              <h3 className="font-display text-lg font-bold">
                Book a Session with {tutor.fullName.split(" ")[0]}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <CheckCircle2 size={52} className="text-emerald-500" />
              <h4 className="font-display text-xl font-bold text-slate-900">
                Request Sent!
              </h4>
              <p className="max-w-xs text-sm text-slate-500">
                Your booking request has been sent to {tutor.fullName}. You
                will be notified as soon as it is accepted.
              </p>
              <button onClick={handleClose} className="btn-primary mt-4">
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Student Grade Level
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                >
                  {GRADE_LEVELS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                >
                  {tutor.subjects.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Calendar size={14} /> Preferred Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Clock size={14} /> Time Slot
                  </label>
                  <select
                    value={slot ? `${slot.day}-${slot.start}` : ""}
                    onChange={(e) => {
                      const found = tutor.availability.find(
                        (a) => `${a.day}-${a.start}` === e.target.value
                      );
                      setSlot(found ?? null);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                  >
                    {tutor.availability.map((a) => (
                      <option key={`${a.day}-${a.start}`} value={`${a.day}-${a.start}`}>
                        {a.day} {a.start}–{a.end}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Learning Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode("online")}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                      mode === "online"
                        ? "border-navy-600 bg-navy-50 text-navy-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Laptop size={16} /> Online
                  </button>
                  <button
                    onClick={() => setMode("in_person")}
                    disabled={tutor.isOnline && tutor.state === "Online"}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      mode === "in_person"
                        ? "border-navy-600 bg-navy-50 text-navy-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <MapPin size={16} /> In-Person
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Notebook size={14} /> Notes for the tutor
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Tell the tutor what you'd like to focus on..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-500">
                  Estimated total
                </span>
                <span className="font-display text-lg font-extrabold text-navy-700">
                  {formatNaira(estimate)}
                </span>
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting || !date || !slot}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Sending Request..." : "Send Booking Request"}
              </button>
              {(!date || !slot) && (
                <p className="text-center text-xs text-slate-400">
                  Select a preferred date and time slot to continue.
                </p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
