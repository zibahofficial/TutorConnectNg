import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | TutorConnect NG",
  description:
    "The terms and conditions governing your use of TutorConnect NG — Nigeria's marketplace for verified local and online tutors.",
};

const LAST_UPDATED = "October 2, 2026";

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "eligibility", title: "2. Eligibility & Accounts" },
  { id: "platform-role", title: "3. Our Role as a Marketplace" },
  { id: "tutor-verification", title: "4. Tutor Verification" },
  { id: "bookings", title: "5. Bookings & Sessions" },
  { id: "fees", title: "6. Fees & Payments" },
  { id: "cancellations", title: "7. Cancellations & Refunds" },
  { id: "reviews", title: "8. Reviews & Ratings" },
  { id: "conduct", title: "9. Acceptable Use & Conduct" },
  { id: "content", title: "10. User Content & Intellectual Property" },
  { id: "suspension", title: "11. Suspension & Termination" },
  { id: "disclaimers", title: "12. Disclaimers" },
  { id: "liability", title: "13. Limitation of Liability" },
  { id: "indemnity", title: "14. Indemnification" },
  { id: "governing-law", title: "15. Governing Law" },
  { id: "changes", title: "16. Changes to These Terms" },
  { id: "contact", title: "17. Contact Us" },
];

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <section className="border-b border-slate-200 bg-white py-14 sm:py-20">
          <div className="container-app">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-4 py-1.5 text-xs font-semibold text-navy-700">
              <FileText size={14} /> Legal
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              These Terms of Service (&quot;Terms&quot;) govern your access
              to and use of TutorConnect NG. Please read them carefully
              before creating an account, booking a session, or offering
              tutoring services on the Platform.
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
              <section id="acceptance" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  1. Acceptance of Terms
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  By accessing or using TutorConnect NG&apos;s website and
                  services (the &quot;Platform&quot;), you agree to be bound
                  by these Terms and our{" "}
                  <Link href="/privacy" className="font-semibold text-navy-700 hover:text-navy-900">
                    Privacy Policy
                  </Link>
                  . If you do not agree to these Terms, please do not use
                  the Platform.
                </p>
              </section>

              <section id="eligibility" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  2. Eligibility &amp; Accounts
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  You must be at least 18 years old to create an account on
                  TutorConnect NG, whether as a student, parent/guardian, or
                  tutor. You are responsible for maintaining the
                  confidentiality of your login credentials and for all
                  activity under your account. You agree to provide
                  accurate, current, and complete information when
                  registering and to keep it up to date.
                </p>
              </section>

              <section id="platform-role" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  3. Our Role as a Marketplace
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  TutorConnect NG is a marketplace that connects independent
                  Tutors with Learners. Tutors are independent contractors
                  and are not employees, agents, or representatives of
                  TutorConnect NG. We do not supervise, direct, or control
                  how a Tutor delivers a session, and we are not a party to
                  the tutoring arrangement between a Tutor and a Learner
                  beyond facilitating discovery, booking, and payment
                  coordination through the Platform.
                </p>
              </section>

              <section id="tutor-verification" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  4. Tutor Verification
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  Tutors may voluntarily submit a government-issued ID and
                  degree/certification for review by our Admin team. A
                  &quot;Verified&quot; badge indicates that submitted
                  documents were reviewed and found satisfactory at the
                  time of review — it is not a guarantee of a Tutor&apos;s
                  teaching quality, conduct, or ongoing compliance.
                  TutorConnect NG reserves the right to request additional
                  documentation, reject a verification request, or revoke a
                  Verified badge at its discretion.
                </p>
              </section>

              <section id="bookings" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  5. Bookings &amp; Sessions
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  When a Learner submits a booking request specifying a
                  subject, grade level, date/time, and session mode (online
                  or in person), the Tutor may accept or decline the
                  request. A confirmed booking is a direct arrangement
                  between the Learner and the Tutor. Both parties agree to
                  honor confirmed session times, communicate promptly about
                  any changes, and conduct themselves professionally and
                  respectfully.
                </p>
              </section>

              <section id="fees" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  6. Fees &amp; Payments
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  Tutors set their own hourly/session rates, displayed in
                  Nigerian Naira (₦). Estimated totals shown during booking
                  are calculated from the Tutor&apos;s stated rate and
                  selected time slot. Where online payment is enabled, fees
                  are processed through licensed third-party payment
                  providers; applicable transaction or service fees will be
                  disclosed before you confirm payment. TutorConnect NG may
                  retain a service/platform fee from completed bookings,
                  disclosed to Tutors at the time of earnings reporting.
                </p>
              </section>

              <section id="cancellations" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  7. Cancellations &amp; Refunds
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  Either party may request to cancel or reschedule a booking
                  prior to the scheduled session time through the
                  respective dashboard. We encourage at least 24 hours&apos;
                  notice where possible. Disputes regarding no-shows,
                  repeated late cancellations, or refund requests may be
                  escalated to our Admin team for review and mediation via
                  the Dispute Management process available on the Admin
                  dashboard.
                </p>
              </section>

              <section id="reviews" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  8. Reviews &amp; Ratings
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  After a completed session, Learners may leave a star
                  rating and written review of their Tutor. Reviews must be
                  honest, based on genuine experience, and free of abusive,
                  defamatory, or unlawful content. TutorConnect NG reserves
                  the right to remove reviews that violate these Terms.
                </p>
              </section>

              <section id="conduct" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  9. Acceptable Use &amp; Conduct
                </h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-600">
                  <li>Do not provide false identity, credential, or verification information.</li>
                  <li>Do not use the Platform for any unlawful, harassing, or abusive purpose.</li>
                  <li>Do not attempt to circumvent the Platform to avoid applicable fees once a booking has been facilitated through TutorConnect NG.</li>
                  <li>Do not post content that is defamatory, obscene, infringing, or discriminatory.</li>
                  <li>Do not attempt to scrape, reverse-engineer, or disrupt the Platform&apos;s normal operation.</li>
                </ul>
              </section>

              <section id="content" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  10. User Content &amp; Intellectual Property
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  You retain ownership of content you submit (profile
                  information, photos, bios, reviews), but you grant
                  TutorConnect NG a worldwide, non-exclusive, royalty-free
                  license to host, display, and distribute that content on
                  the Platform for the purpose of operating our services.
                  The TutorConnect NG name, logo, and platform design are
                  the property of TutorConnect NG and may not be used
                  without permission.
                </p>
              </section>

              <section id="suspension" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  11. Suspension &amp; Termination
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  We may suspend or terminate access to the Platform for any
                  account found to violate these Terms, engage in
                  fraudulent activity, or pose a safety risk to other users,
                  as determined through our Admin review process. You may
                  also close your own account at any time by contacting
                  support.
                </p>
              </section>

              <section id="disclaimers" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  12. Disclaimers
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  The Platform is provided on an &quot;as is&quot; and
                  &quot;as available&quot; basis. While we take reasonable
                  steps to verify tutor credentials and maintain platform
                  quality, TutorConnect NG makes no warranty regarding the
                  accuracy of tutor profiles, the outcomes of tutoring
                  sessions (including examination results), or uninterrupted
                  availability of the Platform.
                </p>
              </section>

              <section id="liability" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  13. Limitation of Liability
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  To the maximum extent permitted by applicable Nigerian
                  law, TutorConnect NG and its officers, employees, and
                  affiliates shall not be liable for any indirect,
                  incidental, special, or consequential damages arising
                  from your use of the Platform or any interaction between
                  Learners and Tutors, including disputes arising from the
                  quality or outcome of a tutoring session.
                </p>
              </section>

              <section id="indemnity" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  14. Indemnification
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  You agree to indemnify and hold harmless TutorConnect NG
                  from any claims, damages, or expenses (including
                  reasonable legal fees) arising from your breach of these
                  Terms or your misuse of the Platform.
                </p>
              </section>

              <section id="governing-law" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  15. Governing Law
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  These Terms are governed by and construed in accordance
                  with the laws of the Federal Republic of Nigeria, without
                  regard to its conflict-of-law provisions. Any disputes
                  arising from these Terms shall be subject to the exclusive
                  jurisdiction of the courts of Lagos State, Nigeria.
                </p>
              </section>

              <section id="changes" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  16. Changes to These Terms
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  We may revise these Terms from time to time. Continued use
                  of the Platform after changes take effect constitutes
                  acceptance of the revised Terms. We will update the
                  &quot;Last updated&quot; date above whenever changes are
                  made.
                </p>
              </section>

              <section id="contact" className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  17. Contact Us
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  Questions about these Terms? Reach out to us:
                </p>
                <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                  <p>📍 12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria</p>
                  <p>📞 08128055914</p>
                  <p>✉️ hello@tutorconnect.ng</p>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  You may also review our{" "}
                  <Link href="/privacy" className="font-semibold text-navy-700 hover:text-navy-900">
                    Privacy Policy
                  </Link>{" "}
                  or visit our{" "}
                  <Link href="/contact" className="font-semibold text-navy-700 hover:text-navy-900">
                    Contact page
                  </Link>
                  .
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
