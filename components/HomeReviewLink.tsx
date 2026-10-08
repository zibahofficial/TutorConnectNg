"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, Star, X } from "lucide-react";
import type { Booking } from "@/lib/types";

/**
 * Homepage "Write a Review" button.
 * ---------------------------------------------------------------------------
 * Opens an on-page modal instead of sending people off to a dashboard.
 *
 * Who may review is decided by the existing `/api/reviews` route — this
 * component only mirrors those rules in the UI so the user is not shown a
 * submit button that the server is going to refuse:
 *
 *   student / parent -> pick one of their own COMPLETED, not-yet-reviewed
 *                       bookings, then POST { bookingId, rating, comment }
 *   admin            -> pick an approved tutor, then POST { tutorId, rating, comment }
 *   tutor            -> told plainly that tutors cannot submit reviews
 *   logged out       -> shown Log In / Sign Up links, never silently redirected
 *
 * `studentId` / `tutorId` are deliberately NOT sent for student and parent
 * reviews: the API derives both from the bearer token and the booking row.
 */

type StoredUser = { id?: string; role?: string; full_name?: string };
type TutorOption = { id: string; fullName: string };

function readStoredUser(): { user: StoredUser | null; token: string } {
  try {
    const raw = localStorage.getItem("tutorconnect_user");
    const token = localStorage.getItem("tutorconnect_token") || "";
    return { user: raw ? (JSON.parse(raw) as StoredUser) : null, token };
  } catch {
    // Unavailable/!corrupt storage (strict private modes) reads as logged out.
    return { user: null, token: "" };
  }
}

