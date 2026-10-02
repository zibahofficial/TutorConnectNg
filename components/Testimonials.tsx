"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Mrs. Folashade Bello",
    role: "Parent, Lekki, Lagos",
    quote:
      "TutorConnect NG made it so easy to find a verified Maths tutor for my daughter's WAEC prep. The booking and rating system gave me real peace of mind.",
    rating: 5,
    initials: "FB",
    gradient: "from-navy-600 to-navy-700",
  },
  {
    name: "Emeka A.",
    role: "SS3 Student, Ibadan",
    quote:
      "My JAMB score jumped from 212 to 298 after two months of sessions. My tutor used real past questions every single class.",
    rating: 5,
    initials: "EA",
    gradient: "from-emerald-500 to-emerald-700",
  },
  {
    name: "David Okonkwo",
    role: "Verified Tutor, Online",
    quote:
      "As a tutor, the dashboard makes managing my availability and earnings effortless. I've taught over 160 sessions through the platform.",
    rating: 5,
    initials: "DO",
    gradient: "from-amber-500 to-orange-600",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-24 bg-slate-50 py-16 sm:py-24">
      <div className="container-app">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-navy-50 px-4 py-1.5 text-xs font-semibold text-navy-700">
            Loved by families &amp; tutors nationwide
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Real Results, Real Nigerian Families
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white`}
                >
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
