"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, Search, Menu, X, User } from "lucide-react";
import AdminLink from "@/components/AdminLink";

const NAV_LINKS = [
  { href: "/tutors", label: "Tutors" },
  { href: "/how-it-works", label: "Parents & Students" },
  { href: "/dashboard/admin", label: "Admin" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/tutors?search=${encodeURIComponent(trimmed)}` : "/tutors");
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="container-app flex h-18 items-center gap-4 py-3">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-700 to-navy-600 text-white shadow-soft transition-transform group-hover:scale-105">
            <GraduationCap size={22} strokeWidth={2.4} />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-base font-extrabold tracking-tight text-navy-700">
              TutorConnect <span className="text-navy-600">NG</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Verified tutors, nationwide
            </span>
          </span>
        </Link>

        {/* Center nav links (desktop) */}
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            const classes = `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-navy-50 text-navy-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-navy-700"
            }`;
            // The Admin link routes by role: admins go to the panel, signed-out
            // users go to /login?next=/dashboard/admin, non-admins to their
            // own dashboard.
            if (link.href === "/dashboard/admin") {
              return (
                <AdminLink key={link.href} href={link.href} className={classes}>
                  {link.label}
                </AdminLink>
              );
            }
            return (
              <Link key={link.href} href={link.href} className={classes}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Search (desktop) */}
        <form onSubmit={handleSearch} className="hidden max-w-sm flex-1 items-center md:flex">
          <div className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 transition-colors focus-within:border-navy-600 focus-within:bg-white">
            <button
              type="submit"
              aria-label="Search"
              className="shrink-0 text-slate-400 transition-colors hover:text-navy-600"
            >
              <Search size={16} />
            </button>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search by subject, curriculum, or tutor name..."
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </form>

        {/* Auth actions (desktop) */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link href="/login" className="btn-outline !px-5 !py-2 text-sm">
            Log In
          </Link>
          <Link href="/signup" className="btn-primary !px-5 !py-2 text-sm">
            Sign Up
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-5 pb-6 pt-4 lg:hidden">
          <form
            onSubmit={handleSearch}
            className="mb-4 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5"
          >
            <button type="submit" aria-label="Search" className="text-slate-400 hover:text-navy-600">
              <Search size={16} />
            </button>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search by subject, curriculum, or tutor name..."
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </form>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) =>
              link.href === "/dashboard/admin" ? (
                <AdminLink
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  onNavigate={() => setOpen(false)}
                >
                  {link.label}
                </AdminLink>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/login" className="btn-outline w-full text-sm" onClick={() => setOpen(false)}>
              <User size={16} /> Log In
            </Link>
            <Link href="/signup" className="btn-primary w-full text-sm" onClick={() => setOpen(false)}>
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
