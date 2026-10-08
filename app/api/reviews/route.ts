import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, sql } from "@/db/neon";
import { verifyToken } from "@/lib/auth-store";

export const runtime = "nodejs";

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

type AuthPayload = { id: string; email: string; role: string };

function authenticate(req: NextRequest): AuthPayload | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return token ? verifyToken(token) : null;
}

function databaseUnavailable() {
  return NextResponse.json(
    { error: "Review persistence is temporarily unavailable." },
    { status: 503 }
  );
}

export async function POST(req: NextRequest) {
  const auth = authenticate(req);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (auth.role !== "student" && auth.role !== "parent" && auth.role !== "admin") {
    return NextResponse.json(
      { error: "Only students, parents, and admins can submit reviews." },
      { status: 403 }
    );
  }
  if (!hasDatabase) return databaseUnavailable();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rating = Number(body.rating);
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be an integer from 1 to 5." }, { status: 400 });
  }

  const typedSql = sql as unknown as SqlTag;

  try {
    // The reviewer's display name always comes from the authenticated
    // account — never from the request body.
    const userRows = await typedSql`
      SELECT full_name FROM users WHERE id = ${auth.id} LIMIT 1
    `;
    const reviewerName = String(
      (userRows[0] as Record<string, unknown> | undefined)?.full_name ??
        (auth.role === "admin" ? "Admin" : "Student")
    );

    if (auth.role === "admin") {
      // Admins submit free-form tutor reviews: no booking is attached, so an
      // admin can never impersonate a student or review someone else's
      // booking. The review stays associated with the tutor profile being
      // reviewed (validated to exist below).
      const tutorId = typeof body.tutorId === "string" ? body.tutorId.trim() : "";
      if (!tutorId) {
        return NextResponse.json({ error: "tutorId is required." }, { status: 400 });
      }
      const tutorRows = await typedSql`
        SELECT id FROM tutor_profiles WHERE id = ${tutorId} LIMIT 1
      `;
      if (!tutorRows[0]) {
        return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
      }
      const inserted = await typedSql`
        INSERT INTO reviews (booking_id, student_id, tutor_id, rating, comment)
        VALUES (NULL, ${auth.id}, ${tutorId}, ${rating}, ${comment})
        RETURNING id, booking_id, student_id, tutor_id, rating, comment, created_at
      `;
      // The reviewer's name is not stored on the row — it is always resolved
      // through reviews.student_id -> users.id -> users.full_name.
      return NextResponse.json(
        { source: "neon", review: { ...inserted[0], student_name: reviewerName } },
        { status: 201 }
      );
    }

    // Students and parents review their own completed bookings.
    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required." }, { status: 400 });
    }

    // Derive ownership and tutor identity from PostgreSQL. Browser-supplied
    // student/tutor identifiers are deliberately ignored.
    const bookingRows = await typedSql`
      SELECT b.id, b.student_id, b.tutor_id, b.status,
             EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id) AS already_reviewed
      FROM bookings b
      WHERE b.id = ${bookingId}
      LIMIT 1
    `;
    const booking = bookingRows[0];

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (String(booking.student_id ?? "") !== auth.id) {
      return NextResponse.json(
        { error: "You can only review your own booking." },
        { status: 403 }
      );
    }
    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "A review can only be submitted after the booking is completed." },
        { status: 409 }
      );
    }
    if (booking.already_reviewed === true) {
      return NextResponse.json(
        { error: "A review has already been submitted for this booking." },
        { status: 409 }
      );
    }

    const inserted = await typedSql`
      INSERT INTO reviews (booking_id, student_id, tutor_id, rating, comment)
      VALUES (${bookingId}, ${auth.id}, ${booking.tutor_id}, ${rating}, ${comment})
      RETURNING id, booking_id, student_id, tutor_id, rating, comment, created_at
    `;

    // Same here: the display name comes from the users table, not the row.
    return NextResponse.json(
      { source: "neon", review: { ...inserted[0], student_name: reviewerName } },
      { status: 201 }
    );
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "A review has already been submitted for this booking." },
        { status: 409 }
      );
    }
    console.error("Neon review insert failed:", err);
    return NextResponse.json(
      { error: "The review could not be saved. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  if (!hasDatabase) return databaseUnavailable();

  const params = req.nextUrl.searchParams;
  const mine = params.get("mine") === "true";
  const typedSql = sql as unknown as SqlTag;

  try {
    if (mine) {
      const auth = authenticate(req);
      if (!auth) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      }
      if (auth.role !== "student" && auth.role !== "parent") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
      }
      const rows = await typedSql`
        SELECT booking_id
        FROM reviews
        WHERE student_id = ${auth.id} AND booking_id IS NOT NULL
      `;
      return NextResponse.json({
        source: "neon",
        bookingIds: rows.map((row) => String(row.booking_id)),
      });
    }

    const tutorId = params.get("tutorId");
    if (!tutorId) {
      return NextResponse.json({ error: "tutorId query param is required." }, { status: 400 });
    }

    const rows = await typedSql`
      SELECT r.id, r.booking_id, r.student_id, r.tutor_id, r.rating, r.comment, r.created_at,
             u.full_name AS student_name
      FROM reviews r
      LEFT JOIN users u ON u.id = r.student_id
      WHERE r.tutor_id = ${tutorId}
      ORDER BY r.created_at DESC
    `;
    return NextResponse.json({ source: "neon", reviews: rows });
  } catch (err) {
    console.error("Neon review query failed:", err);
    return NextResponse.json(
      { error: "Reviews could not be loaded. Please try again." },
      { status: 500 }
    );
  }
}
