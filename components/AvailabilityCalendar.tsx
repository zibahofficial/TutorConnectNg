"use client";

import { Clock } from "lucide-react";
import type { AvailabilitySlot } from "@/lib/types";

const DAYS: AvailabilitySlot["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AvailabilityCalendar({
  availability,
  selected,
  onSelect,
}: {
  availability: AvailabilitySlot[];
  selected: AvailabilitySlot | null;
  onSelect: (slot: AvailabilitySlot) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Clock size={16} className="text-navy-600" /> Weekly Availability
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {DAYS.map((day) => {
          const slots = availability.filter((a) => a.day === day);
          return (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-400">{day}</span>
              <div className="flex min-h-[64px] w-full flex-col gap-1.5">
                {slots.length === 0 ? (
                  <div className="h-14 w-full rounded-lg bg-slate-50" />
                ) : (
                  slots.map((slot) => {
                    const isSelected =
                      selected?.day === slot.day && selected?.start === slot.start;
                    return (
                      <button
                        key={`${slot.day}-${slot.start}`}
                        onClick={() => onSelect(slot)}
                        className={`rounded-lg border px-1 py-2 text-center text-[10px] font-bold leading-tight transition-colors sm:text-[11px] ${
                          isSelected
                            ? "border-navy-700 bg-navy-700 text-white shadow-soft"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                        }`}
                      >
                        {slot.start}
                        <br />
                        {slot.end}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Tap a highlighted slot to select it, then continue to booking.
      </p>
    </div>
  );
}
