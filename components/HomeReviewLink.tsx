"use client";

import { useRouter } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";

export default function HomeReviewLink() {
  const router = useRouter();

  function openReviewDashboard() {
    try {
      const stored = localStorage.getItem("tutorconnect_user");
      const user = stored ? (JSON.parse(stored) as { role?: string }) : null;
      if (user?.role === "parent") {
        router.push("/dashboard/parent?tab=bookings");
        return;
      }
      if (user?.role === "student") {
        router.push("/dashboard/student?tab=bookings");
        return;
      }
    } catch {
      // Invalid or unavailable local storage is handled by the login page.
    }
    router.push("/login");
  }

  return (
    <button type="button" onClick={openReviewDashboard} className="btn-outline inline-flex items-center gap-2">
      <MessageSquarePlus size={17} /> Write a Review
    </button>
  );
}
