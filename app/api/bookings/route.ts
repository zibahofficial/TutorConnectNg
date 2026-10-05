import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { hasDatabase, sql } from "@/db/neon";
import { BOOKINGS } from "@/lib/mock-data";
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

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const tutorId = params.get("tutorId");
  const status = params.get("status");
  const studentId = params.get("studentId");

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
          ORDER BY b.created_at DESC LIMIT 100
        `;
      } else if (studentId) {
        rows = await typedSql`
          SELECT b.*, u.full_name AS student_name
          FROM bookings b LEFT JOIN users u ON u.id = b.student_id
          WHERE b.student_id = ${studentId}
          ORDER BY b.created_at DESC LIMIT 100
        `;
      } else {
        rows = await typedSql`
          SELECT b.*, u.full_name AS student_name
          FROM bookings b LEFT JOIN users u ON u.id = b.student_id
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
  if (tutorId) results = results.filter((b) => b.tutorId === tutorId);
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
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, status, meetingLink } = body as {
  id: string;
  status: Booking["status"];
  meetingLink?: string;
};
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required." }, { status: 400 });
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
