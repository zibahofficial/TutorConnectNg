import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, sql } from "@/db/neon";
import { getUserStore, verifyToken } from "@/lib/auth-store";
import type { ChatMessage, ChatConversation } from "@/lib/types";

export const runtime = "nodejs";

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

interface ChatUser {
  id: string;
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
      const byUser = await typedSql`SELECT full_name FROM users WHERE id = ${key} LIMIT 1`;
      if (byUser[0]?.full_name) return String(byUser[0].full_name);
      // A tutor_profiles.id (the id used on tutor cards) resolves to its owner.
      const byProfile = await typedSql`
        SELECT u.full_name
        FROM tutor_profiles tp JOIN users u ON u.id = tp.user_id
        WHERE tp.id = ${key} LIMIT 1
      `;
      if (byProfile[0]?.full_name) return String(byProfile[0].full_name);
    } catch (err) {
      console.error("Chat partner name lookup failed:", err);
    }
  }
  return null;
}

async function resolveChatUser(key: string): Promise<ChatUser | null> {
  if (!key) return null;
  if (hasDatabase) {
    if (!UUID_RE.test(key)) return null;
    const typedSql = sql as unknown as SqlTag;
    const rows = await typedSql`
      SELECT id, role, full_name
      FROM users
      WHERE id = ${key} AND role IN ('student', 'parent', 'tutor', 'admin')
      LIMIT 1
    `;
    const row = rows[0];
    return row
      ? { id: String(row.id), role: String(row.role), fullName: String(row.full_name || "User") }
      : null;
  }
  const user = Array.from(getUserStore().values()).find((candidate) => candidate.id === key);
  return user ? { id: user.id, role: user.role, fullName: user.fullName } : null;
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
  if (!hasDatabase) {
    return NextResponse.json({ error: "Private messaging is temporarily unavailable." }, { status: 503 });
  }

  // Every user chats strictly as their own account — no impersonation.
  const myKey = auth.id;

  const withKey = params.get("with");
  const wantConversations = params.get("conversations") === "1";

  try {
    if (withKey) {
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
        console.error("Neon messages query failed:", err);
        return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
      }
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
        console.error("Neon conversations query failed:", err);
        return NextResponse.json({ error: "Could not load conversations." }, { status: 500 });
      }
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
  if (!hasDatabase) {
    return NextResponse.json({ error: "Private messaging is temporarily unavailable." }, { status: 503 });
  }

  const to = String(body.to || "").trim();
  const text = String(body.body || "").trim().slice(0, 2000);

  if (!to) return NextResponse.json({ error: "Recipient (to) is required." }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  if (to === auth.id) {
    return NextResponse.json({ error: "Cannot message yourself." }, { status: 400 });
  }

  let recipient: ChatUser | null;
  try {
    recipient = await resolveChatUser(to);
  } catch (err) {
    console.error("Chat recipient lookup failed:", err);
    return NextResponse.json({ error: "Could not verify the chat recipient." }, { status: 500 });
  }
  if (!recipient || recipient.role === auth.role) {
    return NextResponse.json({ error: "That user is not an available chat contact." }, { status: 403 });
  }

  const senderKey = auth.id;
  const senderName = (await resolveName(auth.id)) ?? auth.fullName;
  const recipientName = recipient.fullName;

  try {
    const typedSql = sql as unknown as SqlTag;
    const inserted = await typedSql`
      INSERT INTO messages (sender_key, sender_name, recipient_key, recipient_name, body)
      VALUES (${senderKey}, ${senderName}, ${to}, ${recipientName}, ${text})
      RETURNING id, sender_key, sender_name, recipient_key, recipient_name, body, created_at
    `;
    return NextResponse.json({ source: "neon", message: rowToMessage(inserted[0]) }, { status: 201 });
  } catch (err) {
    console.error("Neon message insert failed:", err);
    return NextResponse.json({ error: "Message could not be saved." }, { status: 500 });
  }
}
