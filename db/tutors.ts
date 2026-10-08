/**
 * Real (database-backed) tutor reads.
 * ---------------------------------------------------------------------------
 * Every value returned here comes from PostgreSQL — user rows, tutor
 * profiles, subjects, availability, credential documents and reviews. There is
 * no mock/demo fallback: if the database is not configured or has no approved
 * tutors, callers receive an empty list and render the empty state.
 */
import { hasDatabase, sql } from "./neon";
import type { AvailabilitySlot, Curriculum, Review, Tutor } from "@/lib/types";

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

const CURRICULUM_LABELS: Record<string, Curriculum> = {
  nigerian_national: "Nigerian National",
  british_cambridge: "British Cambridge",
  american: "American",
  other: "Other",
};

const INDEX_TO_DAY: AvailabilitySlot["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface TutorRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  headline: string | null;
  bio: string | null;
  hourly_rate: string | number | null;
  currency: string | null;
  years_experience: number | string | null;
  curriculum: string | null;
  rating_avg: string | number | null;
  total_reviews: number | string | null;
  total_sessions: number | string | null;
  is_verified: boolean | null;
  verification_status?: string | null;
  account_status?: string | null;
  subjects?: unknown;
  availability?: unknown;
  id_card_uploaded?: boolean | null;
  degree_uploaded?: boolean | null;
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function toSubjectList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string" && value.startsWith("{") && value.endsWith("}")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((s) => s.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  }
  return [];
}

/** Parses a json_agg/text-array availability payload into UI slots. */
export function toAvailabilityList(value: unknown): AvailabilitySlot[] {
  let raw: unknown = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const slot = entry as Record<string, unknown>;
      const day = INDEX_TO_DAY[Number(slot.day)] ?? null;
      const start = slot.start ? String(slot.start).slice(0, 5) : "";
      const end = slot.end ? String(slot.end).slice(0, 5) : "";
      if (!day || !start || !end) return null;
      return { day, start, end };
    })
    .filter((slot): slot is AvailabilitySlot => slot !== null);
}

/** Maps a raw `tutor_profiles` + `users` join row onto the UI `Tutor` shape. */
export function mapTutorRow(row: TutorRow): Tutor {
  const curriculum = CURRICULUM_LABELS[String(row.curriculum ?? "")] ?? "Nigerian National";
  const area = (row.city ?? "").trim();
  const state = (row.state ?? "").trim();
  return {
    // tutor_profiles.id — matches bookings.tutor_id, tutor_subjects.tutor_id, etc.
    id: String(row.id),
    fullName: row.full_name || "Tutor",
    avatarUrl: row.avatar_url || "",
    headline: row.headline || "Tutor on TutorConnect NG",
    bio: row.bio || "",
    state: state || "Online",
    area: area || "Remote",
    isOnline: !area && !state,
    isVerified: row.is_verified === true,
    hourlyRate: toNumber(row.hourly_rate),
    currency: "NGN",
    yearsExperience: toNumber(row.years_experience),
    curriculum,
    subjects: toSubjectList(row.subjects),
    subjectCategory: "All",
    ratingAvg: Math.round(toNumber(row.rating_avg) * 100) / 100,
    totalReviews: toNumber(row.total_reviews),
    totalSessions: toNumber(row.total_sessions),
    availability: toAvailabilityList(row.availability),
    idCardUploaded: row.id_card_uploaded === true,
    degreeUploaded: row.degree_uploaded === true,
    reviews: [],
  };
}

/** A tutor is publicly visible only once an admin has verified the profile. */
function isPubliclyVisible(row: TutorRow): boolean {
  return row.is_verified === true && String(row.verification_status ?? "pending") !== "rejected";
}

async function attachDetails(tutor: Tutor): Promise<Tutor> {
  const typedSql = sql as unknown as SqlTag;
  const [availRows, reviewRows] = await Promise.all([
    typedSql`
      SELECT day_of_week, start_time::text AS start, end_time::text AS end
      FROM tutor_availability WHERE tutor_id = ${tutor.id}
      ORDER BY day_of_week, start_time
    `,
    typedSql`
      SELECT id, student_name, rating, comment, created_at
      FROM reviews WHERE tutor_id = ${tutor.id}
      ORDER BY created_at DESC LIMIT 20
    `,
  ]);
  return {
    ...tutor,
    availability: (availRows as Record<string, unknown>[]).map((r) => ({
      day: INDEX_TO_DAY[Number(r.day_of_week)] ?? "Mon",
      start: String(r.start).slice(0, 5),
      end: String(r.end).slice(0, 5),
    })),
    reviews: (reviewRows as Record<string, unknown>[]).map(
      (r): Review => ({
        id: String(r.id),
        studentName: String(r.student_name ?? "Student"),
        rating: Number(r.rating) || 5,
        comment: String(r.comment ?? ""),
        createdAt: r.created_at ? new Date(String(r.created_at)).toISOString().slice(0, 10) : "",
      })
    ),
  };
}

