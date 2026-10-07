export type UserRole = "student" | "parent" | "tutor" | "admin";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

export type SessionMode = "online" | "in_person";

export type Curriculum =
  | "Nigerian National"
  | "British Cambridge"
  | "American"
  | "Other";

/**
 * Account review lifecycle stored in `users.account_status`.
 * Every registration starts as "pending" — only an admin can approve,
 * reject, or suspend an account.
 */
export type AccountStatus = "pending" | "approved" | "rejected" | "suspended";

/** Credential-review lifecycle stored in `tutor_profiles.verification_status`. */
export type VerificationStatus = "pending" | "approved" | "rejected" | "suspended";

export interface AvailabilitySlot {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  start: string; // "09:00"
  end: string; // "11:00"
}

export interface Review {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Tutor {
  id: string;
  fullName: string;
  /** Empty string when the tutor has not uploaded a profile photo. */
  avatarUrl: string;
  headline: string;
  bio: string;
  state: string;
  area: string; // LGA / district e.g. "Lekki"
  isOnline: boolean;
  isVerified: boolean;
  hourlyRate: number;
  currency: "NGN";
  yearsExperience: number;
  curriculum: Curriculum;
  subjects: string[];
  subjectCategory:
    | "All"
    | "Maths"
    | "Sciences"
    | "Tech"
    | "Languages"
    | "Commercial"
    | "Exam Prep";
  ratingAvg: number;
  totalReviews: number;
  totalSessions: number;
  availability: AvailabilitySlot[];
  idCardUploaded: boolean;
  degreeUploaded: boolean;
  reviews: Review[];
}

export interface Booking {
  id: string;
  studentId?: string;
  studentName: string;
  tutorId: string;
  tutorName: string;
  subject: string;
  gradeLevel: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  sessionMode: SessionMode;
  meetingLink?: string;
  totalPrice: number;
  notes?: string;
  createdAt: string;
}

export interface SubjectCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
}

/**
 * A private 1-on-1 chat message between two parties (student ↔ tutor).
 * Party keys are opaque ids: a user id, a mock tutor id (e.g. "t1"), or a
 * tutor_profiles id in database mode. Names are denormalized onto the
 * message so both sides can render the thread without extra lookups.
 */
export interface ChatMessage {
  id: string;
  senderKey: string;
  senderName: string;
  recipientKey: string;
  recipientName: string;
  body: string;
  createdAt: string;
}

export interface ChatConversation {
  partnerKey: string;
  partnerName: string;
  lastBody: string;
  lastAt: string;
  lastFromMe: boolean;
}
