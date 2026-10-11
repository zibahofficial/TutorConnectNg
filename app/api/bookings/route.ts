import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
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
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const params = req.nextUrl.searchParams;
  const tutorId = params.get("tutorId");
  const status = params.get("status");

  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;

      const rows = await typedSql`
        SELECT
          b.*,
          u.full_name AS student_name,
          tu.full_name AS tutor_name,
          ts.subject_name AS subject
        FROM bookings b
        LEFT JOIN users u ON u.id = b.student_id
        LEFT JOIN tutor_profiles tp ON tp.id = b.tutor_id
        LEFT JOIN users tu ON tu.id = tp.user_id
        LEFT JOIN tutor_subjects ts ON ts.id = b.subject_id
        WHERE
          (
            ${auth.role === "admin"}
            OR (
              ${auth.role === "tutor"}
              AND b.tutor_id IN (
                SELECT id
                FROM tutor_profiles
                WHERE user_id = ${auth.id}
              )
            )
            OR (
              ${auth.role !== "admin" && auth.role !== "tutor"}
              AND b.student_id = ${auth.id}
            )
          )
          AND (${tutorId === null} OR b.tutor_id = ${tutorId})
          AND (${status === null} OR b.status = ${status})
        ORDER BY b.created_at DESC
        LIMIT 100
      `;

      return NextResponse.json({
        source: "neon",
        bookings: rows.map(mapBookingRow),
      });
               } catch (err) {
        console.error("Neon bookings query failed:", err);

        return NextResponse.json(
          { error: "Could not load bookings. Please try again." },
          { status: 500 }
        );
      }
    }
  // Local/demo mode: retain the existing in-memory booking store.
  let results = getBookingStore();

  if (auth.role === "admin") {
    if (tutorId) {
      results = results.filter((b) => b.tutorId === tutorId);
    }
  } else if (auth.role === "tutor") {
    if (tutorId) {
      results = results.filter((b) => b.tutorId === auth.id);
    } else {
      results = results.filter((b) => b.tutorId === auth.id);
    }
  } else {
    results = results.filter((b) => b.studentId === auth.id);

    if (tutorId) {
      results = results.filter((b) => b.tutorId === tutorId);
    }
  }

  if (status) {
    results = results.filter((b) => b.status === status);
  }

  return NextResponse.json({
    source: "mock",
    bookings: results,
  });
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
      // `bookings` stores the subject as a reference to the tutor's own
      // subject row, so map the submitted subject name onto tutor_subjects.id
      // (otherwise the saved booking has no subject at all).
      const subjectName = typeof body.subject === "string" ? body.subject.trim() : "";
      let subjectId: string | null = null;
      if (subjectName) {
        const subjectRows = await typedSql`
          SELECT id FROM tutor_subjects
          WHERE tutor_id = ${body.tutorId} AND subject_name = ${subjectName}
          LIMIT 1
        `;
        subjectId = subjectRows[0]?.id ? String(subjectRows[0].id) : null;
      }
      const inserted = await typedSql`
        INSERT INTO bookings (
  student_id, tutor_id, subject_id, scheduled_date, start_time, end_time,
  status, session_mode, meeting_link, total_price, notes, grade_level
) VALUES (
  ${body.studentId || null}, ${body.tutorId}, ${subjectId}, ${body.scheduledDate},
  ${body.startTime}, ${body.endTime || body.startTime}, 'pending',
  ${body.sessionMode || "online"}, ${body.meetingLink || null},
  ${Number(body.totalPrice) || 0}, ${body.notes || ""}, ${body.gradeLevel}
)
        RETURNING *
      `;
      return NextResponse.json({ source: "neon", booking: inserted[0] }, { status: 201 });
    } catch (err) {
      console.error("Neon booking insert failed, falling back to the in-memory store:", err);
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
    // Allow the owning tutor to send or update a meeting link
  // for an accepted online booking without changing its status.
  if (
    !status &&
    !edit &&
    Object.prototype.hasOwnProperty.call(body, "meetingLink")
  ) {
    if (auth.role !== "tutor") {
      return NextResponse.json(
        { error: "Only tutors can update meeting links." },
        { status: 403 }
      );
    }

    const link =
      typeof meetingLink === "string" ? meetingLink.trim() : "";

    let parsedLink: URL;

    try {
      parsedLink = new URL(link);
    } catch {
      return NextResponse.json(
        { error: "Enter a valid meeting URL." },
        { status: 400 }
      );
    }

    if (
      !link ||
      (parsedLink.protocol !== "https:" &&
        parsedLink.protocol !== "http:")
    ) {
      return NextResponse.json(
        {
          error: "The meeting link must be a valid HTTP or HTTPS URL.",
        },
        { status: 400 }
      );
    }

    if (!hasDatabase) {
      return NextResponse.json(
        {
          error:
            "The database is unavailable. The meeting link was not saved.",
        },
        { status: 503 }
      );
    }

    try {
      const typedSql = sql as unknown as SqlTag;

      const updated = await typedSql`
        UPDATE bookings AS b
        SET meeting_link = ${link}
        WHERE b.id = ${id}
          AND b.status = 'accepted'
          AND b.session_mode = 'online'
          AND EXISTS (
            SELECT 1
            FROM tutor_profiles AS tp
            WHERE tp.id = b.tutor_id
              AND tp.user_id = ${auth.id}
          )
        RETURNING b.id
      `;

      if (updated.length === 0) {
        return NextResponse.json(
          {
            error:
              "No accepted online booking belonging to your account was found.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        source: "neon",
        id,
        meetingLink: link,
        message: "Meeting link saved successfully.",
      });
    } catch (err) {
      console.error("Meeting link update failed:", err);

      return NextResponse.json(
        {
          error:
            "The meeting link could not be saved. Please try again.",
        },
        { status: 500 }
      );
    }
  }
  if (!status && !edit) {
    return NextResponse.json({ error: "id and status (or edit) are required." }, { status: 400 });
  }

    // Edit booking details only when the booking is pending
  // and the authenticated user is authorized to edit it.
  if (edit) {
    const canEditBooking =
      auth.role === "admin" ||
      auth.role === "student" ||
      auth.role === "parent";

    if (!canEditBooking) {
      return NextResponse.json(
        { error: "You are not authorized to edit this booking." },
        { status: 403 }
      );
    }

    if (hasDatabase) {
      try {
        const typedSql = sql as unknown as SqlTag;

        const updated = await typedSql`
          UPDATE bookings
          SET
            subject_id = COALESCE(
              (
                SELECT ts.id
                FROM tutor_subjects ts
                WHERE ts.tutor_id = bookings.tutor_id
                  AND ts.subject_name = ${edit.subject ?? null}
                LIMIT 1
              ),
              subject_id
            ),
            grade_level = COALESCE(${edit.gradeLevel ?? null}, grade_level),
            scheduled_date = COALESCE(${edit.scheduledDate ?? null}, scheduled_date),
            start_time = COALESCE(${edit.startTime ?? null}, start_time),
            end_time = COALESCE(${edit.endTime ?? null}, end_time),
            session_mode = COALESCE(${edit.sessionMode ?? null}, session_mode),
            notes = COALESCE(${edit.notes ?? null}, notes),
            total_price = COALESCE(${edit.totalPrice ?? null}, total_price)
         WHERE id = ${id}
  AND status = 'pending'
  AND (
    ${auth.role === "admin"}
    OR (
      ${auth.role === "student" || auth.role === "parent"}
      AND student_id = ${auth.id}
    )
  )
          RETURNING *
        `;

        if (updated.length === 0) {
          return NextResponse.json(
            {
              error:
                "Booking not found, not owned by your account, or no longer editable.",
            },
            { status: 409 }
          );
        }

        return NextResponse.json({
          source: "neon",
          booking: updated[0],
        });
      } catch (err) {
        console.error("Neon booking edit failed:", err);

        return NextResponse.json(
          {
            error: "The booking could not be updated. Please try again.",
          },
          { status: 500 }
        );
      }
    }

    // In-memory fallback is for local/demo mode only.
    const store = getBookingStore();
    const booking = store.find((b) => b.id === id);

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }
    const isAdmin = auth.role === "admin";

    const tutorOwnsBooking =
      auth.role === "tutor" &&
      booking.tutorId === auth.id &&
      (
        (booking.status === "pending" &&
          (status === "accepted" || status === "rejected")) ||
        (booking.status === "accepted" && status === "completed")
      );

    const studentOwnsBooking =
      (auth.role === "student" || auth.role === "parent") &&
      booking.studentId === auth.id &&
      status === "cancelled" &&
      (booking.status === "pending" || booking.status === "accepted");

    if (!isAdmin && !tutorOwnsBooking && !studentOwnsBooking) {
      return NextResponse.json(
        { error: "You are not authorized to perform this booking action." },
        { status: 403 }
      );
    }
    if (
      auth.role !== "admin" &&
      !(
        (auth.role === "student" || auth.role === "parent") &&
        booking.studentId === auth.id
      )
    ) {
      return NextResponse.json(
        { error: "You are not authorized to edit this booking." },
        { status: 403 }
      );
    }

    if (booking.status !== "pending") {
      return NextResponse.json(
        {
          error:
            "Only pending requests can be edited. This booking has already been processed.",
        },
        { status: 409 }
      );
    }

    if (edit.subject !== undefined) booking.subject = edit.subject;
    if (edit.gradeLevel !== undefined) booking.gradeLevel = edit.gradeLevel;
    if (edit.scheduledDate !== undefined) booking.scheduledDate = edit.scheduledDate;
    if (edit.startTime !== undefined) booking.startTime = edit.startTime;
    if (edit.endTime !== undefined) booking.endTime = edit.endTime;
    if (edit.sessionMode !== undefined) booking.sessionMode = edit.sessionMode;
    if (edit.notes !== undefined) booking.notes = edit.notes;
    if (edit.totalPrice !== undefined) booking.totalPrice = edit.totalPrice;

    return NextResponse.json({
      source: "mock",
      booking,
    });
  }
   // Status change path (accept / decline / cancel / complete)
  if (!status) {
    return NextResponse.json(
      { error: "status is required for status changes." },
      { status: 400 }
    );
  }

  const validStatuses: Booking["status"][] = [
    "pending",
    "accepted",
    "rejected",
    "completed",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid booking status." },
      { status: 400 }
    );
  }

  const tutorCanChangeStatus =
    auth.role === "tutor" &&
    ["accepted", "rejected", "completed"].includes(status);

  const studentOrParentCanCancel =
    (auth.role === "student" || auth.role === "parent") &&
    status === "cancelled";

  if (
    auth.role !== "admin" &&
    !tutorCanChangeStatus &&
    !studentOrParentCanCancel
  ) {
    return NextResponse.json(
      { error: "You are not authorized to perform this booking action." },
      { status: 403 }
    );
  }

  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
           const updated = await typedSql`
        UPDATE bookings AS b
        SET
          status = ${status},
          meeting_link = COALESCE(
            ${meetingLink || null},
            b.meeting_link
          )
        WHERE b.id = ${id}
          AND (
            ${auth.role === "admin"}
            OR (
              ${auth.role === "tutor"}
              AND b.tutor_id IN (
                SELECT id
                FROM tutor_profiles
                WHERE user_id = ${auth.id}
              )
              AND (
                (
                  b.status = 'pending'
                  AND ${status === "accepted" || status === "rejected"}
                )
                OR (
                  b.status = 'accepted'
                  AND ${status === "completed"}
                )
              )
            )
            OR (
              ${auth.role === "student" || auth.role === "parent"}
              AND b.student_id = ${auth.id}
              AND ${status === "cancelled"}
              AND b.status IN ('pending', 'accepted')
            )
          )
        RETURNING b.*
      `;

      if (updated.length === 0) {
        return NextResponse.json(
          {
            error:
              "Booking not found, or you are not authorized to change its status.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        source: "neon",
        booking: mapBookingRow(updated[0]),
      });

       } catch (err) {
      console.error("Neon booking update failed:", err);

      return NextResponse.json(
        {
          error: "The booking could not be updated. Please try again.",
        },
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
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const id = (body.id as string) || "";

  if (!id) {
    return NextResponse.json(
      { error: "id is required." },
      { status: 400 }
    );
  }

  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;

      const deleted = await typedSql`
        DELETE FROM bookings
        WHERE id = ${id}
          AND (
            ${auth.role === "admin"}
            OR (
              ${auth.role === "student" || auth.role === "parent"}
              AND student_id = ${auth.id}
            )
          )
        RETURNING id
      `;

      if (deleted.length === 0) {
        return NextResponse.json(
          {
            error:
              "Booking not found or you are not authorized to delete it.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        source: "neon",
        deleted: true,
      });
    } catch (err) {
      console.error("Neon booking delete failed:", err);

      return NextResponse.json(
        {
          error: "The booking could not be deleted. Please try again.",
        },
        { status: 500 }
      );
    }
  }

  // In-memory deletion is used only when database mode is disabled.
  const store = getBookingStore();
  const booking = store.find((b) => b.id === id);

  if (!booking) {
    return NextResponse.json(
      { error: "Booking not found." },
      { status: 404 }
    );
  }

  if (
    auth.role !== "admin" &&
    !(
      (auth.role === "student" || auth.role === "parent") &&
      booking.studentId === auth.id
    )
  ) {
    return NextResponse.json(
      { error: "You are not authorized to delete this booking." },
      { status: 403 }
    );
  }

  const idx = store.findIndex((b) => b.id === id);
  store.splice(idx, 1);

  return NextResponse.json({
    source: "mock",
    deleted: true,
  });
}
