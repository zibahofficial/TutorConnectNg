import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { UserRole, Review } from "./types";

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  city?: string;
  state?: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  teachingMode?: string;
  subjects?: string[];
  qualification?: string;
  createdAt: string;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  educationLevel: string;
}

export interface SavedTutor {
  userId: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string;
  tutorHeadline: string;
  tutorRate: number;
  savedAt: string;
}

export interface AvailabilitySlot {
  id: string;
  tutorId: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  start: string;
  end: string;
}

declare global {
  var __tutorconnect_users__: Map<string, StoredUser> | undefined;
  var __tutorconnect_children__: Map<string, Child[]> | undefined;
  var __tutorconnect_saved__: SavedTutor[] | undefined;
  var __tutorconnect_availability__: AvailabilitySlot[] | undefined;
  var __tutorconnect_reviews__: Record<string, Review[]> | undefined;
}

export function getUserStore(): Map<string, StoredUser> {
  if (!global.__tutorconnect_users__) {
    global.__tutorconnect_users__ = new Map();
  }
  // Seed an admin account only when credentials are provided via environment
  // variables (ADMIN_EMAIL / ADMIN_PASSWORD). Never hardcode credentials here.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword && !global.__tutorconnect_users__.has(adminEmail)) {
    global.__tutorconnect_users__.set(adminEmail, {
      id: "admin_seed",
      email: adminEmail,
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      fullName: "Administrator",
      role: "admin",
      createdAt: new Date().toISOString(),
    });
  }
  return global.__tutorconnect_users__;
}

export function getChildStore(): Map<string, Child[]> {
  if (!global.__tutorconnect_children__) {
    global.__tutorconnect_children__ = new Map();
  }
  return global.__tutorconnect_children__;
}

export function getSavedTutorStore(): SavedTutor[] {
  if (!global.__tutorconnect_saved__) {
    global.__tutorconnect_saved__ = [];
  }
  return global.__tutorconnect_saved__;
}

export function getAvailabilityStore(): AvailabilitySlot[] {
  if (!global.__tutorconnect_availability__) {
    global.__tutorconnect_availability__ = [];
  }
  return global.__tutorconnect_availability__;
}

export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return null;
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

/** Map day abbreviations to the integer stored in `tutor_availability.day_of_week` (0=Monday … 6=Sunday). */
export const DAY_TO_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

/** Reverse of {@link DAY_TO_INDEX}: integer day (0=Monday … 6=Sunday) → abbreviation. */
export const INDEX_TO_DAY: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
