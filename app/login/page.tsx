"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("tutorconnect_token", data.token);
      localStorage.setItem("tutorconnect_user", JSON.stringify(data.user));
      const role = data.user?.role ?? "student";
      router.push(role === "tutor" ? "/dashboard/tutor" : role === "admin" ? "/dashboard/admin" : "/dashboard/student");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-navy-50/60 to-white px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-700 to-navy-600 text-white">
            <GraduationCap size={22} />
          </span>
          <span className="font-display text-base font-extrabold text-navy-700">TutorConnect NG</span>
        </Link>

        <h1 className="text-center font-display text-2xl font-extrabold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Log in to manage your sessions</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <Mail size={16} className="text-slate-400" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <Lock size={16} className="text-slate-400" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-navy-700 hover:text-navy-900">
            Sign up for free
          </Link>
        </p>
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
          Demo mode: sign up to create a demo account, or use{" "}
          <span className="font-semibold">admin@tutorconnect.ng</span> /{" "}
          <span className="font-semibold">admin123</span> for the admin panel.
        </p>
      </div>
    </main>
  );
}
