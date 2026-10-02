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
  | "American";

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
  tutorCount: number;
  accent: string;
}
