import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | TutorConnect NG",
  description:
    "Learn how TutorConnect NG collects, uses, and protects your personal data in line with the Nigeria Data Protection Act (NDPA) 2023.",
};

const LAST_UPDATED = "October 2, 2026";

const SECTIONS = [
  { id: "overview", title: "1. Overview" },
  { id: "information-we-collect", title: "2. Information We Collect" },
  { id: "how-we-use-information", title: "3. How We Use Your Information" },
  { id: "legal-basis", title: "4. Legal Basis for Processing" },
  { id: "sharing", title: "5. How We Share Information" },
  { id: "children", title: "6. Children's & Minors' Data" },
  { id: "payments", title: "7. Payments & Financial Data" },
  { id: "cookies", title: "8. Cookies & Tracking Technologies" },
  { id: "security", title: "9. Data Security" },
  { id: "retention", title: "10. Data Retention" },
  { id: "rights", title: "11. Your Rights" },
  { id: "transfers", title: "12. International Data Transfers" },
  { id: "changes", title: "13. Changes to This Policy" },
  { id: "contact", title: "14. Contact Us" },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <section className="border-b border-slate-200 bg-white py-14 sm:py-20">
          <div className="container-app">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-4 py-1.5 text-xs font-semibold text-navy-700">
              <ShieldCheck size={14} /> Legal
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Your trust matters to us. This policy explains what personal
              data TutorConnect NG collects, why we collect it, and the
              choices and rights you have — in line with the Nigeria Data
              Protection Act (NDPA) 2023 and the Nigeria Data Protection
              Regulation (NDPR) 2019.
            </p>
            <p className="mt-4 text-sm font-medium text-slate-400">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="container-app grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
            {/* Table of contents */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                  On this page
                </p>
                <nav className="space-y-1">
                  {SECTIONS.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block rounded-lg px-2.5 py-1.5 text-sm text-slate-600 hover:bg-navy-50 hover:text-navy-700"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Mobile TOC */}
            <nav className="-mt-2 flex flex-wrap gap-2 lg:hidden">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-navy-300 hover:text-navy-700"
                >
                  {s.title}
                </a>
              ))}
            </nav>

            <div className="space-y-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-10">
              <section id="overview" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  1. Overview
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  TutorConnect NG (&quot;TutorConnect NG&quot;,
                  &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates
                  a marketplace that connects students, parents, and
                  guardians (&quot;Learners&quot;) with independent tutors
                  (&quot;Tutors&quot;) across Nigeria, both in person and
                  online. This Privacy Policy applies to the TutorConnect NG
                  website, mobile-responsive web app, and related services
                  (collectively, the &quot;Platform&quot;). By creating an
                  account or otherwise using the Platform, you agree to the
                  collection and use of information as described here.
                </p>
              </section>

              <section id="information-we-collect" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  2. Information We Collect
                </h2>
                <div className="mt-3 space-y-3 leading-relaxed text-slate-600">
                  <p>
                    <strong className="text-slate-800">
                      Account information:
                    </strong>{" "}
                    full name, email address, phone number, password (stored
                    as a secure hash), role (student, parent, tutor, or
                    admin), city and state.
                  </p>
                  <p>
                    <strong className="text-slate-800">
                      Tutor profile information:
                    </strong>{" "}
                    professional headline, bio, subjects taught, years of
                    experience, qualifications, hourly/session rate,
                    teaching mode, weekly availability, and — where
                    voluntarily submitted for verification — a government-
                    issued ID and degree/certification documents.
                  </p>
                  <p>
                    <strong className="text-slate-800">
                      Booking & session information:
                    </strong>{" "}
                    grade level, subject, scheduled date and time, session
                    mode (online or in person), notes you provide to a
                    tutor, booking status, and post-session reviews or star
                    ratings.
                  </p>
                  <p>
                    <strong className="text-slate-800">
                      Usage & device information:
                    </strong>{" "}
                    pages visited, search filters used (subject, location,
                    budget, curriculum), approximate location derived from
                    your selected state/city, browser type, and device
                    identifiers, collected automatically via cookies and
                    similar technologies.
                  </p>
                  <p>
                    <strong className="text-slate-800">
                      Communications:
                    </strong>{" "}
                    messages you send through our Contact form, customer
                    support correspondence, and any feedback you provide.
                  </p>
                </div>
              </section>

              <section id="how-we-use-information" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  3. How We Use Your Information
                </h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-600">
                  <li>To create and manage your account and authenticate you when you log in.</li>
                  <li>To match Learners with suitable Tutors using our Live Filter &amp; Matching Engine.</li>
                  <li>To process, confirm, and manage booking requests and sessions.</li>
                  <li>To verify tutor identity and credentials before granting a &quot;Verified&quot; badge.</li>
                  <li>To display ratings, reviews, and public profile information to other users.</li>
                  <li>To send essential service notifications (booking confirmations, status changes).</li>
                  <li>To respond to support requests submitted via our Contact page.</li>
                  <li>To maintain platform safety, detect fraud, and enforce our Terms of Service.</li>
                  <li>To analyze aggregated, de-identified usage trends and improve the Platform.</li>
                </ul>
              </section>

              <section id="legal-basis" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  4. Legal Basis for Processing
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  We process personal data under the Nigeria Data Protection
                  Act (NDPA) 2023 on the following bases: (a) performance of
                  a contract with you (creating your account, facilitating
                  bookings); (b) your consent (e.g., uploading optional
                  verification documents or a profile photo); (c)
                  legitimate interests (platform security, fraud prevention,
                  service improvement); and (d) compliance with applicable
                  legal obligations.
                </p>
              </section>

              <section id="sharing" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  5. How We Share Information
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  We do not sell your personal data. We share limited
                  information only as follows:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-600">
                  <li>
                    <strong className="text-slate-800">Between Learners and Tutors:</strong>{" "}
                    booking details (subject, grade level, schedule, notes,
                    contact details relevant to the session) are shared with
                    the counterpart to a booking so the session can take
                    place.
                  </li>
                  <li>
                    <strong className="text-slate-800">Public profile data:</strong>{" "}
                    a tutor&apos;s name, photo, headline, subjects,
                    verification badge, rating, and reviews are visible to
                    all visitors browsing the Platform.
                  </li>
                  <li>
                    <strong className="text-slate-800">Service providers:</strong>{" "}
                    hosting (Vercel), database (Neon/PostgreSQL), and
                    analytics providers who process data on our behalf under
                    confidentiality obligations.
                  </li>
                  <li>
                    <strong className="text-slate-800">Legal requirements:</strong>{" "}
                    where required to comply with Nigerian law, respond to a
                    valid legal process, or protect the rights, safety, and
                    property of TutorConnect NG, our users, or the public.
                  </li>
                </ul>
              </section>

              <section id="children" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  6. Children&apos;s &amp; Minors&apos; Data
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  TutorConnect NG is intended to be used by adults (parents,
                  guardians, tutors, and students aged 18 and above) who
                  create and manage accounts. Where a parent or guardian
                  books tutoring sessions for a minor, the parent/guardian
                  account holder is responsible for any personal
                  information (such as a child&apos;s name or grade level)
                  submitted on the minor&apos;s behalf, and consents to its
                  processing for the purpose of arranging and delivering
                  tutoring services. We do not knowingly allow children
                  under 18 to independently create accounts or make
                  payments on the Platform.
                </p>
              </section>

              <section id="payments" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  7. Payments &amp; Financial Data
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  Session fees are displayed and estimated in Nigerian Naira
                  (₦). Where payment processing is enabled, transactions are
                  handled by licensed third-party payment processors; we do
                  not store full card or bank account numbers on our
                  servers. Tutor earnings summaries shown on the Tutor
                  Dashboard are derived from completed booking records.
                </p>
              </section>

              <section id="cookies" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  8. Cookies &amp; Tracking Technologies
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  We use strictly necessary cookies/local storage to keep
                  you signed in and remember your session, and may use
                  analytics cookies to understand how the Platform is used
                  so we can improve it. You can control or disable cookies
                  through your browser settings; doing so may limit some
                  functionality (such as staying logged in).
                </p>
              </section>

              <section id="security" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  9. Data Security
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  We apply industry-standard safeguards — including
                  encrypted password hashing, HTTPS/TLS in transit, and
                  access controls on our database — to protect your
                  information. No system is 100% secure, and we encourage
                  you to use a strong, unique password and keep your login
                  credentials confidential.
                </p>
              </section>

              <section id="retention" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  10. Data Retention
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  We retain account and booking records for as long as your
                  account is active and for a reasonable period afterward to
                  comply with legal, accounting, or dispute-resolution
                  obligations. You may request deletion of your account at
                  any time as described in Section 11.
                </p>
              </section>

              <section id="rights" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  11. Your Rights
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  Subject to applicable law, you have the right to: access
                  the personal data we hold about you; request correction of
                  inaccurate data; request deletion of your data; object to
                  or restrict certain processing; and request a copy of
                  your data in a portable format. To exercise any of these
                  rights, contact us using the details in Section 14 — we
                  will respond within a reasonable timeframe.
                </p>
              </section>

              <section id="transfers" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  12. International Data Transfers
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  Our hosting and infrastructure providers may process data
                  on servers located outside Nigeria. Where this occurs, we
                  take reasonable steps to ensure an adequate level of
                  protection consistent with the NDPA 2023, such as
                  relying on providers with recognized security and privacy
                  certifications.
                </p>
              </section>

              <section id="changes" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  13. Changes to This Policy
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  We may update this Privacy Policy from time to time to
                  reflect changes in our practices or legal requirements.
                  We will post the revised policy on this page with an
                  updated &quot;Last updated&quot; date. Material changes
                  will be communicated through the Platform.
                </p>
              </section>

              <section id="contact" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  14. Contact Us
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  If you have questions about this Privacy Policy or how we
                  handle your data, please reach out:
                </p>
                <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                  <p>📍 12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria</p>
                  <p>📞 08128055914</p>
                  <p>✉️ hello@tutorconnect.ng</p>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  You may also review our{" "}
                  <Link href="/terms" className="font-semibold text-navy-700 hover:text-navy-900">
                    Terms of Service
                  </Link>{" "}
                  or visit our{" "}
                  <Link href="/contact" className="font-semibold text-navy-700 hover:text-navy-900">
                    Contact page
                  </Link>{" "}
                  to reach our team directly.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
