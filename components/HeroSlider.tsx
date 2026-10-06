"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Quote, ShieldCheck, Sparkles } from "lucide-react";

type HeroState = "student" | "tutor";

const AVATAR_STACK = [
  "/images/tutor-01.jpg",
  "/images/tutor-03.jpg",
  "/images/tutor-05.jpg",
  "/images/tutor-07.jpg",
];

export default function HeroSlider() {
  const [state, setState] = useState<HeroState>("student");

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => (prev === "student" ? "tutor" : "student"));
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const isStudent = state === "student";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-50/60 via-white to-white">
      <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-navy-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="container-app relative py-10 sm:py-14 lg:py-20">
        {/* Segmented toggle */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-card">
            <button
              onClick={() => setState("student")}
              className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                isStudent ? "text-white" : "text-slate-500 hover:text-navy-700"
              }`}
            >
              {isStudent && (
                <motion.span
                  layoutId="hero-toggle-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-navy-700 to-navy-600"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <span className="relative z-10">Discover &amp; Learn</span>
            </button>
            <button
              onClick={() => setState("tutor")}
              className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                !isStudent ? "text-white" : "text-slate-500 hover:text-navy-700"
              }`}
            >
              {!isStudent && (
                <motion.span
                  layoutId="hero-toggle-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-navy-700 to-navy-600"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <span className="relative z-10">Teach and Earn</span>
            </button>
          </div>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Text column */}
          <AnimatePresence mode="wait">
            {isStudent ? (
              <motion.div
                key="student-text"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.45 }}
                className="order-2 lg:order-1"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-navy-50 px-4 py-1.5 text-xs font-semibold text-navy-700">
                  <Sparkles size={14} /> For Parents &amp; Students
                </span>
                <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
                  Find Verified{" "}
                  <span className="text-gradient">Local &amp; Online</span>{" "}
                  Tutors Across Nigeria.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
                  Personalized 1-on-1 tutoring tailored to WAEC, JAMB, Cambridge
                  IGCSE, Coding, and foundational subjects.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/tutors" className="btn-primary">
                    Find a Tutor <ArrowRight size={18} />
                  </Link>
                  <Link href="/signup" className="btn-outline">
                    Join for Free
                  </Link>
                </div>
                <div className="mt-10 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {AVATAR_STACK.map((src, i) => (
                      <div
                        key={src}
                        className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white"
                        style={{ zIndex: AVATAR_STACK.length - i }}
                      >
                        <Image src={src} alt="Nigerian parent" fill sizes="40px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500">
                    <span className="font-bold text-slate-800">
                      Trusted by 10,000+
                    </span>{" "}
                    Nigerian parents &amp; students nationwide.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="tutor-text"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.45 }}
                className="order-2 lg:order-1"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                  <ShieldCheck size={14} /> For Tutors &amp; Mentors
                </span>

                <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                  <Quote className="mb-3 text-amber-500" size={28} />
                  <p className="font-display text-xl font-semibold leading-snug text-slate-800 sm:text-2xl">
                    &ldquo;The mind that opens to a new idea never returns to
                    its original size.&rdquo;
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-400">
                    — Albert Einstein
                  </p>
                </div>

                <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
                  Empower the next generation. Set your hourly rates, manage
                  your calendar, and teach verified learners.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/signup?role=tutor" className="btn-primary">
                    Start Tutoring <ArrowRight size={18} />
                  </Link>
                  <Link href="/how-it-works" className="btn-outline">
                    Become a Verified Tutor
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image column */}
          <div className="order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={state}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5 }}
                className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl shadow-soft sm:max-w-lg"
              >
                <Image
                  src={isStudent ? "/images/hero-student.jpg" : "/images/hero-tutor.jpg"}
                  alt={
                    isStudent
                      ? "Focused Nigerian student studying at a desk"
                      : "Smiling Nigerian tutor in a bright classroom"
                  }
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 500px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/50 via-transparent to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 shadow-card backdrop-blur">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600" size={20} />
                    <span className="text-sm font-semibold text-slate-800">
                      {isStudent ? "ID-Verified Tutors Only" : "Verified Learner Network"}
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    98% Satisfaction
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Indicator dots */}
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setState("student")}
                className={`h-2 rounded-full transition-all ${
                  isStudent ? "w-8 bg-navy-700" : "w-2 bg-slate-300"
                }`}
                aria-label="Show student mode"
              />
              <button
                onClick={() => setState("tutor")}
                className={`h-2 rounded-full transition-all ${
                  !isStudent ? "w-8 bg-navy-700" : "w-2 bg-slate-300"
                }`}
                aria-label="Show tutor mode"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
