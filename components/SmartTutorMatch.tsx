"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  MapPin,
  CalendarDays,
  Wallet,
  BookOpen,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";

import TutorCard from "@/components/TutorCard";
import { STATES, CURRICULA } from "@/lib/site-config";
import { SUBJECT_OPTIONS } from "@/lib/tutor-subjects";
import {
  calculateTutorMatches,
  type MatchPreferences,
  type TutorMatch,
} from "@/lib/matching/smart-match";
import type { Tutor } from "@/lib/types";

const INITIAL_PREFERENCES: MatchPreferences = {
  subject: "",
  maxBudget: 10000,
  curriculum: "All",
  location: "All",
  availability: "All",
};

export default function SmartTutorMatch() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [preferences, setPreferences] =
    useState<MatchPreferences>(INITIAL_PREFERENCES);
  const [matches, setMatches] = useState<TutorMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTutors() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/tutors");

        if (!response.ok) {
          throw new Error("Could not load tutors. Please try again.");
        }

        const data = await response.json();

        if (active) {
          setTutors(Array.isArray(data.tutors) ? data.tutors : []);
        }
      } catch {
        if (active) {
          setError(
            "We could not load tutors right now. Please refresh the page and try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTutors();

    return () => {
      active = false;
    };
  }, []);

  function updatePreference<K extends keyof MatchPreferences>(
    key: K,
    value: MatchPreferences[K],
  ) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function findMatches(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!preferences.subject) {
      setError("Please select a subject before finding your matches.");
      return;
    }

    if (!Number.isFinite(preferences.maxBudget) || preferences.maxBudget <= 0) {
      setError("Please enter a valid hourly budget.");
      return;
    }

    setError("");
    setSearching(true);

    try {
      const results = calculateTutorMatches(tutors, preferences);
      setMatches(results);
      setHasSearched(true);
    } catch {
      setError("Something went wrong while matching tutors. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-4 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-amber-300" />
            Smarter learning starts here
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Smart Tutor Match
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
            Tell us what you need, set your budget, and discover approved
            tutors ranked by how well they fit your learning preferences.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <form
          onSubmit={findMatches}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="mb-7">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Your learning preferences
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Subject and budget are required matching criteria. Other
              preferences help us rank eligible tutors.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="match-subject"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
              >
                <BookOpen className="h-4 w-4 text-blue-700" />
                Subject *
              </label>
              <select
                id="match-subject"
                value={preferences.subject}
                onChange={(event) => {
                  updatePreference("subject", event.target.value);
                  setHasSearched(false);
                }}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
               <option value="">Choose a subject</option>
{SUBJECT_OPTIONS.map((subject) => (
  <option key={subject} value={subject}>
    {subject}
  </option>
))}
              </select>
            </div>

            <div>
              <label
                htmlFor="match-budget"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
              >
                <Wallet className="h-4 w-4 text-blue-700" />
                Maximum hourly budget (₦) *
              </label>
              <input
                id="match-budget"
                type="number"
                min="1"
                step="500"
                value={preferences.maxBudget}
                onChange={(event) => {
                  updatePreference(
                    "maxBudget",
                    Number(event.target.value),
                  );
                  setHasSearched(false);
                }}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-2 text-xs text-slate-500">
                Tutors charging above this amount will not be recommended.
              </p>
            </div>

            <div>
              <label
                htmlFor="match-curriculum"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Preferred curriculum
              </label>
              <select
                id="match-curriculum"
                value={preferences.curriculum}
                onChange={(event) => {
                  updatePreference("curriculum", event.target.value);
                  setHasSearched(false);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">Any curriculum</option>
                {CURRICULA.map((curriculum) => (
                  <option key={curriculum} value={curriculum}>
                    {curriculum}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="match-location"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
              >
                <MapPin className="h-4 w-4 text-blue-700" />
                Preferred location
              </label>
              <select
                id="match-location"
                value={preferences.location}
                onChange={(event) => {
                  updatePreference("location", event.target.value);
                  setHasSearched(false);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">Any location</option>
                {STATES.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="match-availability"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
              >
                <CalendarDays className="h-4 w-4 text-blue-700" />
                Preferred availability
              </label>
              <select
                id="match-availability"
                value={preferences.availability}
                onChange={(event) => {
                  updatePreference(
                    "availability",
                    event.target.value as MatchPreferences["availability"],
                  );
                  setHasSearched(false);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">Any day</option>
                <option value="Weekdays">Weekdays (Monday–Friday)</option>
                <option value="Weekends">Weekends (Saturday–Sunday)</option>
              </select>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          <button
type="submit"
disabled={loading || searching}
className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-4 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"

>

{loading || searching ? ( <Loader2 className="h-5 w-5 animate-spin" />
) : ( <Search className="h-5 w-5" />
)}
{loading
? "Loading tutors..."
: searching
? "Finding matches..."
: "Find My Tutor Matches"} </button>


        </form>

        {loading && (
          <div className="py-12 text-center text-slate-600">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-700" />
            Loading approved tutors...
          </div>
        )}

        {!loading && !error && tutors.length === 0 && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <h3 className="font-bold text-slate-900">
              No tutors are available yet
            </h3>
            <p className="mt-2 text-sm text-slate-700">
              There are currently no tutors returned by the tutor service.
              Please try again later.
            </p>
          </div>
        )}

        {!loading && hasSearched && (
          <section className="mt-10" aria-live="polite">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Your results
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {matches.length > 0
                  ? `${matches.length} tutor${matches.length === 1 ? "" : "s"} matched your requirements`
                  : "No tutors matched your requirements"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Matches are ranked using your preferences, tutor verification,
                and review ratings. Match scores are estimates based on these
                criteria, not guarantees of learning outcomes.
              </p>
            </div>

            {matches.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {matches.map((match) => (
                  <div key={match.tutor.id} className="min-w-0">
                    <div className="mb-3 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                      <span className="text-sm font-semibold text-slate-800">
                        Match score
                      </span>
                      <span className="text-lg font-bold text-blue-800">
                        {match.score}%
                      </span>
                    </div>

                    <TutorCard tutor={match.tutor} />

                    {match.reasons.length > 0 && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="mb-2 text-sm font-bold text-slate-900">
                          Why this tutor matched
                        </h3>
                        <ul className="space-y-2">
                          {match.reasons.map((reason) => (
                            <li
                              key={reason}
                              className="flex items-start gap-2 text-sm text-slate-600"
                            >
                              <span className="mt-1 text-green-600">✓</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <Search className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-4 font-semibold text-slate-900">
                  Try adjusting your preferences
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  No available tutor meets both your selected subject and
                  maximum budget. You can increase your budget or try another
                  subject.
                </p>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
