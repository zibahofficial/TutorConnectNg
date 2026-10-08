/**
 * Maps a raw PostgreSQL `bookings` row onto the camelCase `Booking` shape the
 * dashboards consume. The bookings API selects `b.*` plus the `student_name`,
 * `tutor_name` and `subject` aliases, so every column the `Booking`
 * interface requires is present here.
 */
import type { Booking } from "@/lib/types";

/** Postgres DATE → "YYYY-MM-DD" (drivers may hand back a string or a Date). */
function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "");
}

/** Postgres TIMESTAMPTZ → ISO timestamp string. */
function toIsoTimestamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const text = String(value ?? "");
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString();
}

export function mapBookingRow(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id),
    studentId: row.student_id ? String(row.student_id) : undefined,
    studentName: String(row.student_name ?? "Guest Student"),
    tutorId: String(row.tutor_id),
    tutorName: String(row.tutor_name ?? "Tutor"),
    subject: String(row.subject ?? ""),
    gradeLevel: String(row.grade_level ?? ""),
    scheduledDate: toIsoDate(row.scheduled_date),
    // Postgres TIME columns come back as "HH:MM:SS" — trim to "HH:MM".
    startTime: String(row.start_time ?? "").slice(0, 5),
    endTime: String(row.end_time ?? "").slice(0, 5),
    status: (row.status as Booking["status"]) ?? "pending",
    sessionMode: (row.session_mode as Booking["sessionMode"]) ?? "online",
    meetingLink: row.meeting_link ? String(row.meeting_link) : undefined,
    totalPrice: Number(row.total_price) || 0,
    notes: row.notes ? String(row.notes) : "",
    createdAt: toIsoTimestamp(row.created_at),
  };
}
