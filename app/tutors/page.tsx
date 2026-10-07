"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TutorCard from "@/components/TutorCard";
import { STATES, SUBJECT_FILTERS, CURRICULA } from "@/lib/site-config";
import type { Tutor } from "@/lib/types";

const DAY_OPTIONS = ["All", "Weekdays", "Weekends"];
const MIN_BUDGET = 2000;
const MAX_BUDGET = 25000;

function guessCategoryFromTitle(title: string | null): string {
  if (!title) return "All";
  const t = title.toLowerCase();
  if (t.includes("math")) return "Maths";
  if (t.includes("science")) return "Sciences";
  if (t.includes("web") || t.includes("python") || t.includes("ai") || t.includes("design"))
    return "Tech";
  if (t.includes("english")) return "Languages";
  if (t.includes("exam")) return "Exam Prep";
  return "All";
}

function TutorsPageInner() {
  const searchParams = useSearchParams();
  const initialSubject = guessCategoryFromTitle(searchParams.get("subject"));
  const initialLocation = searchParams.get("location");
  const initialSearch = searchParams.get("search") ?? "";
  const initialVerifiedOnly = searchParams.get("verifiedOnly") === "true";

  const [subject, setSubject] = useState(initialSubject);
  const [location, setLocation] = useState(
    initialLocation && STATES.includes(initialLocation) ? initialLocation : "All"
  );
  const [maxRate, setMaxRate] = useState(MAX_BUDGET);
  const [day, setDay] = useState("All");
  const [curriculum, setCurriculum] = useState("All");
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState("rating");
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerifiedOnly);
  const [filterOpen, setFilterOpen] = useState(false);

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (subject !== "All") p.set("subject", subject);
    if (location !== "All") p.set("location", location);
    p.set("minRate", String(MIN_BUDGET));
    p.set("maxRate", String(maxRate));
    if (day !== "All") p.set("day", day);
    if (curriculum !== "All") p.set("curriculum", curriculum);
    if (search) p.set("search", search);
    if (sortBy) p.set("sortBy", sortBy);
    if (verifiedOnly) p.set("verifiedOnly", "true");
    return p.toString();
  }, [subject, location, maxRate, day, curriculum, search, sortBy, verifiedOnly]);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initiating a fetch requires flagging loading state synchronously
    setLoading(true);
    fetch(`/api/tutors?${queryString}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setTutors(data.tutors ?? []);
      })
      .catch(() => {
        if (active) setTutors([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [queryString]);

  const filtersActive =
    subject !== "All" ||
    location !== "All" ||
    maxRate < MAX_BUDGET ||
    day !== "All" ||
    curriculum !== "All" ||
    verifiedOnly ||
    search.trim().length > 0;

  function resetFilters() {
    setSubject("All");
    setLocation("All");
    setMaxRate(MAX_BUDGET);
    setDay("All");
    setCurriculum("All");
    setSearch("");
    setVerifiedOnly(false);
  }

  const FilterControls = (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
          Subject
        </label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
        >
          <option>All</option>
          {SUBJECT_FILTERS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
          Location / State
        </label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
        >
          <option>All</option>
          {STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Max Budget
          </label>
          <span className="text-sm font-bold text-navy-700">
            ₦{maxRate.toLocaleString()}/hr
          </span>
        </div>
        <input
          type="range"
          min={MIN_BUDGET}
          max={MAX_BUDGET}
          step={500}
          value={maxRate}
          onChange={(e) => setMaxRate(Number(e.target.value))}
          className="w-full cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          <span>₦{MIN_BUDGET.toLocaleString()}</span>
          <span>₦{MAX_BUDGET.toLocaleString()}</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
          Availability
        </label>
        <div className="flex gap-2">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`flex-1 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                day === d
                  ? "border-navy-600 bg-navy-50 text-navy-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
          Curriculum
        </label>
        <select
          value={curriculum}
          onChange={(e) => setCurriculum(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
        >
          <option>All</option>
          {CURRICULA.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm font-semibold text-emerald-700">
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={(e) => setVerifiedOnly(e.target.checked)}
          className="h-4 w-4 accent-emerald-600"
        />
        Verified Tutors Only
      </label>

      <button
        onClick={resetFilters}
        className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="border-b border-slate-200 bg-white">
          <div className="container-app py-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-4 py-1.5 text-xs font-semibold text-navy-700">
              <Sparkles size={14} /> Live Filter &amp; Matching Engine
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Find Your Perfect Tutor
            </h1>
            <p className="mt-2 max-w-xl text-slate-600">
              Filter by subject, location, budget, availability, and
              curriculum to find verified tutors who match your needs.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by subject, curriculum, or tutor name..."
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-navy-600 focus:outline-none"
              >
                <option value="rating">Sort: Top Rated</option>
                <option value="price_asc">Sort: Price (Low to High)</option>
                <option value="price_desc">Sort: Price (High to Low)</option>
                <option value="experience">Sort: Most Experienced</option>
              </select>
              <button
                onClick={() => setFilterOpen(true)}
                className="btn-outline justify-center !px-5 lg:hidden"
              >
                <SlidersHorizontal size={16} /> Filters
              </button>
            </div>
          </div>
        </div>

        <div className="container-app grid grid-cols-1 gap-8 py-10 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="mb-5 flex items-center gap-2 text-navy-700">
                <SlidersHorizontal size={18} />
                <h2 className="font-display font-bold">Filters</h2>
              </div>
              {FilterControls}
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {loading ? "Searching..." : `${tutors.length} tutors found`}
              </p>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center text-slate-400">
                <Loader2 className="animate-spin" size={28} />
              </div>
            ) : tutors.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <MapPin size={36} className="mb-3 text-slate-300" />
                <h3 className="font-display text-lg font-bold text-slate-700">
                  {filtersActive ? "No tutors match these filters" : "No approved tutors yet"}
                </h3>
                <p className="mt-1 max-w-sm text-sm text-slate-400">
                  {filtersActive
                    ? "Try widening your budget range or choosing a different location / subject."
                    : "Tutors appear here once they register and an admin has verified their profile."}
                </p>
                {filtersActive && (
                  <button onClick={resetFilters} className="btn-primary mt-5 !px-6 !py-2.5 text-sm">
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
              >
                {tutors.map((tutor) => (
                  <TutorCard key={tutor.id} tutor={tutor} />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-[90] flex justify-end bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="h-full w-full max-w-sm overflow-y-auto bg-white p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-navy-700">Filters</h2>
              <button
                onClick={() => setFilterOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            {FilterControls}
            <button
              onClick={() => setFilterOpen(false)}
              className="btn-primary mt-6 w-full"
            >
              Show {tutors.length} Tutors
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default function TutorsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-navy-600" size={32} /></div>}>
      <TutorsPageInner />
    </Suspense>
  );
}
