import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Award,
  BadgeCheck,
  ChevronLeft,
  FileCheck2,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Star,
  Wifi,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TutorProfileActions from "@/components/TutorProfileActions";
import { fetchApprovedTutorById } from "@/db/tutors";

// Profiles are read live from PostgreSQL: a tutor that is unknown, not yet
// approved, or since suspended resolves to a friendly "not found" state
// instead of a crash.
export const dynamic = "force-dynamic";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "T"
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tutor = await fetchApprovedTutorById(id).catch(() => null);
  if (!tutor) return { title: "Tutor Not Found | TutorConnect NG" };
  return {
    title: `${tutor.fullName} — ${tutor.headline} | TutorConnect NG`,
    description: tutor.bio || `${tutor.fullName} on TutorConnect NG`,
  };
}

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutor = await fetchApprovedTutorById(id);
  if (!tutor) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="container-app py-6">
          <Link
            href="/tutors"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-navy-700"
          >
            <ChevronLeft size={16} /> Back to all tutors
          </Link>
        </div>

        <div className="container-app grid grid-cols-1 gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main column */}
          <div className="min-w-0 space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
              <div className="relative h-56 bg-gradient-to-br from-navy-700 to-navy-900 sm:h-64">
                <div className="absolute -bottom-12 left-6 h-28 w-28 overflow-hidden rounded-2xl border-4 border-white shadow-soft sm:h-32 sm:w-32">
                  {tutor.avatarUrl ? (
                    <Image src={tutor.avatarUrl} alt={tutor.fullName} fill sizes="128px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-navy-800">
                      <span className="font-display text-3xl font-extrabold text-white/90">
                        {initials(tutor.fullName)}
                      </span>
                    </div>
                  )}
                </div>
                {tutor.isVerified && (
                  <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                    <ShieldCheck size={14} /> ID-Verified Tutor
                  </span>
                )}
              </div>
              <div className="px-6 pb-6 pt-16 sm:pt-16">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
                      {tutor.fullName}
                    </h1>
                    <p className="mt-1 font-medium text-navy-600">{tutor.headline}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-navy-50 px-4 py-2 text-sm font-bold text-navy-700">
                    {formatNaira(tutor.hourlyRate)}/hr
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    {tutor.isOnline ? <Wifi size={15} /> : <MapPin size={15} />}
                    {tutor.isOnline ? "Online / Remote" : `${tutor.area}, ${tutor.state}`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star size={15} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-800">{tutor.ratingAvg.toFixed(1)}</span>
                    ({tutor.totalReviews} reviews)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award size={15} /> {tutor.yearsExperience} yrs experience
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap size={15} /> {tutor.curriculum}
                  </span>
                </div>

                {tutor.subjects.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {tutor.subjects.map((s) => (
                      <span key={s} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="mb-3 font-display text-lg font-bold text-slate-900">
                About {tutor.fullName.split(" ")[0]}
              </h2>
              <p className="leading-relaxed text-slate-600">
                {tutor.bio || "This tutor has not added a bio yet."}
              </p>
            </div>

            {/* Credentials */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-bold text-slate-900">Verified Credentials</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${tutor.idCardUploaded ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                  <FileCheck2 size={20} className={tutor.idCardUploaded ? "text-emerald-600" : "text-slate-400"} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Government ID</p>
                    <p className="text-xs text-slate-500">
                      {tutor.idCardUploaded ? "Reviewed by admin team" : "Pending submission"}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${tutor.degreeUploaded ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                  <BadgeCheck size={20} className={tutor.degreeUploaded ? "text-emerald-600" : "text-slate-400"} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Degree / Certification</p>
                    <p className="text-xs text-slate-500">
                      {tutor.degreeUploaded ? "Reviewed by admin team" : "Pending submission"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-bold text-slate-900">
                Student Reviews ({tutor.totalReviews})
              </h2>
              {tutor.reviews.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No reviews yet — reviews are written by students after a completed session.
                </p>
              ) : (
                <div className="space-y-4">
                  {tutor.reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800">{review.studentName}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                      <p className="mt-2 text-xs text-slate-400">{review.createdAt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky booking sidebar */}
          <aside className="min-w-0">
            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <TutorProfileActions tutor={tutor} />
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
