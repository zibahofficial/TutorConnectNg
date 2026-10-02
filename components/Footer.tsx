import Link from "next/link";
import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.3c0-.87.24-1.46 1.49-1.46h1.59V4.14C15.9 4.1 14.9 4 13.72 4 11.26 4 9.59 5.49 9.59 8.26v2.24H7v3h2.59V21h3.91Z" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 3h3.1l-6.77 7.73L23 21h-6.23l-4.88-6.38L6.3 21H3.2l7.24-8.27L2 3h6.38l4.4 5.83L18.9 3Zm-1.09 16.17h1.72L7.3 4.73H5.46l12.35 14.44Z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { Icon: FacebookIcon, label: "Facebook", href: "https://facebook.com/tutorconnectng" },
  { Icon: TwitterIcon, label: "X (Twitter)", href: "https://x.com/tutorconnectng" },
  { Icon: InstagramIcon, label: "Instagram", href: "https://instagram.com/tutorconnectng" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-navy-900 text-slate-300">
      <div className="container-app grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-600 to-emerald-500 text-white">
              <GraduationCap size={22} />
            </span>
            <span className="font-display text-lg font-extrabold text-white">
              TutorConnect <span className="text-emerald-400">NG</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Nigeria&apos;s trusted marketplace for verified local &amp; online
            tutors — from foundational numeracy to WAEC, JAMB, Cambridge
            IGCSE, and modern tech skills.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {SOCIAL_LINKS.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`TutorConnect NG on ${label}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-emerald-500 hover:text-white"
              >
                <Icon width={16} height={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">
            Platform
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/tutors" className="hover:text-white">Find Tutors</Link></li>
            <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
            <li><Link href="/signup?role=tutor" className="hover:text-white">Become a Tutor</Link></li>
            <li><Link href="/dashboard/admin" className="hover:text-white">Admin Panel</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">
            Company
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">
            Contact
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-400" />
              <a
                href="https://maps.google.com/?q=12+Admiralty+Way,+Lekki+Phase+1,+Lagos,+Nigeria"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-emerald-400" />
              <a href="tel:+2348128055914" className="hover:text-white">
                08128055914
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="text-emerald-400" />
              <a href="mailto:hello@tutorconnect.ng" className="hover:text-white">
                hello@tutorconnect.ng
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <p className="container-app text-center text-xs text-slate-500">
          © {new Date().getFullYear()} TutorConnect NG. All rights reserved. Built for Nigerian learners, everywhere.
        </p>
      </div>
    </footer>
  );
}
