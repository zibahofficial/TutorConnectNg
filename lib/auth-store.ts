import bcrypt from "bcryptjs";
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
    global.__tutorconnect_users__.set("admin@tutorconnect.ng", {
      id: "admin_demo",
      email: "admin@tutorconnect.ng",
      passwordHash: bcrypt.hashSync("admin123", 10),
      fullName: "Admin User",
      role: "admin",
      createdAt: new Date().toISOString(),
    });
  }
  return global.__tutorconnect_users__;
}
