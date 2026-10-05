import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { hasDatabase, sql } from "@/db/neon";
import { getUserStore, verifyToken } from "@/lib/auth-store";
import { getTutorById } from "@/lib/mock-data";
import type { ChatMessage, ChatConversation } from "@/lib/types";

export const runtime = "nodejs";

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

declare global {
  var __tutorconnect_messages__: ChatMessage[] | undefined;
}

function getMessageStore(): ChatMessage[] {
  if (!global.__tutorconnect_messages__) {
    global.__tutorconnect_messages__ = [];
  }
  return global.__tutorconnect_messages__;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

function getAuthUser(req: NextRequest): AuthUser | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "") || req.nextUrl.searchParams.get("token") || "";
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = getUserStore().get(payload.email);
  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    fullName: user?.fullName ?? payload.email.split("@")[0],
  };
}

/** Best-effort display-name resolution for a party key (tutor, user, or booking party). */
async function resolveName(key: string): Promise<string | null> {
  if (!key) return null;
  const tutor = getTutorById(key);
  if (tutor?.fullName) return tutor.fullName;
  for (const u of getUserStore().values()) {
    if (u.id === key) return u.fullName;
  }
  const bookings = global.__tutorconnect_bookings__ ?? [];
  const asTutor = bookings.find((b) => b.tutorId === key);
  if (asTutor?.tutorName) return asTutor.tutorName;
  const asStudent = bookings.find((b) => b.studentId === key);
  if (asStudent?.studentName) return asStudent.studentName;
  if (hasDatabase && UUID_RE.test(key)) {
    try {
      const typedSql = sql as unknown as SqlTag;
      const rows = await typedSql`SELECT full_name FROM users WHERE id = ${key} LIMIT 1`;
      const name = rows[0]?.full_name;
      if (name) return String(name);
    } catch {
      // fall through
    }
  }
  return null;
}

function rowToMessage(r: Record<string, unknown>): ChatMessage {
  const createdAt = r.created_at instanceof Date ? (r.created_at as Date).toISOString() : String(r.created_at ?? "");
  return {
    id: String(r.id),
    senderKey: String(r.sender_key),
    senderName: String(r.sender_name ?? ""),
    recipientKey: String(r.recipient_key),
    recipientName: String(r.recipient_name ?? ""),
    body: String(r.body ?? ""),
    createdAt,
  };
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  // Every user chats strictly as their own account — no impersonation.
  const myKey = auth.id;

  const withKey = params.get("with");
  const wantConversations = params.get("conversations") === "1";

  try {
    if (withKey) {
      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          const rows = await typedSql`
            SELECT id, sender_key, sender_name, recipient_key, recipient_name, body, created_at
            FROM messages
            WHERE (sender_key = ${myKey} AND recipient_key = ${withKey})
               OR (sender_key = ${withKey} AND recipient_key = ${myKey})
            ORDER BY created_at ASC
            LIMIT 500
          `;
          return NextResponse.json({ source: "neon", messages: rows.map(rowToMessage) });
        } catch (err) {
          console.error("Neon messages query failed, falling back to in-memory store:", err);
        }
      }
      const store = getMessageStore();
      const messages = store
        .filter(
          (m) =>
            (m.senderKey === myKey && m.recipientKey === withKey) ||
            (m.senderKey === withKey && m.recipientKey === myKey)
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return NextResponse.json({ source: "mock", messages });
    }

    if (wantConversations) {
      const collect = (all: ChatMessage[]): ChatConversation[] => {
        const byPartner = new Map<string, ChatMessage>();
        for (const m of all) {
          const partnerKey = m.senderKey === myKey ? m.recipientKey : m.senderKey;
          const prev = byPartner.get(partnerKey);
          if (!prev || m.createdAt > prev.createdAt) byPartner.set(partnerKey, m);
        }
        return Array.from(byPartner.entries()).map(([partnerKey, last]) => ({
          partnerKey,
          partnerName: last.senderKey === myKey ? last.recipientName : last.senderName,
          lastBody: last.body,
          lastAt: last.createdAt,
          lastFromMe: last.senderKey === myKey,
        }));
      };

      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          const rows = await typedSql`
            SELECT id, sender_key, sender_name, recipient_key, recipient_name, body, created_at
            FROM messages
            WHERE sender_key = ${myKey} OR recipient_key = ${myKey}
            ORDER BY created_at DESC
            LIMIT 500
          `;
          return NextResponse.json({ source: "neon", conversations: collect(rows.map(rowToMessage)) });
        } catch (err) {
          console.error("Neon conversations query failed, falling back to in-memory store:", err);
        }
      }
      const store = getMessageStore();
      return NextResponse.json({ source: "mock", conversations: collect(store) });
    }
  } catch (err) {
    console.error("Messages GET error:", err);
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
  }

  return NextResponse.json({ error: "Provide ?with=<id> or ?conversations=1." }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const to = String(body.to || "").trim();
  const text = String(body.body || "").trim().slice(0, 2000);

  if (!to) return NextResponse.json({ error: "Recipient (to) is required." }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  if (to === auth.id) {
    return NextResponse.json({ error: "Cannot message yourself." }, { status: 400 });
  }

  const senderKey = auth.id;
  const senderName = auth.fullName;
  const recipientName = (await resolveName(to)) ?? "User";

  const message: ChatMessage = {
    id: randomUUID(),
    senderKey,
    senderName,
    recipientKey: to,
    recipientName,
    body: text,
    createdAt: new Date().toISOString(),
  };

  if (hasDatabase) {
    try {
      const typedSql = sql as unknown as SqlTag;
      const inserted = await typedSql`
        INSERT INTO messages (sender_key, sender_name, recipient_key, recipient_name, body)
        VALUES (${senderKey}, ${senderName}, ${to}, ${recipientName}, ${text})
        RETURNING id, sender_key, sender_name, recipient_key, recipient_name, body, created_at
      `;
      return NextResponse.json({ source: "neon", message: rowToMessage(inserted[0]) }, { status: 201 });
    } catch (err) {
      console.error("Neon message insert failed, falling back to in-memory store:", err);
    }
  }

  getMessageStore().push(message);
  return NextResponse.json({ source: "mock", message }, { status: 201 });
}
