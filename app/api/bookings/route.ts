import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, sql } from "@/db/neon";
import { mapBookingRow } from "@/db/bookings";
import { verifyToken } from "@/lib/auth-store";
import type { Booking } from "@/lib/types";

export const runtime = "nodejs";

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

declare global {
  var __tutorconnect_bookings__: Booking[] | undefined;
}

/**
 * In-memory fallback used only when DATABASE_URL is not configured. It starts
 * empty on purpose — real bookings live in PostgreSQL, and inventing demo
 * bookings would misrepresent platform activity.
 */
function getBookingStore(): Booking[] {
  if (!global.__tutorconnect_bookings__) {
    global.__tutorconnect_bookings__ = [];
  }
  return global.__tutorconnect_bookings__;
}

/**
 * Bookings can only be read/changed by authenticated users. POST stays open
 * so guests can request a booking from the public tutor listing (the modal
 * labels them "Guest Student"); everything else requires a valid token.
 */
function requireAuth(req: NextRequest): { id: string; email: string; role: string } | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "") || req.nextUrl.searchParams.get("token") || "";
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const tutorId = params.get("tutorId");
  const status = params.get("status");

  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
      let rows: Record<string, unknown>[];

      if (auth.role === "admin") {
        rows = await typedSql`
          SELECT b.*, u.full_name AS student_name, tu.full_name AS tutor_name, ts.subject_name AS subject
          FROM bookings b
          LEFT JOIN users u ON u.id = b.student_id
          LEFT JOIN tutor_profiles tp ON tp.id = b.tutor_id
          LEFT JOIN users tu ON tu.id = tp.user_id
          LEFT JOIN tutor_subjects ts ON ts.id = b.subject_id
          WHERE (${tutorId}::text IS NULL OR b.tutor_id::text = ${tutorId})
            AND (${status}::text IS NULL OR b.status::text = ${status})
          ORDER BY b.created_at DESC LIMIT 100
        `;
      } else if (auth.role === "tutor") {
        rows = await typedSql`
          SELECT b.*, u.full_name AS student_name, tu.full_name AS tutor_name, ts.subject_name AS subject
          FROM bookings b
          LEFT JOIN users u ON u.id = b.student_id
          LEFT JOIN tutor_profiles tp ON tp.id = b.tutor_id
          LEFT JOIN users tu ON tu.id = tp.user_id
          LEFT JOIN tutor_subjects ts ON ts.id = b.subject_id
          WHERE tp.user_id = ${auth.id}
            AND (${status}::text IS NULL OR b.status::text = ${status})
          ORDER BY b.created_at DESC LIMIT 100
        `;
      } else {
        rows = await typedSql`
          SELECT b.*, u.full_name AS student_name, tu.full_name AS tutor_name, ts.subject_name AS subject
          FROM bookings b
          LEFT JOIN users u ON u.id = b.student_id
          LEFT JOIN tutor_profiles tp ON tp.id = b.tutor_id
          LEFT JOIN users tu ON tu.id = tp.user_id
          LEFT JOIN tutor_subjects ts ON ts.id = b.subject_id
          WHERE b.student_id = ${auth.id}
            AND (${status}::text IS NULL OR b.status::text = ${status})
          ORDER BY b.created_at DESC LIMIT 100
        `;
      }

      return NextResponse.json({ source: "neon", bookings: rows.map(mapBookingRow) });
    } catch (err) {
      console.error("Neon bookings query failed:", err);
      return NextResponse.json({ error: "Unable to retrieve bookings." }, { status: 500 });
    }
  }

  let results = getBookingStore();

  if (auth.role === "admin") {
    if (tutorId) results = results.filter((b) => b.tutorId === tutorId);
  } else if (auth.role === "tutor") {
    results = results.filter((b) => b.tutorId === auth.id);
  } else {
    results = results.filter((b) => b.studentId === auth.id);
  }

  if (status) results = results.filter((b) => b.status === status);

  return NextResponse.json({ source: "mock", bookings: results });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Please sign in to book a tutor." }, { status: 401 });
  }

  if (auth.role !== "student" && auth.role !== "parent" && auth.role !== "admin") {
    return NextResponse.json({ error: "Only students or parents can create bookings." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const required = ["tutorId", "subject", "gradeLevel", "scheduledDate", "startTime"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const sessionMode = body.sessionMode === "in_person" ? "in_person" : "online";
  const endTime = (body.endTime as string) || (body.startTime as string);
  const notes = (body.notes as string) || "";
  const studentId = auth.role === "admin" ? ((body.studentId as string) || auth.id) : auth.id;

  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
      const tutorRows = await typedSql`
        SELECT tp.id, tp.hourly_rate, u.full_name AS tutor_name
        FROM tutor_profiles tp
        JOIN users u ON u.id = tp.user_id
        WHERE tp.id = ${body.tutorId}
          AND u.is_active = TRUE
          AND u.account_status = 'approved'
          AND tp.is_verified = TRUE
          AND tp.verification_status = 'approved'
        LIMIT 1
      `;

      const tutor = tutorRows[0];
      if (!tutor) {
        return NextResponse.json({ error: "Tutor not found or unavailable." }, { status: 404 });
      }

      const subjectName = typeof body.subject === "string" ? body.subject.trim() : "";
      const subjectRows = await typedSql`
        SELECT id FROM tutor_subjects
        WHERE tutor_id = ${body.tutorId} AND subject_name = ${subjectName}
        LIMIT 1
      `;
      if (subjectRows.length === 0) {
        return NextResponse.json({ error: "That subject is not offered by this tutor." }, { status: 400 });
      }

      const rate = Number(tutor.hourly_rate);
      if (!Number.isFinite(rate) || rate < 0) {
        return NextResponse.json({ error: "Tutor pricing is not configured correctly." }, { status: 500 });
      }

      const inserted = await typedSql`
        INSERT INTO bookings (
          student_id, tutor_id, subject_id, scheduled_date, start_time, end_time,
          status, session_mode, meeting_link, total_price, notes, grade_level
        ) VALUES (
          ${studentId}, ${body.tutorId}, ${subjectRows[0].id},
          ${body.scheduledDate}, ${body.startTime}, ${endTime},
          'pending', ${sessionMode}, NULL, ${rate}, ${notes}, ${body.gradeLevel}
        )
        RETURNING *
      `;
      return NextResponse.json({ source: "neon", booking: inserted[0] }, { status: 201 });
    } catch (err) {
      console.error("Neon booking insert failed:", err);
      return NextResponse.json({ error: "Unable to create booking. Please try again." }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Booking service is unavailable because the database is not configured." },
    { status: 503 }
  );
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, status, meetingLink, edit } = body as {
    id: string;
    status?: Booking["status"];
    meetingLink?: string;
    edit?: Partial<Pick<Booking, "subject" | "gradeLevel" | "scheduledDate" | "startTime" | "endTime" | "sessionMode" | "notes">>;
  };
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }
  if (!status && !edit) {
    return NextResponse.json({ error: "id and status (or edit) are required." }, { status: 400 });
  }

  // Verify booking ownership before allowing edits or status changes.
  // In PostgreSQL, booking.tutorId is a tutor_profiles.id, not a users.id.
  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
      const rows = await typedSql`
        SELECT b.id, b.student_id, b.tutor_id, b.status,
               tp.user_id AS tutor_user_id
        FROM bookings b
        LEFT JOIN tutor_profiles tp ON tp.id = b.tutor_id
        WHERE b.id = ${id}
        LIMIT 1
      `;
      const row = rows[0];
      if (!row) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }

      const isAdmin = auth.role === "admin";
      const isStudentOwner = String(row.student_id ?? "") === auth.id;
      const isTutorOwner = String(row.tutor_user_id ?? "") === auth.id;

      if (!isAdmin && !isStudentOwner && !isTutorOwner) {
        return NextResponse.json({ error: "You are not authorized to modify this booking." }, { status: 403 });
      }

      if (edit && !isAdmin && !isStudentOwner) {
        return NextResponse.json({ error: "Only the booking student or an admin may edit this booking." }, { status: 403 });
      }

      if (status) {
        const allowedStatuses = ["pending", "accepted", "rejected", "completed", "cancelled"];
        if (!allowedStatuses.includes(status)) {
          return NextResponse.json({ error: "Invalid booking status." }, { status: 400 });
        }

        const tutorDecision = status === "accepted" || status === "rejected";
        if (tutorDecision && !isAdmin && !isTutorOwner) {
          return NextResponse.json({ error: "Only the assigned tutor or an admin may accept or reject this booking." }, { status: 403 });
        }
        if ((status === "cancelled" || status === "completed") && !isAdmin && !isStudentOwner && !isTutorOwner) {
          return NextResponse.json({ error: "You are not authorized to change this booking status." }, { status: 403 });
        }
        if (!isAdmin && status === "pending") {
          return NextResponse.json({ error: "You cannot reset a booking to pending." }, { status: 403 });
        }
      }
    } catch (err) {
      console.error("Booking authorization lookup failed:", err);
      return NextResponse.json({ error: "Could not verify booking permissions. Please try again." }, { status: 500 });
    }
  } else {
    const existing = getBookingStore().find((booking) => booking.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    const isAdmin = auth.role === "admin";
    const isStudentOwner = existing.studentId === auth.id;
    const isTutorOwner = existing.tutorId === auth.id;

    if (!isAdmin && !isStudentOwner && !isTutorOwner) {
      return NextResponse.json({ error: "You are not authorized to modify this booking." }, { status: 403 });
    }
    if (edit && !isAdmin && !isStudentOwner) {
      return NextResponse.json({ error: "Only the booking student or an admin may edit this booking." }, { status: 403 });
    }
    if (status) {
      const allowedStatuses = ["pending", "accepted", "rejected", "completed", "cancelled"];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid booking status." }, { status: 400 });
      }
      if ((status === "accepted" || status === "rejected") && !isAdmin && !isTutorOwner) {
        return NextResponse.json({ error: "Only the assigned tutor or an admin may accept or reject this booking." }, { status: 403 });
      }
      if (status === "pending" && !isAdmin) {
        return NextResponse.json({ error: "You cannot reset a booking to pending." }, { status: 403 });
      }
    }
  }

  // Edit a booking's details — only allowed while the request is still
  // pending (not yet accepted/approved by the tutor).
  if (edit) {
    if (hasDatabase) {
      try {
        const typedSql = sql as unknown as SqlTag;
        const updated = await typedSql`
  UPDATE bookings
  SET
    subject_id = COALESCE(
      (SELECT ts.id FROM tutor_subjects ts
        WHERE ts.tutor_id = bookings.tutor_id
          AND ts.subject_name = ${edit.subject ?? null}
        LIMIT 1),
      subject_id
    ),
    grade_level = COALESCE(${edit.gradeLevel ?? null}, grade_level),
    scheduled_date = COALESCE(${edit.scheduledDate ?? null}, scheduled_date),
    start_time = COALESCE(${edit.startTime ?? null}, start_time),
    end_time = COALESCE(${edit.endTime ?? null}, end_time),
    session_mode = COALESCE(${edit.sessionMode ?? null}, session_mode),

notes = COALESCE(${edit.notes ?? null}, notes)
  WHERE id = ${id} AND status = 'pending'
  RETURNING *
`;
        if (updated.length === 0) {
          return NextResponse.json({ error: "Booking not found or no longer editable — only pending requests can be edited." }, { status: 409 });
        }
        return NextResponse.json({ source: "neon", booking: updated[0] });
      } catch (err) {
        console.error("Neon booking edit failed:", err);
        return NextResponse.json(
          { error: "Unable to edit booking. Please try again." },
          { status: 500 }
        );
      }
    }

    const store = getBookingStore();
    const booking = store.find((b) => b.id === id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (booking.status !== "pending") {
      return NextResponse.json({ error: "Only pending requests can be edited — this booking has already been processed." }, { status: 409 });
    }
    if (edit.subject !== undefined) booking.subject = edit.subject;
    if (edit.gradeLevel !== undefined) booking.gradeLevel = edit.gradeLevel;
    if (edit.scheduledDate !== undefined) booking.scheduledDate = edit.scheduledDate;
    if (edit.startTime !== undefined) booking.startTime = edit.startTime;
    if (edit.endTime !== undefined) booking.endTime = edit.endTime;
    if (edit.sessionMode !== undefined) booking.sessionMode = edit.sessionMode;
    if (edit.notes !== undefined) booking.notes = edit.notes;
    return NextResponse.json({ source: "mock", booking });
  }

  // Status change path (accept / decline / cancel / complete)
  if (!status) {
    return NextResponse.json({ error: "status is required for status changes." }, { status: 400 });
  }

  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
      const updated = await typedSql`
  UPDATE bookings
  SET
    status = ${status},
    meeting_link = COALESCE(${meetingLink || null}, meeting_link)
  WHERE id = ${id}
  RETURNING *
`;
      return NextResponse.json({ source: "neon", booking: updated[0] });
    } catch (err) {
      console.error("Neon booking update failed:", err);
      return NextResponse.json(
        { error: "Unable to update booking. Please try again." },
        { status: 500 }
      );
    }
  }

  const store = getBookingStore();
  const booking = store.find((b) => b.id === id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  booking.status = status;
  if (meetingLink) {
    booking.meetingLink = meetingLink;
  }
  return NextResponse.json({ source: "mock", booking });
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = (body.id as string) || "";
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  // Only the booking's student, assigned tutor, or an admin may delete it.
  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
      const rows = await typedSql`
        SELECT b.id, b.student_id, tp.user_id AS tutor_user_id
        FROM bookings b
        LEFT JOIN tutor_profiles tp ON tp.id = b.tutor_id
        WHERE b.id = ${id}
        LIMIT 1
      `;

      if (rows.length === 0) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }

      const booking = rows[0] as {
        student_id: string | null;
        tutor_user_id: string | null;
      };
      const isAdmin = auth.role === "admin";
      const isStudentOwner = booking.student_id === auth.id;
      const isTutorOwner = booking.tutor_user_id === auth.id;

      if (!isAdmin && !isStudentOwner && !isTutorOwner) {
        return NextResponse.json({ error: "You cannot delete this booking." }, { status: 403 });
      }

      const deleted = await typedSql`
        DELETE FROM bookings WHERE id = ${id} RETURNING id
      `;
      if (deleted.length === 0) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }
      return NextResponse.json({ source: "neon", deleted: true });
    } catch (err) {
      console.error("Neon booking delete failed:", err);
      return NextResponse.json({ error: "Unable to delete booking." }, { status: 500 });
    }
  }

  const store = getBookingStore();
  const idx = store.findIndex((b) => b.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const booking = store[idx];
  const isAdmin = auth.role === "admin";
  const isStudentOwner = booking.studentId === auth.id;
  const isTutorOwner = booking.tutorId === auth.id;

  if (!isAdmin && !isStudentOwner && !isTutorOwner) {
    return NextResponse.json({ error: "You cannot delete this booking." }, { status: 403 });
  }

  store.splice(idx, 1);
  return NextResponse.json({ source: "mock", deleted: true });
}
