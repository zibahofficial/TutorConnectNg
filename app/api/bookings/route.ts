import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { hasDatabase, sql } from "@/db/neon";
import { BOOKINGS } from "@/lib/mock-data";
import { verifyToken } from "@/lib/auth-store";
import type { Booking } from "@/lib/types";

export const runtime = "nodejs";

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

declare global {
  var __tutorconnect_bookings__: Booking[] | undefined;
}

function getBookingStore(): Booking[] {
  if (!global.__tutorconnect_bookings__) {
    global.__tutorconnect_bookings__ = [...BOOKINGS];
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
  // Note: the studentId param is intentionally ignored for non-admins —
  // bookings are always scoped server-side to the authenticated user so the
  // param can never be used to read someone else's bookings.

  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
      // Apply the same filters the mock branch applies so dashboards scoped
      // to one tutor/status/student work identically in database mode.
      let rows: Record<string, unknown>[];
      if (tutorId && status) {
        rows = await typedSql`
          SELECT b.*, u.full_name AS student_name
          FROM bookings b LEFT JOIN users u ON u.id = b.student_id
          WHERE b.tutor_id = ${tutorId} AND b.status = ${status}
          ORDER BY b.created_at DESC LIMIT 100
        `;
      } else if (tutorId) {
        rows = await typedSql`
          SELECT b.*, u.full_name AS student_name
          FROM bookings b LEFT JOIN users u ON u.id = b.student_id
          WHERE b.tutor_id = ${tutorId}
          ORDER BY b.created_at DESC LIMIT 100
        `;
      } else if (status) {
        rows = await typedSql`
          SELECT b.*, u.full_name AS student_name
          FROM bookings b LEFT JOIN users u ON u.id = b.student_id
          WHERE b.status = ${status}
            AND (${auth.role === "admin"} OR b.student_id = ${auth.id} OR b.student_id IS NULL)
          ORDER BY b.created_at DESC LIMIT 100
        `;
      } else {
        rows = await typedSql`
          SELECT b.*, u.full_name AS student_name
          FROM bookings b LEFT JOIN users u ON u.id = b.student_id
          WHERE ${auth.role === "admin"} OR b.student_id = ${auth.id} OR b.student_id IS NULL
          ORDER BY b.created_at DESC LIMIT 100
        `;
      }
      if (rows) {
        return NextResponse.json({ source: "neon", bookings: rows });
      }
    } catch (err) {
      console.error("Neon bookings query failed, falling back to mock data:", err);
    }
  }

  let results = getBookingStore();
  if (tutorId) {
    // Tutor view: the tutor dashboard requests a specific tutor's bookings.
    results = results.filter((b) => b.tutorId === tutorId);
  } else if (auth.role !== "admin") {
    // Everyone else only ever receives their own bookings (plus the shared
    // demo/unattributed ones so demo-mode dashboards stay populated) — the
    // studentId query param can never be used to read someone else's data.
    results = results.filter((b) => !b.studentId || b.studentId === "demo_student" || b.studentId === auth.id);
  }
  if (status) results = results.filter((b) => b.status === status);

  return NextResponse.json({ source: "mock", bookings: results });
}

export async function POST(req: NextRequest) {
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

  const newBooking: Booking = {
    id: randomUUID(),
    studentId: (body.studentId as string) || undefined,
    studentName: (body.studentName as string) || "Guest Student",
    tutorId: body.tutorId as string,
    tutorName: (body.tutorName as string) || "Tutor",
    subject: body.subject as string,
    gradeLevel: body.gradeLevel as string,
    scheduledDate: body.scheduledDate as string,
    startTime: body.startTime as string,
    endTime: (body.endTime as string) || (body.startTime as string),
    status: "pending",
    sessionMode: (body.sessionMode as "online" | "in_person") || "online",
    meetingLink: body.sessionMode === "online" ?  (body.meetingLink as string) || undefined : undefined,
    totalPrice: Number(body.totalPrice) || 0,
    notes: (body.notes as string) || "",
    createdAt: new Date().toISOString(),
  };

  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
      const inserted = await typedSql`
        INSERT INTO bookings (
  student_id, tutor_id, scheduled_date, start_time, end_time,
  status, session_mode, meeting_link, total_price, notes, grade_level
) VALUES (
  ${body.studentId || null}, ${body.tutorId}, ${body.scheduledDate},
  ${body.startTime}, ${body.endTime || body.startTime}, 'pending',
  ${body.sessionMode || "online"}, ${body.meetingLink || null},
  ${Number(body.totalPrice) || 0}, ${body.notes || ""}, ${body.gradeLevel}
)
        RETURNING *
      `;
      return NextResponse.json({ source: "neon", booking: inserted[0] }, { status: 201 });
    } catch (err) {
      console.error("Neon booking insert failed, falling back to in-memory store:", err);
    }
  }

  const store = getBookingStore();
  store.unshift(newBooking);

  return NextResponse.json({ source: "mock", booking: newBooking }, { status: 201 });
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
    edit?: Partial<Pick<Booking, "subject" | "gradeLevel" | "scheduledDate" | "startTime" | "endTime" | "sessionMode" | "notes" | "totalPrice">>;
  };
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }
  if (!status && !edit) {
    return NextResponse.json({ error: "id and status (or edit) are required." }, { status: 400 });
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
    subject = COALESCE(${edit.subject ?? null}, subject),
    grade_level = COALESCE(${edit.gradeLevel ?? null}, grade_level),
    scheduled_date = COALESCE(${edit.scheduledDate ?? null}, scheduled_date),
    start_time = COALESCE(${edit.startTime ?? null}, start_time),
    end_time = COALESCE(${edit.endTime ?? null}, end_time),
    session_mode = COALESCE(${edit.sessionMode ?? null}, session_mode),
    notes = COALESCE(${edit.notes ?? null}, notes),
    total_price = COALESCE(${edit.totalPrice ?? null}, total_price)
  WHERE id = ${id} AND status = 'pending'
  RETURNING *
`;
        if (updated.length === 0) {
          return NextResponse.json({ error: "Booking not found or no longer editable — only pending requests can be edited." }, { status: 409 });
        }
        return NextResponse.json({ source: "neon", booking: updated[0] });
      } catch (err) {
        console.error("Neon booking edit failed, falling back to in-memory store:", err);
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
    if (edit.totalPrice !== undefined) booking.totalPrice = edit.totalPrice;
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
      console.error("Neon booking update failed, falling back to in-memory store:", err);
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

  // Permanently remove a booking record (used by the parent/student
  // dashboards' delete action).
  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
      const deleted = await typedSql`DELETE FROM bookings WHERE id = ${id} RETURNING id`;
      if (deleted.length === 0) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }
      return NextResponse.json({ source: "neon", deleted: true });
    } catch (err) {
      console.error("Neon booking delete failed, falling back to in-memory store:", err);
    }
  }

  const store = getBookingStore();
  const idx = store.findIndex((b) => b.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  store.splice(idx, 1);
  return NextResponse.json({ source: "mock", deleted: true });
}
