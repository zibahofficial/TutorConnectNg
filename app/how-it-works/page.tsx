import Link from "next/link";
import {
  CalendarCheck,
  MessageCircleQuestion,
  Search,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const STUDENT_STEPS = [
  { icon: Search, title: "1. Search & Filter", description: "Use the Live Filter & Matching Engine to narrow tutors by subject, state (Lagos, Abuja, Port Harcourt, Ibadan or Online), budget in Naira, availability, and curriculum (Nigerian National, British Cambridge, or American)." },
  { icon: ShieldCheck, title: "2. Review Verified Profiles", description: "Every tutor profile shows an ID-verification badge, star rating, reviews, credentials, and a weekly availability calendar." },
  { icon: CalendarCheck, title: "3. Book a Session", description: "Select the student's grade level, subject, preferred date & time slot, and choose Online (Google Meet / Zoom) or In-Person." },
  { icon: Wallet, title: "4. Pay & Track", description: "Track your request status (pending, accepted, completed) from your dashboard, and see upcoming lessons at a glance." },
  { icon: Star, title: "5. Review Your Tutor", description: "After each completed session, leave a star rating and comment to help other parents and students choose with confidence." },
];

const TUTOR_STEPS = [
  { icon: ShieldCheck, title: "1. Get Verified", description: "Upload your government ID and degree/certification for admin review. Verified tutors get a trust badge and appear higher in search results." },
  { icon: CalendarCheck, title: "2. Set Your Availability", description: "Define your weekly teaching slots and hourly rate in Naira — update them any time from your tutor dashboard." },
  { icon: MessageCircleQuestion, title: "3. Accept Requests", description: "Review incoming booking requests with full context — subject, grade level, mode, and notes — then accept or decline." },
  { icon: Wallet, title: "4. Teach & Earn", description: "Conduct sessions online or in person, and track your completed sessions and total earnings on your dashboard." },
];

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <section className="bg-white py-16 text-center sm:py-20">
          <div className="container-app">
            <span className="inline-flex items-center rounded-full bg-navy-50 px-4 py-1.5 text-xs font-semibold text-navy-700">
              For Parents, Students &amp; Tutors
            </span>
            <h1 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              How TutorConnect NG Works
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Whether you&apos;re booking your first tutor or becoming a
              verified mentor, here&apos;s exactly what to expect.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container-app">
            <h2 className="mb-8 font-display text-2xl font-extrabold text-slate-900">
              For Parents &amp; Students
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {STUDENT_STEPS.map((step) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                    <step.icon size={18} />
                  </div>
                  <h3 className="font-display text-sm font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/tutors" className="btn-primary">Find a Tutor Now</Link>
            </div>
          </div>
        </section>

        <section className="bg-navy-900 py-16">
          <div className="container-app">
            <h2 className="mb-8 font-display text-2xl font-extrabold text-white">
              For Tutors
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TUTOR_STEPS.map((step) => (
                <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <step.icon size={18} />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-navy-100">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/signup?role=tutor" className="btn-primary !bg-white !bg-none !text-navy-800">
                Become a Verified Tutor
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
