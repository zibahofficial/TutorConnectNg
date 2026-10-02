import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, sql } from "@/db/neon";
import { TUTORS } from "@/lib/mock-data";
import type { Tutor } from "@/lib/types";

export const runtime = "nodejs";

function filterMockTutors(params: URLSearchParams): Tutor[] {
  let results = [...TUTORS];

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
    results = results.filter((t) => t.subjectCategory === subject);
  }

  const location = params.get("location");
  if (location && location !== "All") {
    if (location.startsWith("Online")) {
      results = results.filter((t) => t.isOnline);
    } else {
      results = results.filter((t) =>
        `${t.area} ${t.state}`.toLowerCase().includes(location.split("(")[0].trim().toLowerCase())
      );
    }
  }

  const minRate = params.get("minRate");
  const maxRate = params.get("maxRate");
  if (minRate) results = results.filter((t) => t.hourlyRate >= Number(minRate));
  if (maxRate) results = results.filter((t) => t.hourlyRate <= Number(maxRate));

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
  const params = req.nextUrl.searchParams;

  // Attempt live Neon Postgres query first; gracefully fall back to the
  // curated mock dataset (used for local/demo environments or if the
  // `tutor_profiles` table has not been seeded with production data yet).
  if (hasDatabase) {
    try {
      const rows = await (sql as (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>)`
        SELECT
          u.id, u.full_name, u.avatar_url, u.city, u.state,
          tp.id AS tutor_profile_id, tp.bio, tp.headline, tp.hourly_rate,
          tp.currency, tp.years_experience, tp.curriculum, tp.rating_avg,
          tp.total_reviews, tp.is_verified
        FROM tutor_profiles tp
        JOIN users u ON u.id = tp.user_id
        ORDER BY tp.rating_avg DESC
        LIMIT 50
      `;
      if (rows && rows.length > 0) {
        return NextResponse.json({ source: "neon", tutors: rows });
      }
    } catch (err) {
      console.error("Neon query failed, falling back to mock data:", err);
    }
  }

  const tutors = filterMockTutors(params);
  return NextResponse.json({ source: "mock", tutors });
}
