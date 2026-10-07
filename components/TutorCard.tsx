"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, MapPin, Star, Wifi } from "lucide-react";
import type { Tutor } from "@/lib/types";
import BookingModal from "./BookingModal";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "T";
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function TutorCard({ tutor }: { tutor: Tutor }) {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <div className="card-glow group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card hover:shadow-glow">
        <div className="relative h-44 w-full overflow-hidden">
          {tutor.avatarUrl ? (
            <Image
              src={tutor.avatarUrl}
              alt={tutor.fullName}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-600 to-navy-800">
              <span className="font-display text-4xl font-extrabold text-white/90">
                {initials(tutor.fullName)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {tutor.isVerified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-sm">
              <BadgeCheck size={14} /> Verified
            </span>
          )}
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-navy-700/90 px-2.5 py-1 text-xs font-bold text-white">
            {formatNaira(tutor.hourlyRate)}/hr
          </span>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-display text-lg font-bold text-white drop-shadow">
              {tutor.fullName}
            </h3>
            <p className="flex items-center gap-1 text-xs font-medium text-slate-100/90">
              {tutor.isOnline ? <Wifi size={12} /> : <MapPin size={12} />}
              {tutor.isOnline ? "Online / Remote" : `${tutor.area}, ${tutor.state}`}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="line-clamp-1 text-sm font-semibold text-navy-700">
            {tutor.headline}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {tutor.subjects.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
              >
                {s}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-1.5">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-slate-800">
              {tutor.ratingAvg.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">
              ({tutor.totalReviews} reviews)
            </span>
            <span className="ml-auto text-xs font-medium text-slate-400">
              {tutor.curriculum}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Link
              href={`/tutors/${encodeURIComponent(tutor.id)}`}
              prefetch={false}
              className="btn-outline relative z-10 flex-1 !px-3 !py-2 text-sm"
              aria-label={`View ${tutor.fullName}'s profile`}
            >
              View Profile
            </Link>
            <button
              onClick={() => setBookingOpen(true)}
              className="btn-primary flex-1 !px-3 !py-2 text-sm"
            >
              Book Session
            </button>
          </div>
        </div>
      </div>

      <BookingModal
        tutor={tutor}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
    </>
  );
}
