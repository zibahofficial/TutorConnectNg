import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { hasDatabase, sql } from "@/db/neon";
import type { Review } from "@/lib/types";

export const runtime = "nodejs";

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

declare global {
  var __tutorconnect_reviews__: Record<string, Review[]> | undefined;
}

function getReviewStore(): Record<string, Review[]> {
  if (!global.__tutorconnect_reviews__) {
    global.__tutorconnect_reviews__ = {};
  }
  return global.__tutorconnect_reviews__;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { bookingId, tutorId, studentName, rating, comment } = body as {
    bookingId: string;
    tutorId: string;
    studentName: string;
    rating: number;
    comment: string;
  };

  if (!tutorId || !studentName || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "tutorId, studentName, and a valid rating are required." }, { status: 400 });
  }

  const review: Review = {
    id: randomUUID(),
    studentName,
    rating,
    comment: comment || "",
    createdAt: new Date().toISOString(),
  };

  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
      const inserted = await typedSql`
        INSERT INTO reviews (booking_id, tutor_id, student_name, rating, comment)
        VALUES (${bookingId || null}, ${tutorId}, ${studentName}, ${rating}, ${comment || ""})
        RETURNING id, student_name AS "studentName", rating, comment, created_at AS "createdAt"
      `;
      return NextResponse.json({ source: "neon", review: inserted[0] }, { status: 201 });
    } catch (err) {
      console.error("Neon review insert failed, falling back to in-memory store:", err);
    }
  }

  const store = getReviewStore();
  if (!store[tutorId]) store[tutorId] = [];
  store[tutorId].push(review);
  return NextResponse.json({ source: "mock", review }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const tutorId = params.get("tutorId");

  if (!tutorId) {
    return NextResponse.json({ error: "tutorId query param is required." }, { status: 400 });
  }

  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
      const rows = await typedSql`
        SELECT id, student_name AS "studentName", rating, comment, created_at AS "createdAt"
        FROM reviews
        WHERE tutor_id = ${tutorId}
        ORDER BY created_at DESC
      `;
      return NextResponse.json({ source: "neon", reviews: rows });
    } catch (err) {
      console.error("Neon review query failed, falling back to in-memory store:", err);
    }
  }

  const store = getReviewStore();
  return NextResponse.json({ source: "mock", reviews: store[tutorId] || [] });
}
