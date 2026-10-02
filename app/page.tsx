import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import StatsBar from "@/components/StatsBar";
import SubjectGrid from "@/components/SubjectGrid";
import HowItWorks from "@/components/HowItWorks";
import TutorCard from "@/components/TutorCard";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import { TUTORS } from "@/lib/mock-data";

export default function HomePage() {
  const featured = TUTORS.filter((t) => t.isVerified).slice(0, 4);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSlider />
        <StatsBar />
        <SubjectGrid />
        <HowItWorks />

        <section className="bg-slate-50 py-16 sm:py-24">
          <div className="container-app">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-navy-50 px-4 py-1.5 text-xs font-semibold text-navy-700">
                  Handpicked for you
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  Featured Verified Tutors
                </h2>
              </div>
              <Link
                href="/tutors"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900"
              >
                Browse all tutors <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
          </div>
        </section>

        <Testimonials />

        <section className="py-16 sm:py-20">
          <div className="container-app">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-700 to-navy-900 px-8 py-14 text-center shadow-soft sm:px-16">
              <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -left-10 -bottom-10 h-56 w-56 rounded-full bg-navy-500/30 blur-3xl" />
              <h2 className="relative font-display text-3xl font-extrabold text-white sm:text-4xl">
                Ready to start learning — or teaching?
              </h2>
              <p className="relative mx-auto mt-3 max-w-xl text-navy-100">
                Join thousands of Nigerian students, parents, and tutors
                already growing with TutorConnect NG.
              </p>
              <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/signup" className="btn-primary !bg-white !bg-none !text-navy-800">
                  Join for Free
                </Link>
                <Link href="/signup?role=tutor" className="btn-outline !border-white/40 !bg-transparent !text-white hover:!text-white hover:!border-white">
                  Become a Verified Tutor
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
