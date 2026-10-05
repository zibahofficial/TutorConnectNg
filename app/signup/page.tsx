"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Carlito } from "next/font/google";
import { useRouter, useSearchParams } from "next/navigation";
import LegalModal, { LegalLink, type LegalDoc } from "@/components/LegalModal";
import {
  Briefcase,
  Camera,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

/**
 * Calibri-look font for the signup page. Local `Calibri` is preferred where
 * installed (e.g. Windows); the Carlito webfont — metric-compatible with
 * Calibri — is the fallback for devices without it (Android, iOS, macOS,
 * Linux). Exposed as the `--font-signup-calibri` CSS variable, consumed by
 * the `.font-calibri` class in globals.css.
 */
const calibriFont = Carlito({
  variable: "--font-signup-calibri",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const TUTOR_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
  "Federal Capital Territory (Abuja)",
];

const EDUCATION_LEVELS = [
  "Nursery / Early years",
  "Primary 1–3",
  "Primary 4–6",
  "JSS1 (Junior Secondary 1)",
  "JSS2 (Junior Secondary 2)",
  "JSS3 (Junior Secondary 3)",
  "SS1 (Senior Secondary 1)",
  "SS2 (Senior Secondary 2)",
  "SS3 (Senior Secondary 3)",
  "University undergraduate",
  "Adult / professional",
  "Parent booking for a child",
];

const TUTOR_HEADLINES = [
  "Mathematics & Further Mathematics tutor (WAEC, NECO, JAMB)",
  "English & Literature tutor (WAEC, NECO, JAMB)",
  "Physics, Chemistry & Biology tutor (senior secondary)",
  "Chemistry & Biology tutor for senior secondary students",
  "Primary school tutor (all subjects, Grades 1-6)",
  "ICT, Computer Science & Coding tutor",
  "Economics, Government & Commerce tutor",
  "Accounting & Business Studies tutor",
  "Geography & Environmental Science tutor",
  "History & Social Studies tutor",
  "Music, Piano & Voice tutor",
  "French & Foreign Languages tutor",
  "JAMB / UTME & Post-UTME coaching specialist",
  "IGCSE, SAT & IELTS preparation specialist",
  "Special-needs & home-schooling tutor",
  "University admission & essay-writing coach",
];

const SUBJECT_OPTIONS = [
  "📑 Accounting", "🌱 Agricultural Science", "🧬 Biology", "💼 Business Studies",
  "🧪 Chemistry", "⛪ Christian Religious Studies", "🤝 Civic Education",
  "💻 Computer Science", "📊 Data Analysis", "💹 Economics", "📖 English Language",
  "💰 Financial Accounting", "🎨 Fine Art", "🇫🇷 French", "🧮 Further Mathematics",
  "🌍 Geography", "🏛️ Government", "🗣️ Hausa", "📜 History", "✈️ IELTS Preparation",
  "🗣️ Igbo", "🎯 JAMB / UTME Coaching", "✍️ Literature in English", "📐 Mathematics",
  "🎹 Music", "🔤 Phonics & Reading", "⚛️ Physics", "🎤 Public Speaking",
  "🧠 Verbal & Quantitative Reasoning", "📝 WAEC & NECO Prep", "🌐 Web Development",
  "🗣️ Yoruba",
];

const QUALIFICATIONS = [
  "B.Sc. / B.A. / B.Eng. (Bachelor's degree)",
  "B.Sc. / B.A. (First Class Honours)",
  "Master's degree (M.Sc. / M.A. / M.Eng.)",
  "Doctorate (PhD / EdD)",
  "MBBS / BDS (Medical degree)",
  "NCE (Nigeria Certificate in Education)",
  "PGDE / Postgraduate Diploma in Education",
  "HND / Diploma",
  "Professional certification (ICAN, CIBN, CISCO, TRCN)",
  "WAEC / NECO certificate + verifiable teaching experience",
];

const TEACHING_MODES = ["Online & in person", "Online only", "In person only"];

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

/**
 * Terms/privacy consent checkbox shared by the student, tutor, and parent
 * signup flows. The document links open the full Terms of Service / Privacy
 * Policy in an in-page dialog (works even where new-tab popups are blocked),
 * and stop click propagation so tapping a link never toggles the checkbox.
 */
function TermsConsent({
  checked,
  onChange,
  onOpenDoc,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onOpenDoc: (doc: LegalDoc) => void;
}) {
  const linkClass =
    "font-semibold text-navy-700 underline decoration-navy-300 underline-offset-2 transition-colors hover:text-navy-900 hover:decoration-navy-700";
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-slate-600">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-navy-600"
        />
        <span>
          I agree to the TutorConnect{" "}
          <LegalLink doc="terms" onOpen={onOpenDoc} className={linkClass}>
            Terms of Service
          </LegalLink>{" "}
          and{" "}
          <LegalLink doc="privacy" onOpen={onOpenDoc} className={linkClass}>
            Privacy Policy
          </LegalLink>
          , and confirm the information above is accurate.
        </span>
      </label>
      <p className="mt-1.5 text-[11px] text-slate-400">
        Tap the underlined documents to read them in full — your form progress is preserved.
      </p>
    </div>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as UserRole) || "student";

  const [role, setRole] = useState<UserRole>(defaultRole);

  // Shared fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Student-specific fields
  const [educationLevel, setEducationLevel] = useState("");
  const [childName, setChildName] = useState("");
// Parent-specific fields
const [childAge, setChildAge] = useState("");
const [tutorBudget, setTutorBudget] = useState("");
const [learningMode, setLearningMode] = useState("");
  // Tutor-specific fields
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [ratePerSession, setRatePerSession] = useState("");
  const [teachingMode, setTeachingMode] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [qualification, setQualification] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);

  const isStudentFlow = role === "student";
const isTutorFlow = role === "tutor";
const isParentFlow = role === "parent";
const isParentBookingForChild = educationLevel === "Parent booking for a child";
  const passwordHint = useMemo(
    () => "Use 8+ characters with at least one uppercase letter, one lowercase letter, one number, and one special character.",
    []
  );

  function validateEmail(email: string): string | null {
    if (!email.trim()) return "Please enter your email address.";
    if (email !== email.toLowerCase()) return "Email must be all lowercase.";
    if (!email.endsWith("@gmail.com")) return "Email must be a Gmail address ending with @gmail.com.";
    return null;
  }

  function validatePassword(password: string): string | null {
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/\d/.test(password)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) return "Password must contain at least one special character.";
    return null;
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Please upload a PNG, JPG, GIF or WebP image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Image must be smaller than 3 MB.");
      return;
    }
    setPhotoError("");
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoPreview(null);
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addSubject(value: string) {
    if (!value) return;
    setSelectedSubjects((prev) => (prev.includes(value) ? prev : [...prev, value]));
  }

  function removeSubject(value: string) {
    setSelectedSubjects((prev) => prev.filter((s) => s !== value));
  }

  function validateStudentForm(): string | null {
    if (!fullName.trim()) return "Please enter your full name.";
    const emailError = validateEmail(email);
    if (emailError) return emailError;
    const passwordError = validatePassword(password);
    if (passwordError) return passwordError;
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!city.trim()) return "Please tell us your city.";
    if (!stateValue) return "Please select your state.";
    if (!educationLevel) return "Please select an education level.";
    if (!agreeTerms) return "Please agree to the terms of service and privacy policy to continue.";
    return null;
  }

  function validateTutorForm(): string | null {
    if (!fullName.trim()) return "Please enter your full name.";
    const emailError = validateEmail(email);
    if (emailError) return emailError;
    const passwordError = validatePassword(password);
    if (passwordError) return passwordError;
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!headline) return "Please select your professional headline.";
    if (bio.trim().length < 40) return "Your bio must be at least 40 characters.";
    if (!yearsExperience) return "Please enter your years of experience.";
    if (!ratePerSession) return "Please enter your rate per session.";
    if (!city.trim()) return "Please tell us your city.";
    if (!stateValue) return "Please select your state.";
    if (!teachingMode) return "Please select a teaching mode.";
    if (selectedSubjects.length === 0) return "Please add at least one subject you teach.";
    if (!agreeTerms) return "Please agree to the terms of service and privacy policy to continue.";
    return null;
  }
  function validateParentForm(): string | null {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!phone.trim()) return "Please enter your phone number.";

    const emailError = validateEmail(email);
    if (emailError) return emailError;

    const passwordError = validatePassword(password);
    if (passwordError) return passwordError;

    if (password !== confirmPassword) return "Passwords do not match.";
  if (!city.trim()) return "Please tell us your city.";
  if (!stateValue) return "Please select your state.";
  if (!childName.trim()) return "Please enter the child's name.";
  if (!childAge) return "Please enter the child's age.";
  if (!educationLevel) return "Please select an educational level.";
  if (!tutorBudget) return "Please enter your tutor budget.";
  if (!learningMode) return "Please select a learning mode.";
  if (!agreeTerms) return "Please agree to the terms of service and privacy policy to continue.";

  return null;
}
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isStudentFlow) {
  const validationError = validateStudentForm();
  if (validationError) {
    setError(validationError);
    return;
  }
} else if (isTutorFlow) {
  const validationError = validateTutorForm();
  if (validationError) {
    setError(validationError);
    return;
  }
} else if (isParentFlow) {
  const validationError = validateParentForm();
  if (validationError) {
    setError(validationError);
    return;
  }
}
  

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          fullName,
          email,
          password,
          role,
          avatarUrl: photoPreview || undefined,
          ...(isStudentFlow
            ? {
                phone: phone || undefined,
                city,
                state: stateValue,
                educationLevel,
                childName: isParentBookingForChild && childName ? childName : undefined,
              }
            : {}),
          ...(isTutorFlow
            ? {
                phone: phone || undefined,
                city,
                state: stateValue,
                headline,
                bio,
                yearsExperience,
                ratePerSession,
                hourlyRate: ratePerSession ? Number(ratePerSession) : undefined,
                teachingMode,
                subjects: selectedSubjects,
                qualification: qualification || undefined,
              }
            : {}),
            ...(isParentFlow
  ? {
      phone,
      city,
      state: stateValue,
      childName,
      childAge,
      educationLevel,
      tutorBudget,
      learningMode,
       agreeTerms,
    }
  : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      localStorage.setItem("tutorconnect_token", data.token);
      localStorage.setItem("tutorconnect_user", JSON.stringify(data.user));
      router.push(role === "tutor" ? "/dashboard/tutor" : role === "parent" ? "/dashboard/parent" : "/dashboard/student");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`${calibriFont.variable} font-calibri flex min-h-screen items-center justify-center bg-gradient-to-b from-navy-50/60 to-white px-4 py-12`}>
      <div
        className={`w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-soft transition-all ${
          isTutorFlow || isParentFlow ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-700 to-navy-600 text-white">
            <GraduationCap size={22} />
          </span>
          <span className="font-display text-base font-extrabold text-navy-700">TutorConnect NG</span>
        </Link>

        <h1 className="text-center font-display text-2xl font-extrabold text-slate-900">Create your account</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Join thousands of Nigerian learners &amp; tutors</p>

        {/* Read-first notice — visible before any form input, for every role */}
        <p className="mt-4 rounded-xl bg-navy-50 px-4 py-2.5 text-center text-xs leading-relaxed text-navy-800">
          Before you continue, please read our{" "}
          <LegalLink
            doc="terms"
            onOpen={setLegalDoc}
            className="font-bold text-navy-700 underline decoration-navy-300 underline-offset-2 transition-colors hover:text-navy-900 hover:decoration-navy-700"
          >
            Terms of Service
          </LegalLink>{" "}
          and{" "}
          <LegalLink
            doc="privacy"
            onOpen={setLegalDoc}
            className="font-bold text-navy-700 underline decoration-navy-300 underline-offset-2 transition-colors hover:text-navy-900 hover:decoration-navy-700"
          >
            Privacy Policy
          </LegalLink>
          .
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {(["student", "parent", "tutor"] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl border px-2 py-2 text-xs font-bold capitalize transition-colors ${
                role === r ? "border-navy-600 bg-navy-50 text-navy-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {isStudentFlow && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Full name <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <User size={16} className="text-slate-400" />
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-transparent text-sm focus:outline-none"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Phone <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <Phone size={16} className="text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent text-sm focus:outline-none"
                      placeholder="08012345678"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email address <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none"
                    placeholder="you@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <Lock size={16} className="text-slate-400" />
                  <input
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">{passwordHint}</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Confirm password <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <Lock size={16} className="text-slate-400" />
                  <input
                    required
                    minLength={8}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none"
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <MapPin size={15} className="text-navy-600" /> Where should we look for tutors?
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
                      City
                    </label>
                    <input
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                      placeholder="e.g. Ibadan"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
                      State
                    </label>
                    <select
                      required
                      value={stateValue}
                      onChange={(e) => setStateValue(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                    >
                      <option value="">Select state</option>
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Education level <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                >
                  <option value="">Select level</option>
                  {EDUCATION_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              {isParentBookingForChild && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Child&apos;s name <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <UserCheck size={16} className="text-slate-400" />
                    <input
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full bg-transparent text-sm focus:outline-none"
                      placeholder="e.g. Ifeoma"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    We&apos;ll personalise this parent account for the learner you book for.
                  </p>
                </div>
              )}

              <TermsConsent checked={agreeTerms} onChange={setAgreeTerms} onOpenDoc={setLegalDoc} />
            </>
          )}

          {isTutorFlow && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Full name <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <User size={16} className="text-slate-400" />
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-transparent text-sm focus:outline-none"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Phone <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <Phone size={16} className="text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent text-sm focus:outline-none"
                      placeholder="08012345678"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email address <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none"
                    placeholder="you@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <Lock size={16} className="text-slate-400" />
                    <input
                      required
                      minLength={8}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm focus:outline-none"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">{passwordHint}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Confirm password <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <Lock size={16} className="text-slate-400" />
                    <input
                      required
                      minLength={8}
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent text-sm focus:outline-none"
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Profile photo</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-2xl">
                    {photoPreview ? (
                      <Image src={photoPreview} alt="Profile preview" width={64} height={64} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <span role="img" aria-label="Profile placeholder">👤</span>
                    )}
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-navy-400"
                      >
                        <Camera size={14} /> Upload photo
                      </button>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-rose-500 hover:border-rose-300"
                        >
                          <X size={14} /> Remove
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 max-w-xs text-xs text-slate-400">
                      Upload from your device — PNG, JPG, GIF or WebP, up to 3 MB. You can change or remove it anytime.
                    </p>
                    {photoError && <p className="mt-1 text-xs font-semibold text-rose-500">{photoError}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h2 className="font-display text-base font-bold text-slate-900">Build your tutor profile</h2>
                <p className="mt-0.5 text-xs text-slate-400">You can refine everything later from your dashboard.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Professional headline <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                >
                  <option value="">Select your professional headline…</option>
                  {TUTOR_HEADLINES.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Bio <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  maxLength={4000}
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell students and parents about your teaching style, experience, and results..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {bio.length}/4000 characters · minimum 40
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Years of experience <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <Briefcase size={16} className="text-slate-400" />
                    <input
                      required
                      type="number"
                      min={0}
                      max={60}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      className="w-full bg-transparent text-sm focus:outline-none"
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Rate per session (₦) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <Wallet size={16} className="text-slate-400" />
                    <input
                      required
                      type="number"
                      min={0}
                      step={500}
                      value={ratePerSession}
                      onChange={(e) => setRatePerSession(e.target.value)}
                      className="w-full bg-transparent text-sm focus:outline-none"
                      placeholder="e.g. 6500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <MapPin size={16} className="text-slate-400" />
                    <input
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-transparent text-sm focus:outline-none"
                      placeholder="e.g. Lekki"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={stateValue}
                    onChange={(e) => setStateValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                  >
                    <option value="">Select your state…</option>
                    {TUTOR_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Teaching mode <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {TEACHING_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTeachingMode(mode)}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
                        teachingMode === mode
                          ? "border-navy-600 bg-navy-50 text-navy-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Subjects you teach <span className="text-rose-500">*</span>
                </label>
                <select
                  value=""
                  onChange={(e) => addSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                >
                  <option value="">Select a subject to add…</option>
                  {SUBJECT_OPTIONS.filter((s) => !selectedSubjects.includes(s)).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <div className="mt-3 flex min-h-[2.5rem] flex-wrap gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
                  {selectedSubjects.length === 0 ? (
                    <p className="text-xs text-slate-400">No subjects added yet — pick one from the list above.</p>
                  ) : (
                    selectedSubjects.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSubject(s)}
                          aria-label={`Remove ${s}`}
                          className="text-navy-400 hover:text-navy-700"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Pick from the list above — add every subject you teach. {selectedSubjects.length} selected.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Qualifications</label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                >
                  <option value="">Select your qualification (optional)…</option>
                  {QUALIFICATIONS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <TermsConsent checked={agreeTerms} onChange={setAgreeTerms} onOpenDoc={setLegalDoc} />
            </>
          )}
{isParentFlow && (
  <>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Full name <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <User size={16} className="text-slate-400" />
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
            placeholder="Your full name"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Phone number <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <Phone size={16} className="text-slate-400" />
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
            placeholder="08012345678"
          />
        </div>
      </div>
    </div>

    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        Email address <span className="text-rose-500">*</span>
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
        <Mail size={16} className="text-slate-400" />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none"
          placeholder="you@gmail.com"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Password <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <Lock size={16} className="text-slate-400" />
          <input
            required
            minLength={8}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
            placeholder="Create a password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">{passwordHint}</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Confirm password <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <Lock size={16} className="text-slate-400" />
          <input
            required
            minLength={8}
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
            placeholder="Re-enter your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((s) => !s)}
            className="text-slate-400 hover:text-slate-600"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    </div>

    <div className="border-t border-slate-100 pt-4">
      <p className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <MapPin size={15} className="text-navy-600" />
        Your location
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
            City
          </label>
          <input
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            placeholder="e.g. Asaba"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
            State
          </label>
          <select
            required
            value={stateValue}
            onChange={(e) => setStateValue(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>

    <div className="border-t border-slate-100 pt-4">
      <p className="mb-3 text-sm font-bold text-slate-700">
        About the learner
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Child&apos;s name <span className="text-rose-500">*</span>
          </label>
          <input
            required
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            placeholder="e.g. Chinedu"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Child&apos;s age <span className="text-rose-500">*</span>
          </label>
          <input
            required
            type="number"
            min={1}
            max={100}
            value={childAge}
            onChange={(e) => setChildAge(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            placeholder="e.g. 12"
          />
        </div>
      </div>
    </div>

    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        Educational level <span className="text-rose-500">*</span>
      </label>
      <select
        required
        value={educationLevel}
        onChange={(e) => setEducationLevel(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
      >
        <option value="">Select educational level</option>
        {EDUCATION_LEVELS.map((level) => (
          <option key={level} value={level}>{level}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        Tutor budget (₦) <span className="text-rose-500">*</span>
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
        <Wallet size={16} className="text-slate-400" />
        <input
          required
          type="number"
          min={0}
          step={500}
          value={tutorBudget}
          onChange={(e) => setTutorBudget(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none"
          placeholder="e.g. 10000"
        />
      </div>
    </div>

    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        Learning mode <span className="text-rose-500">*</span>
      </label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {[
          ["online", "Online"],
          ["in_person", "In person"],
          ["both", "Both"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setLearningMode(value)}
            className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
              learningMode === value
                ? "border-navy-600 bg-navy-50 text-navy-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    <TermsConsent checked={agreeTerms} onChange={setAgreeTerms} onOpenDoc={setLegalDoc} />
  </>
)}
               
                    

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-navy-700 hover:text-navy-900">
            Log in
          </Link>
        </p>
      </div>
      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
