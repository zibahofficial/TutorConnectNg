import bcrypt from "bcryptjs";
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
    global.__tutorconnect_users__.set("hephzibah2uche@gmail.com", {
      id: "admin_real",
      email: "hephzibah2uche@gmail.com",
      passwordHash: bcrypt.hashSync("Zibah2uche@2018", 10),
      fullName: "Hephzibah Uche",
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
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return null;
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}
