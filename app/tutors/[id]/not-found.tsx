import Link from "next/link";
import { SearchX } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Friendly fallback for unknown / unlisted tutor ids. Reaching this page is
 * expected whenever a profile link is stale, a tutor has not been approved by
 * an admin yet, or an account has been suspended.
 */
export default function TutorNotFound() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-20">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white px-8 py-12 text-center shadow-card">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-700">
            <SearchX size={26} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-slate-900">Tutor not found</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            This tutor profile is unavailable. It may have been removed, or the
            tutor has not been verified by our team yet.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tutors" className="btn-primary">
              Browse all tutors
            </Link>
            <Link href="/" className="btn-outline">
              Back to homepage
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