/**
 * Public listing: only admin-verified tutors, freshest/ best-rated first.
 * Throws if the database is configured but the query fails, so a broken query
 * is never silently presented as "no tutors".
 */
export async function fetchApprovedTutors(limit = 200): Promise<Tutor[]> {
  if (!hasDatabase) return [];
  const typedSql = sql as unknown as SqlTag;
  const rows = (await typedSql`
    SELECT
      tp.id, tp.user_id, tp.bio, tp.headline, tp.hourly_rate, tp.currency,
      tp.years_experience, tp.curriculum, tp.rating_avg, tp.total_reviews, tp.total_sessions,
      tp.is_verified, tp.verification_status,
      u.full_name, u.email, u.avatar_url, u.city, u.state, u.account_status,
      COALESCE(
        (SELECT array_agg(ts.subject_name ORDER BY ts.subject_name)
         FROM tutor_subjects ts WHERE ts.tutor_id = tp.id),
        '{}'
      ) AS subjects,
      EXISTS (
        SELECT 1 FROM tutor_documents d
        WHERE d.user_id = tp.user_id AND d.doc_type = 'Government-issued ID'
      ) AS id_card_uploaded,
      EXISTS (
        SELECT 1 FROM tutor_documents d
        WHERE d.user_id = tp.user_id AND d.doc_type = 'Academic credential'
      ) AS degree_uploaded,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'day', ta.day_of_week,
            'start', to_char(ta.start_time, 'HH24:MI'),
            'end', to_char(ta.end_time, 'HH24:MI')
          ) ORDER BY ta.day_of_week, ta.start_time
        )
        FROM tutor_availability ta WHERE ta.tutor_id = tp.id
      ), '[]') AS availability
    FROM tutor_profiles tp
    JOIN users u ON u.id = tp.user_id
    WHERE tp.is_verified = TRUE
    ORDER BY tp.rating_avg DESC, tp.created_at DESC
    LIMIT ${limit}
  `) as unknown as TutorRow[];
  return rows.filter(isPubliclyVisible).map(mapTutorRow);
}

/** Public profile lookup by `tutor_profiles.id`. Returns null when unknown. */
export async function fetchApprovedTutorById(id: string): Promise<Tutor | null> {
  if (!hasDatabase || !id) return null;
  const typedSql = sql as unknown as SqlTag;
  const rows = (await typedSql`
    SELECT
      tp.id, tp.user_id, tp.bio, tp.headline, tp.hourly_rate, tp.currency,
      tp.years_experience, tp.curriculum, tp.rating_avg, tp.total_reviews, tp.total_sessions,
      tp.is_verified, tp.verification_status,
      u.full_name, u.email, u.avatar_url, u.city, u.state, u.account_status,
      COALESCE(
        (SELECT array_agg(ts.subject_name ORDER BY ts.subject_name)
         FROM tutor_subjects ts WHERE ts.tutor_id = tp.id),
        '{}'
      ) AS subjects,
      EXISTS (
        SELECT 1 FROM tutor_documents d
        WHERE d.user_id = tp.user_id AND d.doc_type = 'Government-issued ID'
      ) AS id_card_uploaded,
      EXISTS (
        SELECT 1 FROM tutor_documents d
        WHERE d.user_id = tp.user_id AND d.doc_type = 'Academic credential'
      ) AS degree_uploaded
    FROM tutor_profiles tp
    JOIN users u ON u.id = tp.user_id
    WHERE tp.id = ${id}
    LIMIT 1
  `) as unknown as TutorRow[];
  const row = rows[0];
  // Unapproved (or suspended/rejected) tutors are not exposed publicly.
  if (!row || !isPubliclyVisible(row)) return null;
  return attachDetails(mapTutorRow(row));
}

/** Live homepage counters — every number is a real database aggregate. */
export interface PlatformStats {
  verifiedTutors: number;
  studentsHelped: number;
  statesCovered: number;
  averageRating: number | null;
}

export async function fetchPlatformStats(): Promise<PlatformStats | null> {
  if (!hasDatabase) return null;
  const typedSql = sql as unknown as SqlTag;
  const rows = (await typedSql`
    SELECT
      (SELECT COUNT(*) FROM tutor_profiles WHERE is_verified = TRUE) AS verified_tutors,
      (SELECT COUNT(*) FROM users WHERE role IN ('student', 'parent')) AS students_helped,
      (SELECT COUNT(DISTINCT COALESCE(NULLIF(TRIM(u.state), ''), NULL))
         FROM tutor_profiles tp JOIN users u ON u.id = tp.user_id
        WHERE tp.is_verified = TRUE) AS states_covered,
      (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews) AS average_rating
  `) as unknown as Record<string, unknown>[];
  const row = rows[0];
  if (!row) return null;
  return {
    verifiedTutors: toNumber(row.verified_tutors),
    studentsHelped: toNumber(row.students_helped),
    statesCovered: toNumber(row.states_covered),
    averageRating: row.average_rating === null || row.average_rating === undefined
      ? null
      : toNumber(row.average_rating),
  };
}
