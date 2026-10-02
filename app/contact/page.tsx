"use client";

import { useState } from "react";
import { CheckCircle2, Mail, MapPin, Phone, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="container-app grid grid-cols-1 gap-10 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full bg-navy-50 px-4 py-1.5 text-xs font-semibold text-navy-700">
              Get in Touch
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              We&apos;d love to hear from you
            </h1>
            <p className="mt-3 max-w-md text-slate-600">
              Questions about booking a tutor, becoming a verified tutor, or a
              partnership enquiry? Reach out any time.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href="https://maps.google.com/?q=12+Admiralty+Way,+Lekki+Phase+1,+Lagos,+Nigeria"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-colors hover:border-navy-300"
              >
                <MapPin className="text-navy-600" size={20} />
                <span className="text-sm text-slate-600">12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria</span>
              </a>
              <a
                href="tel:+2348128055914"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-colors hover:border-navy-300"
              >
                <Phone className="text-navy-600" size={20} />
                <span className="text-sm text-slate-600">08128055914</span>
              </a>
              <a
                href="mailto:hello@tutorconnect.ng"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-colors hover:border-navy-300"
              >
                <Mail className="text-navy-600" size={20} />
                <span className="text-sm text-slate-600">hello@tutorconnect.ng</span>
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-card">
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <CheckCircle2 size={48} className="text-emerald-500" />
                <h3 className="font-display text-lg font-bold text-slate-900">Message Sent!</h3>
                <p className="max-w-xs text-sm text-slate-500">
                  Thanks for reaching out — our team will respond within 1 business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Full Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  <Send size={16} /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
