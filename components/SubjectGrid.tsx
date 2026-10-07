"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sigma,
  BookOpenText,
  FlaskConical,
  Code2,
  BrainCircuit,
  PenTool,
  GraduationCap,
  Baby,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { SUBJECT_CARDS } from "@/lib/site-config";

const ICON_MAP: Record<string, LucideIcon> = {
  Sigma,
  BookOpenText,
  FlaskConical,
  Code2,
  BrainCircuit,
  PenTool,
  GraduationCap,
  Baby,
};

// Duplicate the list so the belt can loop seamlessly: once the first copy
// has scrolled fully out of view, the second (identical) copy is in the
// exact same position, so the loop restart is invisible to the eye.
const MARQUEE_CARDS = [...SUBJECT_CARDS, ...SUBJECT_CARDS];

export default function SubjectGrid() {
  return (
    <section className="overflow-hidden py-16 sm:py-24">
      <div className="container-app">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
            </span>
            Popular on TutorConnect NG
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Top Subjects &amp; Skills to Master Next
          </h2>
          <p className="mt-3 text-slate-600">
            From WAEC essentials to in-demand tech skills — browse what
            verified Nigerian tutors are teaching right now.
          </p>
        </div>
      </div>

      {/* Full-bleed, continuously scrolling belt of subject cards.
          Hover (or tap-and-hold on touch devices) pauses it so a card
          can be read and clicked comfortably. */}
      <div className="group relative w-full">
        <div
          className="flex w-max gap-5 px-5 [animation:marquee_38s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]"
        >
          {MARQUEE_CARDS.map((subject, i) => {
            const Icon = ICON_MAP[subject.icon] ?? Sigma;
            return (
              <Link
                key={`${subject.id}-${i}`}
                href={`/tutors?subject=${encodeURIComponent(subject.title)}`}
                className="card-glow group/card relative block h-full w-72 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-glow sm:w-80"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${subject.accent} opacity-60 [background-size:200%_100%] [animation:shimmer_3.5s_linear_infinite] group-hover/card:opacity-100`}
                />
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${subject.accent} text-white shadow-soft transition-transform group-hover/card:scale-110`}
                >
                  <Icon size={22} />
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {subject.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {subject.description}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Browse subject
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="text-slate-300 transition-all group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:text-navy-600"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Soft edge fades so cards appear to glide in/out rather than
            clip abruptly at the viewport edge. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent sm:w-24" />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="container-app mt-6 text-center text-xs font-medium text-slate-400"
      >
        Hover any card to pause — click to see tutors for that subject.
      </motion.p>
    </section>
  );
}
