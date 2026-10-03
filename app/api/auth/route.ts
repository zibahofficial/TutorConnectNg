import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { hasDatabase, sql } from "@/db/neon";
import { getUserStore } from "@/lib/auth-store";
import type { UserRole } from "@/lib/types";

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET || "tutorconnect-ng-dev-secret";

function signToken(payload: { id: string; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = (body.action as string) || "login";
  const email = ((body.email as string) || "").toLowerCase().trim();
  const password = (body.password as string) || "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  try {
    if (action === "signup") {
      const fullName = (body.fullName as string) || "New User";
      const role = ((body.role as UserRole) || "student") as UserRole;

if (role === "admin") {
  return NextResponse.json(
    { error: "Admin accounts cannot be created through public signup." },
    { status: 403 }
  );
}
      const phone = (body.phone as string) || null;
      const city = (body.city as string) || null;
      const state = (body.state as string) || null;
      const passwordHash = await bcrypt.hash(password, 10);
      const childName = (body.childName as string) || null;
const childAge = body.childAge ? Number(body.childAge) : null;
const educationalLevel = (body.educationLevel as string) || null;
const tutorBudget = body.tutorBudget ? Number(body.tutorBudget) : null;
const learningMode = (body.learningMode as string) || null;
const agreeTerms = body.agreeTerms === true;
if (role === "parent" && !agreeTerms) {
  return NextResponse.json(
    { error: "Please agree to the terms of service and privacy policy." },
    { status: 400 }
  );
}
      if (hasDatabase) {
        const typedSql = sql as unknown as SqlTag;
        const existing = await typedSql`SELECT id FROM users WHERE email = ${email}`;
        if (existing.length > 0) {
          return NextResponse.json({ error: "Email already registered." }, { status: 409 });
        }
        const inserted = await typedSql`
          INSERT INTO users (email, password_hash, full_name, role, phone, city, state)
          VALUES (${email}, ${passwordHash}, ${fullName}, ${role}, ${phone}, ${city}, ${state})
          RETURNING id, email, full_name, role, phone, city, state
        `;
       const user = inserted[0];

if (role === "parent") {
  await typedSql`
    INSERT INTO parent_profiles (
      user_id,
      child_name,
      child_age,
      educational_level,
      tutor_budget,
      learning_mode,
      terms_agreed_at
    )
    VALUES (
      ${user.id},
      ${childName},
      ${childAge},
      ${educationalLevel},
      ${tutorBudget},
      ${learningMode},
      NOW()
    )
  `;
}

const token = signToken({ id: user.id as string, email, role });
return NextResponse.json({ token, user });
      }

      const store = getUserStore();
      if (store.has(email)) {
        return NextResponse.json({ error: "Email already registered." }, { status: 409 });
      }
      const id = randomUUID();
      store.set(email, {
        id,
        email,
        passwordHash,
        fullName,
        role,
        phone: phone ?? undefined,
        city: city ?? undefined,
        state: state ?? undefined,
        createdAt: new Date().toISOString(),
      });
      const token = signToken({ id, email, role });
      return NextResponse.json({
        token,
        user: { id, email, full_name: fullName, role, phone, city, state },
        demo: true,
      });
    }


    if (action === "login") {
      if (hasDatabase) {
        const typedSql = sql as unknown as SqlTag;
        const rows = await typedSql`SELECT * FROM users WHERE email = ${email}`;
        const user = rows[0];
        if (!user) {
          return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }
        const valid = await bcrypt.compare(password, user.password_hash as string);
        if (!valid) {
          return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }
        const token = signToken({ id: user.id as string, email, role: user.role as string });
        return NextResponse.json({
          token,
          user: { id: user.id, email, full_name: user.full_name, role: user.role },
        });
      }

      const store = getUserStore();
      const user = store.get(email);
      if (!user) {
        return NextResponse.json(
          { error: "No demo account found. Please sign up first (no live database is connected)." },
          { status: 401 }
        );
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }
      const token = signToken({ id: user.id, email, role: user.role });
      return NextResponse.json({
        token,
        user: { id: user.id, email, full_name: user.fullName, role: user.role },
        demo: true,
      });
     }

     if (action === "delete_account") {
       const userEmail = email;
       const store = getUserStore();
       const user = store.get(userEmail);
       if (!user) {
         return NextResponse.json({ error: "Account not found." }, { status: 404 });
       }

       if (user.role === "admin") {
         return NextResponse.json({ error: "Admin accounts cannot be deleted through this action." }, { status: 403 });
       }

       if (hasDatabase) {
         try {
           const typedSql = sql as unknown as SqlTag;
           await typedSql`DELETE FROM bookings WHERE student_id = ${user.id}`;
           await typedSql`DELETE FROM reviews WHERE student_id = ${user.id}`;
           await typedSql`DELETE FROM tutor_availability WHERE tutor_id = ${user.id}`;
           await typedSql`DELETE FROM tutor_subjects WHERE tutor_id = ${user.id}`;
           await typedSql`DELETE FROM tutor_profiles WHERE user_id = ${user.id}`;
           await typedSql`DELETE FROM users WHERE id = ${user.id}`;
         } catch (err) {
           console.error("Neon account deletion failed:", err);
         }
       }

       store.delete(userEmail);
       return NextResponse.json({ deleted: true, demo: true });
     }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Authentication failed. Please try again." }, { status: 500 });
  }
}
