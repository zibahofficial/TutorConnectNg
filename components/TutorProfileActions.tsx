"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import type { AvailabilitySlot, Tutor } from "@/lib/types";
import BookingModal from "./BookingModal";
import AvailabilityCalendar from "./AvailabilityCalendar";

export default function TutorProfileActions({ tutor }: { tutor: Tutor }) {
  const [open, setOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    tutor.availability[0] ?? null
  );

  return (
    <>
      <AvailabilityCalendar
        availability={tutor.availability}
        selected={selectedSlot}
        onSelect={setSelectedSlot}
      />

      <button onClick={() => setOpen(true)} className="btn-primary mt-5 w-full">
        <CalendarCheck size={18} /> Book a Session
      </button>

      <BookingModal
        tutor={tutor}
        open={open}
        onClose={() => setOpen(false)}
        initialSlot={selectedSlot}
      />
    </>
  );
}
