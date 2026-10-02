/**
 * In-memory auth fallback store.
 * ---------------------------------------------------------------------------
 * Used ONLY when DATABASE_URL is not configured, so the product can be fully
 * demoed without a live Neon database. Data resets on cold start / redeploy.
 * When DATABASE_URL is present, app/api/auth/route.ts reads & writes the
 * real `users` table in Postgres instead of this store.
 */
import type { UserRole } from "./types";

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  city?: string;
  state?: string;
  createdAt: string;
}

declare global {
  var __tutorconnect_users__: Map<string, StoredUser> | undefined;
}

export function getUserStore(): Map<string, StoredUser> {
  if (!global.__tutorconnect_users__) {
    global.__tutorconnect_users__ = new Map();
  }
  return global.__tutorconnect_users__;
}
