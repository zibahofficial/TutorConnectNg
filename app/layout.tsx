import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TutorConnect NG | Find Verified Local & Online Tutors Across Nigeria",
  description:
    "Personalized 1-on-1 tutoring tailored to WAEC, JAMB, Cambridge IGCSE, Coding and foundational subjects. Connect with verified Nigerian tutors today.",
  keywords: [
    "tutors in Nigeria",
    "WAEC tutor",
    "JAMB tutor",
    "online tutoring Nigeria",
    "home lesson Lagos",
    "TutorConnect NG",
  ],
  openGraph: {
    title: "TutorConnect NG",
    description:
      "Find Verified Local & Online Tutors Across Nigeria. Book trusted tutors for WAEC, JAMB, IGCSE, Coding and more.",
    type: "website",
    locale: "en_NG",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E3A8A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