export default function HomeReviewLink() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Session, resolved when the modal opens (never during render, so the
  // server-rendered homepage and the first client render stay identical).
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tutors, setTutors] = useState<TutorOption[]>([]);

  const [selectedId, setSelectedId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const role = user?.role ?? null;
  const isStudentOrParent = role === "student" || role === "parent";
  const isAdmin = role === "admin";
  const isTutor = role === "tutor";

  const authHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  function resetForm() {
    setSelectedId("");
    setRating(5);
    setComment("");
    setSubmitError("");
    setDone(false);
  }

  function closeModal() {
    if (submitting) return; // never close mid-save
    setOpen(false);
    resetForm();
  }

  function openModal() {
    const session = readStoredUser();
    setUser(session.user);
    setToken(session.token);
    resetForm();
    setBookings([]);
    setTutors([]);
    setLoadError("");
    setOpen(true);
  }

  // Close on Escape, like the other dialogs on the site.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Load whatever the signed-in role is allowed to review.
  useEffect(() => {
    if (!open || !token) return;
    let active = true;

    async function loadForStudentOrParent(userId: string) {
      // Same call the dashboards make, including the already-reviewed filter.
      const [bookingRes, reviewedRes] = await Promise.all([
        fetch(`/api/bookings?studentId=${encodeURIComponent(userId)}`, { headers: authHeaders() }),
        fetch("/api/reviews?mine=true", { headers: authHeaders() }),
      ]);
      if (bookingRes.status === 401) throw new Error("Your session has expired. Please log in again.");
      if (!bookingRes.ok) throw new Error("Could not load your sessions. Please try again.");
      const bookingData = await bookingRes.json().catch(() => null);
      // A failure here must not hide the whole list — worst case the server
      // rejects a duplicate with a clear 409.
      const reviewedData = reviewedRes.ok ? await reviewedRes.json().catch(() => null) : null;
      const reviewed: string[] = Array.isArray(reviewedData?.bookingIds) ? reviewedData.bookingIds : [];
      const all: Booking[] = Array.isArray(bookingData?.bookings) ? bookingData.bookings : [];
      return all.filter((b) => b.status === "completed" && !reviewed.includes(b.id));
    }

    async function loadForAdmin() {
      const res = await fetch("/api/tutors");
      if (!res.ok) throw new Error("Could not load the tutor list. Please try again.");
      const data = await res.json().catch(() => null);
      const list: TutorOption[] = Array.isArray(data?.tutors)
        ? data.tutors.map((t: { id: string; fullName: string }) => ({ id: String(t.id), fullName: t.fullName }))
        : [];
      return list;
    }

    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        if (isStudentOrParent && user?.id) {
          const list = await loadForStudentOrParent(user.id);
          if (active) setBookings(list);
        } else if (isAdmin) {
          const list = await loadForAdmin();
          if (active) setTutors(list);
        }
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, token, isStudentOrParent, isAdmin, user?.id, authHeaders]);

  async function submitReview() {
    if (submitting || !selectedId) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      // The API derives student/tutor identity from the token and the booking,
      // so only the booking (or, for admins, the tutor) is sent.
      const payload = isAdmin
        ? { tutorId: selectedId, rating, comment }
        : { bookingId: selectedId, rating, comment };
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "The review could not be saved. Please try again.");
      setDone(true);
      // Pull the homepage's server data again so the new review and the
      // updated rating/review count show up without a redirect.
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1600);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "The review could not be saved. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const options: { value: string; label: string }[] = isAdmin
    ? tutors.map((t) => ({ value: t.id, label: t.fullName }))
    : bookings.map((b) => ({
        value: b.id,
        label: `${b.tutorName} — ${b.subject}${b.scheduledDate ? ` (${b.scheduledDate})` : ""}`,
      }));

  return (
    <>
      <button type="button" onClick={openModal} className="btn-outline inline-flex items-center gap-2">
        <MessageSquarePlus size={17} /> Write a Review
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="Write a review"
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-slate-900">Write a Review</h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Close"
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* ---------------- logged out ---------------- */}
            {!user || !token ? (
              <div>
                <p className="text-sm text-slate-600">
                  Please log in to share your experience with a tutor. Reviews are tied to your account so
                  families can trust that they are genuine.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/login" className="btn-primary flex-1 justify-center text-center text-sm">
                    Log In
                  </Link>
                  <Link href="/signup" className="btn-outline flex-1 justify-center text-center text-sm">
                    Sign Up
                  </Link>
                </div>
                <button type="button" onClick={closeModal} className="mt-3 w-full text-sm font-semibold text-slate-500 hover:text-slate-700">
                  Close
                </button>
              </div>
            ) : isTutor ? (
              /* ---------------- tutors may not review ---------------- */
              <div>
                <p className="text-sm text-slate-600">
                  Tutors cannot submit reviews. Reviews are available to students, parents, and admins.
                </p>
                <button type="button" onClick={closeModal} className="btn-outline mt-5 w-full text-sm">
                  Close
                </button>
              </div>
            ) : done ? (
              /* ---------------- success ---------------- */
              <p className="py-6 text-center text-sm font-medium text-emerald-700">
                Thank you — your review has been submitted.
              </p>
            ) : loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading…</p>
            ) : loadError ? (
              <p className="py-6 text-center text-sm font-medium text-rose-600">{loadError}</p>
            ) : options.length === 0 ? (
              /* ---------------- nothing available to review ---------------- */
              <div>
                <p className="text-sm text-slate-600">
                  {isAdmin
                    ? "There are no approved tutors to review yet."
                    : "You have no completed sessions left to review. Once a session is marked completed, you can review your tutor here."}
                </p>
                {!isAdmin && (
                  <Link href="/tutors" className="btn-primary mt-5 inline-flex w-full justify-center text-sm">
                    Find a Tutor
                  </Link>
                )}
              </div>
            ) : (
              /* ---------------- the review form ---------------- */
              <div>
                <label htmlFor="home-review-target" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {isAdmin ? "Tutor" : "Completed session"}
                </label>
                <select
                  id="home-review-target"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                >
                  <option value="">{isAdmin ? "Select a tutor…" : "Select a session…"}</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <div className="mb-4 flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                      <Star size={28} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Share how the session went..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                />

                {submitError && <p className="mt-3 text-sm font-medium text-rose-600">{submitError}</p>}

                <button
                  type="button"
                  onClick={submitReview}
                  disabled={submitting || !selectedId}
                  className="btn-primary mt-4 w-full disabled:opacity-60"
                >
                  {submitting ? "Saving Review…" : "Submit Review"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}