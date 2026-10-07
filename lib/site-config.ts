/**
 * Static site configuration (no application data).
 * ---------------------------------------------------------------------------
 * Filter taxonomies and marketing copy only. Tutors, bookings, reviews and
 * every other user record are read from PostgreSQL — there is no mock/demo
 * dataset in this project.
 */
import type { SubjectCard } from "./types";

export const SUBJECT_CARDS: SubjectCard[] = [
  {
    id: "maths",
    title: "Mathematics & Further Maths",
    description: "WAEC / JAMB / NECO exam preparation with proven past-question drilling methods.",
    icon: "Sigma",
    accent: "from-indigo-500 to-blue-600",
  },
  {
    id: "english",
    title: "English & Literature",
    description: "Comprehension, essay writing, oral English, and literature-in-English coaching.",
    icon: "BookOpenText",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "sciences",
    title: "Sciences",
    description: "Physics, Chemistry & Biology — practicals, theory, and lab-report guidance.",
    icon: "FlaskConical",
    accent: "from-sky-500 to-indigo-600",
  },
  {
    id: "webdev",
    title: "Full-Stack Web Dev & Python",
    description: "Build real projects: JavaScript, React, Python, and backend fundamentals.",
    icon: "Code2",
    accent: "from-violet-500 to-purple-600",
  },
  {
    id: "ai-data",
    title: "Generative AI & Data Skills",
    description: "Prompt engineering, machine learning basics, Excel, SQL & data analysis.",
    icon: "BrainCircuit",
    accent: "from-amber-500 to-orange-600",
  },
  {
    id: "uiux",
    title: "UI/UX & Digital Design",
    description: "Figma, design systems, portfolio reviews, and product design fundamentals.",
    icon: "PenTool",
    accent: "from-pink-500 to-rose-600",
  },
  {
    id: "exam-prep",
    title: "Exam Prep",
    description: "NECO, Post-UTME, SAT, and IELTS — strategy, mock tests, and timed practice.",
    icon: "GraduationCap",
    accent: "from-blue-600 to-navy-700",
  },
  {
    id: "foundational",
    title: "Foundational Literacy & Numeracy",
    description: "Early-years reading, phonics, and primary numeracy for a strong head start.",
    icon: "Baby",
    accent: "from-emerald-500 to-lime-600",
  },
];

export const STATES = [
  "Lagos (Lekki)",
  "Lagos (Ikeja)",
  "Lagos (Yaba)",
  "Abuja (Maitama)",
  "Abuja (Gwarinpa)",
  "Port Harcourt",
  "Ibadan",
  "Online / Remote",
];

export const SUBJECT_FILTERS = ["Maths", "Sciences", "Tech", "Languages", "Commercial", "Exam Prep"];

export const CURRICULA = ["Nigerian National", "British Cambridge", "American"];
