import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { hasDatabase, sql } from "@/db/neon";
import { getUserStore, getChildStore, getSavedTutorStore, getAvailabilityStore, verifyToken, type StoredUser, type Child, type SavedTutor, type AvailabilitySlot } from "@/lib/auth-store";
import type { UserRole } from "@/lib/types";

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET;

function signToken(payload: { id: string; email: string; role: string }) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Configure it in your environment.");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

function validateGmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required.";
  if (trimmed !== trimmed.toLowerCase()) {
    return "Email must be all lowercase.";
  }
  if (!trimmed.endsWith("@gmail.com")) {
    return "Email must be a Gmail address ending with @gmail.com.";
  }
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/\d/.test(password)) return "Password must contain at least one number.";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) return "Password must contain at least one special character.";
  return null;
}

function getUserFromRequest(req: NextRequest, allowedRoles?: UserRole[]): { user: StoredUser; email: string; role: string } | NextResponse {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "") || req.nextUrl.searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  const store = getUserStore();
  const user = store.get(payload.email);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 401 });
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }
  return { user, email: payload.email, role: payload.role };
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = (body.action as string) || "login";

  try {
    if (action === "signup") {
      const email = ((body.email as string) || "").trim();
      const password = (body.password as string) || "";
      const fullName = (body.fullName as string) || "New User";
      const role = ((body.role as UserRole) || "student") as UserRole;

      if (role === "admin") {
        return NextResponse.json({ error: "Admin accounts cannot be created through public signup." }, { status: 403 });
      }

      const emailError = validateGmail(email);
      if (emailError) return NextResponse.json({ error: emailError }, { status: 400 });

      const emailLower = email.toLowerCase();

      const passwordError = validatePassword(password);
      if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

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
      const headline = (body.headline as string) || null;
      const bio = (body.bio as string) || null;
      const yearsExperience = body.yearsExperience ? Number(body.yearsExperience) : null;
      const hourlyRate = body.hourlyRate ? Number(body.hourlyRate) : null;
      const teachingMode = (body.teachingMode as string) || null;
      const subjects = (body.subjects as string[]) || [];
      const qualification = (body.qualification as string) || null;
      const avatarUrl = (body.avatarUrl as string) || null;

      if (role === "parent" && !agreeTerms) {
        return NextResponse.json({ error: "Please agree to the terms of service and privacy policy." }, { status: 400 });
      }

      if (hasDatabase) {
        const typedSql = sql as unknown as SqlTag;
        const existing = await typedSql`SELECT id FROM users WHERE email = ${emailLower}`;
        if (existing.length > 0) {
          return NextResponse.json({ error: "Email already registered." }, { status: 409 });
        }
        const inserted = await typedSql`
          INSERT INTO users (email, password_hash, full_name, role, phone, city, state, avatar_url)
          VALUES (${emailLower}, ${passwordHash}, ${fullName}, ${role}, ${phone}, ${city}, ${state}, ${avatarUrl})
          RETURNING id, email, full_name, role, phone, city, state, avatar_url
        `;
        const userRow = inserted[0];
        const user = userRow as Record<string, unknown>;

        if (role === "parent") {
          await typedSql`
            INSERT INTO parent_profiles (
              user_id, child_name, child_age, educational_level, tutor_budget, learning_mode, terms_agreed_at
            )
            VALUES (
              ${(user.id as string)}, ${childName}, ${childAge}, ${educationalLevel}, ${tutorBudget}, ${learningMode}, NOW()
            )
          `;
        }

        if (role === "tutor") {
          const tpInserted = await typedSql`
            INSERT INTO tutor_profiles (
              user_id, bio, headline, hourly_rate, curriculum, years_experience
            )
            VALUES (
              ${(user.id as string)}, ${bio}, ${headline}, ${hourlyRate}, ${"nigerian_national"}, ${yearsExperience}
            )
            RETURNING id
          `;
          const tpId = (tpInserted[0] as Record<string, unknown>).id as string;

          for (const sub of subjects) {
            await typedSql`
              INSERT INTO tutor_subjects (tutor_id, subject_name)
              VALUES (${tpId}, ${sub})
            `;
          }

          const avail: { day: string; start: string; end: string }[] = body.availability as { day: string; start: string; end: string }[] || [];
          for (const slot of avail) {
            const dayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
            await typedSql`
              INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time)
              VALUES (${tpId}, ${dayMap[slot.day] ?? 0}, ${slot.start}, ${slot.end})
            `;
          }
        }

        const token = signToken({ id: user.id as string, email: emailLower, role });
        return NextResponse.json({
          token,
          user: { id: user.id, email: emailLower, full_name: user.full_name, role, phone, city, state, avatarUrl: user.avatar_url },
        }, { status: 201 });
      }

      const store = getUserStore();
      if (store.has(emailLower)) {
        return NextResponse.json({ error: "Email already registered." }, { status: 409 });
      }
      const id = randomUUID();
      const newUser: StoredUser = {
        id,
        email: emailLower,
        passwordHash,
        fullName,
        role,
        phone: phone ?? undefined,
        city: city ?? undefined,
        state: state ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        headline: headline ?? undefined,
        bio: bio ?? undefined,
        yearsExperience: yearsExperience ?? undefined,
        hourlyRate: hourlyRate ?? undefined,
        teachingMode: teachingMode ?? undefined,
        subjects: subjects.length > 0 ? subjects : undefined,
        qualification: qualification ?? undefined,
        createdAt: new Date().toISOString(),
      };
      store.set(emailLower, newUser);
      const token = signToken({ id, email: emailLower, role });
      return NextResponse.json({
        token,
        user: { id, email: emailLower, full_name: fullName, role, phone: newUser.phone, city: newUser.city, state: newUser.state, avatarUrl: newUser.avatarUrl },
        demo: true,
      }, { status: 201 });
    }

    if (action === "login") {
      const email = ((body.email as string) || "").trim().toLowerCase();
      const password = (body.password as string) || "";

      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
      }

      if (hasDatabase) {
        const typedSql = sql as unknown as SqlTag;
        const rows = await typedSql`SELECT * FROM users WHERE email = ${email}`;
        const dbUser = rows[0];
        if (!dbUser) {
          return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }
        const valid = await bcrypt.compare(password, dbUser.password_hash as string);
        if (!valid) {
          return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }
        const token = signToken({ id: dbUser.id as string, email, role: dbUser.role as string });
        return NextResponse.json({
          token,
          user: {
            id: dbUser.id,
            email,
            full_name: dbUser.full_name,
            role: dbUser.role,
            phone: dbUser.phone,
            city: dbUser.city,
            state: dbUser.state,
            avatarUrl: dbUser.avatar_url,
          },
        });
      }

      const store = getUserStore();
      const user = store.get(email);
      if (!user) {
        return NextResponse.json({ error: "No account found with this email. Please sign up first." }, { status: 401 });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }
      const token = signToken({ id: user.id, email, role: user.role });
      return NextResponse.json({
        token,
        user: { id: user.id, email, full_name: user.fullName, role: user.role, phone: user.phone, city: user.city, state: user.state, avatarUrl: user.avatarUrl, headline: user.headline, bio: user.bio, yearsExperience: user.yearsExperience, hourlyRate: user.hourlyRate, subjects: user.subjects, qualification: user.qualification },
        demo: true,
      });
    }

    if (action === "update_profile") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;

      const updates = body.updates as Record<string, unknown> || {};
      const store = getUserStore();
      const user = auth.user;

      const updatable = ["fullName", "phone", "city", "state", "avatarUrl", "headline", "bio", "yearsExperience", "hourlyRate", "teachingMode", "subjects", "qualification"];
      for (const key of updatable) {
        if (updates[key] !== undefined) {
          (user as unknown as Record<string, unknown>)[key] = updates[key];
        }
      }

      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          await typedSql`
            UPDATE users SET full_name = ${user.fullName}, phone = ${user.phone ?? null}, city = ${user.city ?? null}, state = ${user.state ?? null}, avatar_url = ${user.avatarUrl ?? null}
            WHERE id = ${user.id}
          `;
          if (user.role === "tutor") {
            await typedSql`
              UPDATE tutor_profiles SET bio = ${user.bio ?? null}, headline = ${user.headline ?? null}, years_experience = ${user.yearsExperience ?? 0}, hourly_rate = ${user.hourlyRate ?? 0}
              WHERE user_id = ${user.id}
            `;
          }
        } catch (err) {
          console.error("Neon profile update failed:", err);
        }
      }

      return NextResponse.json({ success: true, user: { id: user.id, email: user.email, full_name: user.fullName, role: user.role, phone: user.phone, city: user.city, state: user.state, avatarUrl: user.avatarUrl, headline: user.headline, bio: user.bio, yearsExperience: user.yearsExperience, hourlyRate: user.hourlyRate, subjects: user.subjects, qualification: user.qualification } });
    }

    if (action === "delete_account") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;

      if (auth.user.role === "admin") {
        return NextResponse.json({ error: "Admin accounts cannot be deleted." }, { status: 403 });
      }

      const store = getUserStore();
      const children = getChildStore();
      children.delete(auth.user.id);
      const saved = getSavedTutorStore();
      const idx = saved.findIndex((s) => s.userId === auth.user.id);
      if (idx >= 0) saved.splice(idx, 1);
      const availStore = getAvailabilityStore();
      const availIdx = availStore.findIndex((a) => a.tutorId === auth.user.id);
      while (availIdx >= 0) {
        availStore.splice(availIdx, 1);
      }

      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          await typedSql`DELETE FROM bookings WHERE student_id = ${auth.user.id}`;
          await typedSql`DELETE FROM reviews WHERE student_id = ${auth.user.id}`;
          await typedSql`DELETE FROM tutor_availability WHERE tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = ${auth.user.id})`;
          await typedSql`DELETE FROM tutor_subjects WHERE tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = ${auth.user.id})`;
          await typedSql`DELETE FROM tutor_profiles WHERE user_id = ${auth.user.id}`;
          await typedSql`DELETE FROM parent_profiles WHERE user_id = ${auth.user.id}`;
          await typedSql`DELETE FROM users WHERE id = ${auth.user.id}`;
        } catch (err) {
          console.error("Neon account deletion failed:", err);
        }
      }

      store.delete(auth.user.email);
      return NextResponse.json({ deleted: true });
    }

    if (action === "get_user") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;
      const user = auth.user;
      return NextResponse.json({
        user: { id: user.id, email: user.email, full_name: user.fullName, role: user.role, phone: user.phone, city: user.city, state: user.state, avatarUrl: user.avatarUrl, headline: user.headline, bio: user.bio, yearsExperience: user.yearsExperience, hourlyRate: user.hourlyRate, subjects: user.subjects, qualification: user.qualification },
      });
    }

    if (action === "admin_list_users") {
      const auth = getUserFromRequest(req, ["admin"]);
      if (auth instanceof NextResponse) return auth;

      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          const rows = await typedSql`
            SELECT id, email, full_name, role, phone, city, state, avatar_url, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 100
          `;
          return NextResponse.json({ source: "neon", users: rows });
        } catch (err) {
          console.error("Neon user list failed:", err);
        }
      }

      const store = getUserStore();
      const users = Array.from(store.values()).map((u) => ({ id: u.id, email: u.email, full_name: u.fullName, role: u.role, phone: u.phone, city: u.city, state: u.state, avatar_url: u.avatarUrl, is_active: true, created_at: u.createdAt }));
      return NextResponse.json({ source: "mock", users });
    }

    if (action === "admin_delete_user") {
      const auth = getUserFromRequest(req, ["admin"]);
      if (auth instanceof NextResponse) return auth;

      const targetEmail = ((body.targetEmail as string) || "").trim().toLowerCase();
      if (!targetEmail) return NextResponse.json({ error: "Target email is required." }, { status: 400 });

      const store = getUserStore();
      const target = store.get(targetEmail);
      if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
      if (target.role === "admin") return NextResponse.json({ error: "Cannot delete an admin account." }, { status: 403 });

      store.delete(targetEmail);

      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          await typedSql`DELETE FROM bookings WHERE student_id = ${target.id}`;
          await typedSql`DELETE FROM reviews WHERE student_id = ${target.id}`;
          await typedSql`DELETE FROM tutor_availability WHERE tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = ${target.id})`;
          await typedSql`DELETE FROM tutor_subjects WHERE tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = ${target.id})`;
          await typedSql`DELETE FROM tutor_profiles WHERE user_id = ${target.id}`;
          await typedSql`DELETE FROM parent_profiles WHERE user_id = ${target.id}`;
          await typedSql`DELETE FROM users WHERE id = ${target.id}`;
        } catch (err) {
          console.error("Neon user deletion failed:", err);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === "admin_update_tutor_status") {
      const auth = getUserFromRequest(req, ["admin"]);
      if (auth instanceof NextResponse) return auth;

      const targetId = (body.targetId as string) || "";
      const isVerified = body.isVerified === true;
      if (!targetId) return NextResponse.json({ error: "targetId is required." }, { status: 400 });

      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          await typedSql`
            UPDATE tutor_profiles SET is_verified = ${isVerified}, verification_status = ${isVerified ? "approved" : "pending"}
            WHERE user_id = ${targetId}
          `;
        } catch (err) {
          console.error("Neon tutor status update failed:", err);
        }
      }

      return NextResponse.json({ success: true, isVerified });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Authentication failed. Please try again." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  try {
    if (action === "children") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;

      if (auth.user.role !== "parent") {
        return NextResponse.json({ error: "Parent access required." }, { status: 403 });
      }

      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          const rows = await typedSql`
            SELECT id, child_name, child_age, educational_level FROM parent_profiles WHERE user_id = ${auth.user.id}
          `;
          return NextResponse.json({ source: "neon", children: rows });
        } catch (err) {
          console.error("Neon children query failed:", err);
        }
      }

      const childStore = getChildStore();
      const children = childStore.get(auth.user.id) || [];
      return NextResponse.json({ source: "mock", children });
    }

    if (action === "saved_tutors") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;

      if (auth.user.role !== "student" && auth.user.role !== "parent") {
        return NextResponse.json({ error: "Student or parent access required." }, { status: 403 });
      }

      const savedStore = getSavedTutorStore();
      const saved = savedStore.filter((s) => s.userId === auth.user.id);
      return NextResponse.json({ source: "mock", savedTutors: saved });
    }

    if (action === "availability") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;

      if (auth.user.role !== "tutor") {
        return NextResponse.json({ error: "Tutor access required." }, { status: 403 });
      }

      const availStore = getAvailabilityStore();
      const availability = availStore.filter((a) => a.tutorId === auth.user.id);
      return NextResponse.json({ source: "mock", availability });
    }
  } catch (err) {
    console.error("Auth GET error:", err);
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = (body.action as string) || "";

  try {
    if (action === "add_child") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;
      if (auth.user.role !== "parent") {
        return NextResponse.json({ error: "Parent access required." }, { status: 403 });
      }

      const child: Child = {
        id: randomUUID(),
        name: (body.name as string) || "",
        age: Number(body.age) || 0,
        educationLevel: (body.educationLevel as string) || "",
      };

      if (!child.name) return NextResponse.json({ error: "Child name is required." }, { status: 400 });
      if (!child.age || child.age < 1 || child.age > 100) return NextResponse.json({ error: "Valid child age is required." }, { status: 400 });
      if (!child.educationLevel) return NextResponse.json({ error: "Education level is required." }, { status: 400 });

      const childStore = getChildStore();
      const children = childStore.get(auth.user.id) || [];
      children.push(child);
      childStore.set(auth.user.id, children);

      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          await typedSql`
            INSERT INTO parent_profiles (user_id, child_name, child_age, educational_level, terms_agreed_at)
            VALUES (${auth.user.id}, ${child.name}, ${child.age}, ${child.educationLevel}, NOW())
          `;
        } catch (err) {
          console.error("Neon child insert failed:", err);
        }
      }

      return NextResponse.json({ success: true, child }, { status: 201 });
    }

    if (action === "update_child") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;
      if (auth.user.role !== "parent") {
        return NextResponse.json({ error: "Parent access required." }, { status: 403 });
      }

      const childId = (body.childId as string) || "";
      const childStore = getChildStore();
      const children = childStore.get(auth.user.id) || [];
      const idx = children.findIndex((c) => c.id === childId);
      if (idx < 0) return NextResponse.json({ error: "Child not found." }, { status: 404 });

      if (body.name) children[idx].name = body.name as string;
      if (body.age) children[idx].age = Number(body.age);
      if (body.educationLevel) children[idx].educationLevel = body.educationLevel as string;

      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          await typedSql`
            UPDATE parent_profiles SET child_name = ${children[idx].name}, child_age = ${children[idx].age}, educational_level = ${children[idx].educationLevel}
            WHERE user_id = ${auth.user.id}
          `;
        } catch (err) {
          console.error("Neon child update failed:", err);
        }
      }

      return NextResponse.json({ success: true, child: children[idx] });
    }

    if (action === "save_tutor") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;

      const tutorId = (body.tutorId as string) || "";
      if (!tutorId) return NextResponse.json({ error: "tutorId is required." }, { status: 400 });

      const savedStore = getSavedTutorStore();
      const exists = savedStore.find((s) => s.userId === auth.user.id && s.tutorId === tutorId);
      if (exists) return NextResponse.json({ error: "Tutor already saved." }, { status: 409 });

      const saved: SavedTutor = {
        userId: auth.user.id,
        tutorId,
        tutorName: (body.tutorName as string) || "",
        tutorAvatar: (body.tutorAvatar as string) || "",
        tutorHeadline: (body.tutorHeadline as string) || "",
        tutorRate: Number(body.tutorRate) || 0,
        savedAt: new Date().toISOString(),
      };
      savedStore.push(saved);
      return NextResponse.json({ success: true, savedTutor: saved }, { status: 201 });
    }

    if (action === "remove_tutor") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;

      const tutorId = (body.tutorId as string) || "";
      const savedStore = getSavedTutorStore();
      const idx = savedStore.findIndex((s) => s.userId === auth.user.id && s.tutorId === tutorId);
      if (idx >= 0) savedStore.splice(idx, 1);
      return NextResponse.json({ success: true });
    }

    if (action === "add_availability") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;
      if (auth.user.role !== "tutor") {
        return NextResponse.json({ error: "Tutor access required." }, { status: 403 });
      }

      const slot: AvailabilitySlot = {
        id: randomUUID(),
        tutorId: auth.user.id,
        day: (body.day as AvailabilitySlot["day"]) || "Mon",
        start: (body.start as string) || "",
        end: (body.end as string) || "",
      };
      if (!slot.start || !slot.end) return NextResponse.json({ error: "Start and end times are required." }, { status: 400 });

      const availStore = getAvailabilityStore();
      const exists = availStore.find((a) => a.tutorId === auth.user.id && a.day === slot.day && a.start === slot.start);
      if (exists) {
        exists.end = slot.end;
        return NextResponse.json({ success: true, slot: exists });
      }
      availStore.push(slot);
      return NextResponse.json({ success: true, slot }, { status: 201 });
    }

    if (action === "delete_availability") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;
      if (auth.user.role !== "tutor") {
        return NextResponse.json({ error: "Tutor access required." }, { status: 403 });
      }

      const slotId = (body.slotId as string) || "";
      const day = (body.day as string) || "";
      const start = (body.start as string) || "";
      const availStore = getAvailabilityStore();
      let idx: number;
      if (slotId) {
        idx = availStore.findIndex((a) => a.id === slotId && a.tutorId === auth.user.id);
      } else if (day && start) {
        idx = availStore.findIndex((a) => a.tutorId === auth.user.id && a.day === day && a.start === start);
      } else {
        return NextResponse.json({ error: "slotId or day+start is required." }, { status: 400 });
      }
      if (idx < 0) return NextResponse.json({ error: "Slot not found." }, { status: 404 });
      availStore.splice(idx, 1);

      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          if (slotId) {
            await typedSql`DELETE FROM tutor_availability WHERE id = ${slotId}`;
          } else {
            await typedSql`DELETE FROM tutor_availability WHERE tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = ${auth.user.id}) AND day_of_week = ${day} AND start_time = ${start}`;
          }
        } catch (err) {
          console.error("Neon availability delete failed:", err);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (err) {
    console.error("Auth PUT error:", err);
    return NextResponse.json({ error: "Request failed." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = (body.action as string) || "";

  try {
    if (action === "delete_child") {
      const auth = getUserFromRequest(req);
      if (auth instanceof NextResponse) return auth;
      if (auth.user.role !== "parent") {
        return NextResponse.json({ error: "Parent access required." }, { status: 403 });
      }

      const childId = (body.childId as string) || "";
      const childStore = getChildStore();
      const children = childStore.get(auth.user.id) || [];
      const idx = children.findIndex((c) => c.id === childId);
      if (idx < 0) return NextResponse.json({ error: "Child not found." }, { status: 404 });
      children.splice(idx, 1);
      childStore.set(auth.user.id, children);

      if (hasDatabase) {
        try {
          const typedSql = sql as unknown as SqlTag;
          await typedSql`DELETE FROM parent_profiles WHERE user_id = ${auth.user.id} AND id = ${childId}`;
        } catch (err) {
          console.error("Neon child delete failed:", err);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (err) {
    console.error("Auth DELETE error:", err);
    return NextResponse.json({ error: "Request failed." }, { status: 500 });
  }
}
