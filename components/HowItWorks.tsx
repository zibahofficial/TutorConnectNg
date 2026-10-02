"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Search, ShieldCheck, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Search & Filter",
    description:
      "Browse verified tutors by subject, state (Lagos, Abuja, PH, Ibadan or Online), budget, and curriculum.",
  },
  {
    icon: ShieldCheck,
    title: "Review & Verify",
    description:
      "Check ID-verified badges, ratings, reviews and credentials before you commit.",
  },
  {
    icon: CalendarCheck,
    title: "Book a Session",
    description:
      "Pick a grade level, time slot, and learning mode — online or in-person.",
  },
  {
    icon: Sparkles,
    title: "Learn & Grow",
    description:
      "Attend your session, track progress on your dashboard, and leave a review.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-24">
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Simple, Transparent Process
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            How TutorConnect NG Works
          </h2>
        </motion.div>

        <div className="relative">
          {/* Animated connecting flow line (desktop only) */}
          <div className="pointer-events-none absolute left-0 right-0 top-9 hidden h-0.5 lg:block">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-navy-200 via-emerald-200 to-amber-200" />
            <span
              className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-navy-600 shadow-[0_0_12px_2px_rgba(37,99,235,0.6)]"
              style={{ animation: "travel 4.5s linear infinite" }}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
                className="card-glow relative rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-shadow hover:shadow-glow"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.12 + 0.2, type: "spring", bounce: 0.5 }}
                  className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white shadow-soft"
                >
                  {i + 1}
                </motion.span>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-700"
                >
                  <step.icon size={22} />
                </motion.div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
