import { NextRequest, NextResponse } from "next/server";
import { fetchApprovedTutors } from "@/db/tutors";
import { hasDatabase } from "@/db/neon";
import type { Tutor } from "@/lib/types";

export const runtime = "nodejs";
// Tutor listings must always reflect the live database (a tutor approved a
// minute ago should appear immediately), never a cached build-time result.
export const dynamic = "force-dynamic";

/**
 * Applies the public listing filters to a list of real database tutors.
 * Only admin-verified tutors ever reach this point — the query itself
 * restricts results to `tutor_profiles.is_verified = TRUE`.
 */
function applyFilters(tutors: Tutor[], params: URLSearchParams): Tutor[] {
  let results = [...tutors];

  const search = params.get("search")?.toLowerCase().trim();
  if (search) {
    results = results.filter(
      (t) =>
        t.fullName.toLowerCase().includes(search) ||
        t.headline.toLowerCase().includes(search) ||
        t.subjects.some((s) => s.toLowerCase().includes(search))
    );
  }

  const subject = params.get("subject");
  if (subject && subject !== "All") {
    const needle = subject.toLowerCase();
    results = results.filter(
      (t) =>
        t.subjects.some((s) => s.toLowerCase().includes(needle)) ||
        t.subjectCategory === subject
    );
  }

  const location = params.get("location");
  if (location && location !== "All") {
    if (location.startsWith("Online")) {
      results = results.filter((t) => t.isOnline);
    } else {
      const needle = location.split("(")[0].trim().toLowerCase();
      results = results.filter((t) => `${t.area} ${t.state}`.toLowerCase().includes(needle));
    }
  }

  const minRate = params.get("minRate");
  const maxRate = params.get("maxRate");
  if (minRate) results = results.filter((t) => t.hourlyRate >= Number(minRate));
  if (maxRate && Number(maxRate) < Number.MAX_SAFE_INTEGER) {
    results = results.filter((t) => t.hourlyRate <= Number(maxRate));
  }

  const curriculum = params.get("curriculum");
  if (curriculum && curriculum !== "All") {
    results = results.filter((t) => t.curriculum === curriculum);
  }

  const day = params.get("day");
  if (day && day !== "All") {
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const weekends = ["Sat", "Sun"];
    results = results.filter((t) =>
      t.availability.some((a) => {
        if (day === "Weekdays") return weekdays.includes(a.day);
        if (day === "Weekends") return weekends.includes(a.day);
        return true;
      })
    );
  }

  const verifiedOnly = params.get("verifiedOnly");
  if (verifiedOnly === "true") {
    results = results.filter((t) => t.isVerified);
  }

  const sortBy = params.get("sortBy");
  if (sortBy === "rating") {
    results.sort((a, b) => b.ratingAvg - a.ratingAvg);
  } else if (sortBy === "price_asc") {
    results.sort((a, b) => a.hourlyRate - b.hourlyRate);
  } else if (sortBy === "price_desc") {
    results.sort((a, b) => b.hourlyRate - a.hourlyRate);
  } else if (sortBy === "experience") {
    results.sort((a, b) => b.yearsExperience - a.yearsExperience);
  }

  return results;
}

export async function GET(req: NextRequest) {
  if (!hasDatabase) {
    console.error(
      "GET /api/tutors: DATABASE_URL is not configured, so no tutors can be listed."
    );
    return NextResponse.json({ source: "none", tutors: [] });
  }

  const params = req.nextUrl.searchParams;
  const all = await fetchApprovedTutors();
  return NextResponse.json({ source: "neon", tutors: applyFilters(all, params) });
}
