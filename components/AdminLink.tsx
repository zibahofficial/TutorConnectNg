"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { dashboardPathForRole } from "@/lib/redirect";

/**
 * Smart link to the admin panel.
 *
 * - Authenticated admin  → straight to `/dashboard/admin`.
 * - Signed-out user      → `/login?next=/dashboard/admin` (NOT the homepage),
 *                          and the login screen sends them back here after a
 *                          successful admin login.
 * - Authenticated non-admin → their own role dashboard; non-admins must never
 *                          land on the admin panel.
 *
 * Modifier clicks (middle-click, Ctrl/Cmd-click) keep the browser's default
 * behavior with the raw `href`.
 */
export default function AdminLink({
  href = "/dashboard/admin",
  className,
  children,
  onNavigate,
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
  /** Called after a regular click is handled (e.g. close the mobile menu). */
  onNavigate?: () => void;
}) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    let role: string | null = null;
    try {
      const raw = window.localStorage.getItem("tutorconnect_user");
      role = raw ? (JSON.parse(raw).role ?? null) : null;
    } catch {
      role = null; // unreadable storage → treat as signed out
    }

    if (role === "admin") router.push(href);
    else if (role === null) router.push(`/login?next=${encodeURIComponent(href)}`);
    else router.push(dashboardPathForRole(role));

    onNavigate?.();
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
