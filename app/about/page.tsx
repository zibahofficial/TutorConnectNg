import Image from "next/image";
import { GraduationCap, HeartHandshake, ShieldCheck, Target } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Verified & Safe",
    description: "Every tutor undergoes ID and credential verification before joining our network.",
  },
  {
    icon: Target,
    title: "Outcome-Driven",
    description: "We focus on measurable academic results — from WAEC grades to job-ready tech skills.",
  },
  {
    icon: HeartHandshake,
    title: "Community First",
    description: "Built for Nigerian families, by people who understand the Nigerian education journey.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-navy-50/60 to-white py-16 sm:py-24">
          <div className="container-app grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-4 py-1.5 text-xs font-semibold text-navy-700">
                <GraduationCap size={14} /> Our Story
              </span>
              <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Connecting Nigerian Learners with Tutors They Can Trust
              </h1>
              <p className="mt-4 leading-relaxed text-slate-600">
                TutorConnect NG was founded to solve a simple but persistent
                problem: finding a qualified, trustworthy tutor in Nigeria
                shouldn&apos;t depend on who you know. We built a verified
                marketplace that connects students and parents in Lagos,
                Abuja, Port Harcourt, Ibadan, and beyond — both in person and
                online — with tutors who are vetted, rated, and ready to help
                learners thrive in WAEC, JAMB, Cambridge IGCSE, coding, and
                foundational subjects.
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-soft">
              <Image src="/images/hero-tutor.jpg" alt="Nigerian tutor mentoring a student" fill className="object-cover" />
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container-app">
            <h2 className="mb-10 text-center font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
              What We Stand For
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {VALUES.map((v) => (
                <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-700">
                    <v.icon size={22} />
                  </div>
                  <h3 className="font-display font-bold text-slate-900">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
