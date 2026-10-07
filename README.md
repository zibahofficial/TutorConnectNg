# TutorConnect NG 🎓

A full-stack EdTech marketplace connecting Nigerian students & parents with
verified local and online tutors — built with **Next.js 16 (App Router,
React 19, TypeScript)**, **Tailwind CSS**, **Framer Motion**, **lucide-react**,
and **Neon Serverless Postgres**.

![Tech](https://img.shields.io/badge/Next.js-16-black) ![Tech](https://img.shields.io/badge/React-19-blue) ![Tech](https://img.shields.io/badge/TypeScript-5-blue) ![Tech](https://img.shields.io/badge/Tailwind-4-38bdf8) ![DB](https://img.shields.io/badge/Postgres-Neon-00e599)

---

## ✨ Features

- **Dual-state animated hero** toggling between "Discover & Learn" (student/parent)
  and "Inspiration & Teach" (tutor) modes with Framer Motion transitions.
- **Top Subjects & Skills grid** with hover-lift gradient-glow cards and live
  tutor-count badges.
- **Live Filter & Matching Engine** — subject, state/LGA, Naira budget slider,
  weekday/weekend availability, and curriculum (Nigerian National / British
  Cambridge / American).
- **Tutor profile pages** with verified-ID badges, credentials, star ratings,
  reviews, and an interactive weekly availability calendar.
- **Booking flow modal** — grade level, subject, date/time slot, online
  (Google Meet/Zoom) or in-person mode, and notes — with live price estimate
  in ₦.
- **Three role-based dashboards**:
  - **Student / Parent** — track requests, upcoming sessions, leave reviews.
  - **Tutor** — accept/decline requests, manage weekly availability, track earnings.
  - **Admin** — review ID/degree verification uploads, approve/suspend tutors,
    monitor booking metrics & disputes.
- **Neon Serverless Postgres** schema with triggers to auto-update tutor
  rating averages, plus explicit empty states (never fabricated data) when the
  database has nothing to show yet.

---

## 🏗️ Tech Stack

| Layer      | Choice                                                            |
| ---------- | ------------------------------------------------------------------ |
| Framework  | Next.js 16 (App Router), React 19, TypeScript                     |
| Styling    | Tailwind CSS v4, custom design tokens (navy/indigo, emerald, amber) |
| Animation  | Framer Motion                                                      |
| Icons      | lucide-react                                                       |
| Database   | Neon Serverless Postgres (`@neondatabase/serverless`)              |
| Auth       | JWT (`jsonwebtoken`) + bcrypt password hashing                     |
| Deployment | Vercel (zero-config, serverless/Node runtime API routes)           |

---

## 📁 Project Structure

```text
tutorconnect-ng/
├── .env.example
├── package.json
├── README.md
├── tailwind.config.js
├── next.config.ts
├── db/
│   ├── schema.sql          # Full Postgres DDL (tables, enums, triggers, seed)
│   └── neon.ts             # Neon serverless SQL client
├── lib/
│   ├── types.ts            # Shared TypeScript domain types
│   ├── site-config.ts      # Static filter taxonomies & marketing copy (no data)
│   └── auth-store.ts       # In-memory auth fallback (used without a DB)
├── app/
│   ├── layout.tsx
│   ├── page.tsx             # Hero, Subject Grid, Featured Tutors, Testimonials
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── how-it-works/page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── tutors/
│   │   ├── page.tsx         # Search, Filters & Tutor Directory
│   │   └── [id]/page.tsx    # Tutor Public Profile & Availability Booking
│   ├── dashboard/
│   │   ├── student/page.tsx
│   │   ├── tutor/page.tsx
│   │   └── admin/page.tsx
│   └── api/
│       ├── tutors/route.ts  # GET (filterable, Neon-first w/ mock fallback)
│       ├── bookings/route.ts# GET / POST / PATCH
│       └── auth/route.ts    # POST (login / signup)
└── components/
    ├── Navbar.tsx
    ├── HeroSlider.tsx
    ├── SubjectGrid.tsx
    ├── TutorCard.tsx
    ├── BookingModal.tsx
    ├── AvailabilityCalendar.tsx
    ├── TutorProfileActions.tsx
    ├── DashboardShell.tsx
    ├── StatCard.tsx
    ├── StatusBadge.tsx
    ├── HowItWorks.tsx
    ├── StatsBar.tsx
    ├── Testimonials.tsx
    └── Footer.tsx
```

---

## 🚀 Getting Started Locally

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL + JWT_SECRET (optional for demo)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **No database configured?** Auth and chat fall back to an in-memory store,
> while tutor, booking and verification screens show explicit empty states —
> tutors and bookings are never fabricated. Set `DATABASE_URL` to use real records.

---

## 🐘 Connecting Neon Serverless Postgres

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the **pooled connection string** from your Neon dashboard.
3. Set it as `DATABASE_URL` in `.env.local` (dev) and in your Vercel Project
   → Settings → Environment Variables (production).
4. Run the schema against your database:

   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```

   This creates all 6 core tables (`users`, `tutor_profiles`, `tutor_subjects`,
   `tutor_availability`, `bookings`, `reviews`), enum types, indexes, and a
   trigger that automatically keeps `tutor_profiles.rating_avg` /
   `total_reviews` in sync whenever a review is inserted, updated, or deleted.

5. Once `DATABASE_URL` is present, `app/api/tutors/route.ts` and
   `app/api/bookings/route.ts` automatically query Neon directly (via
   `db/neon.ts`, built on `@neondatabase/serverless` for HTTP-based edge/
   serverless-friendly connections). Auth routes
   behave the same way — signup/login will persist real rows to `users`.

### How tutors become publicly visible

`db/schema.sql` does not seed any accounts. A tutor appears on the homepage and
in `/tutors` only after they register through the site **and** an admin approves
them (Admin → Credential Applications / Tutor Verification Queue):

- every registration is created with `users.account_status = 'pending'` and
  `tutor_profiles.verification_status = 'pending'` — registration alone never
  makes an account approved or verified;
- an admin approves, rejects, or suspends an account from User Management, and
  verifies credentials from the verification queue;
- only `tutor_profiles.is_verified = TRUE` profiles are returned by
  `db/tutors.ts`, so unapproved tutors are never exposed publicly.

`users.account_status` is added non-destructively by
`db/migrations/0001_users_account_status.sql` (also applied automatically on
first use — see `db/migrate.ts`).

---

## ☁️ Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the project into [Vercel](https://vercel.com/new).
3. Add environment variables (`DATABASE_URL`, `JWT_SECRET`,
   `NEXT_PUBLIC_APP_URL`) in Project Settings.
4. Deploy — Vercel auto-detects Next.js, builds with `next build`, and
   deploys API routes as serverless Node.js functions (configured via
   `export const runtime = "nodejs"` in each route for bcrypt/jsonwebtoken
   compatibility).
5. Point your Neon database's pooled endpoint (not the direct endpoint) at
   `DATABASE_URL` for best performance on serverless/edge invocations.

No additional `vercel.json` configuration is required.

---

## 🗄️ Database Schema Overview

See [`db/schema.sql`](./db/schema.sql) for the full DDL. Summary:

| Table                 | Purpose                                                          |
| --------------------- | ----------------------------------------------------------------- |
| `users`               | All accounts — students, parents, tutors, admins                 |
| `tutor_profiles`      | 1:1 extension of `users` for tutor-specific data & verification   |
| `tutor_subjects`      | Many subjects per tutor profile, with level (WAEC, IGCSE, etc.)   |
| `tutor_availability`  | Weekly recurring time slots per tutor                            |
| `bookings`            | Session requests with status lifecycle & pricing                 |
| `reviews`             | 1:1 with a completed booking; auto-updates tutor rating via trigger |

---

## 🔐 Demo Auth Notes

For speed of delivery, `app/login` / `app/signup` call `app/api/auth/route.ts`,
which:

- Uses real Postgres (`users` table, bcrypt-hashed passwords, JWT) when
  `DATABASE_URL` is set.
- Falls back to an in-memory `Map` (`lib/auth-store.ts`) otherwise, so you can
  sign up and log in immediately in a fresh deployment/demo without a
  database — note this in-memory store resets on cold start/redeploy.
- Admin access (demo mode only): set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in
  `.env.local` — the in-memory store seeds that account automatically. No
  credentials are hardcoded in the repository. With a database connected,
  create the admin row directly in `users` (see the note at the bottom of
  `db/schema.sql`).
- Dashboards (`/dashboard/student`, `/dashboard/tutor`, `/dashboard/admin`)
  are intentionally left **unprotected by middleware** in this build so
  reviewers/stakeholders can access all three role views directly from the
  nav for demo purposes. For production, add Next.js Middleware that reads
  the JWT cookie/header and redirects unauthenticated or wrong-role users.

---

## 🎨 Design System

- **Primary accent:** Deep indigo/navy (`#1E3A8A` → `#2563EB` gradient)
- **Status/positive:** Emerald (`#10B981`)
- **Warm accent:** Amber (`#F59E0B`)
- **Shape language:** `rounded-2xl`/`rounded-3xl` cards, soft diffused
  drop-shadows (`shadow-card`, `shadow-soft`, `shadow-glow`)
- **Typography:** Inter (body) + Plus Jakarta Sans (display/headings)
- All hero and tutor imagery is AI-generated, photorealistic, and
  authentically Nigerian/African in styling per the product's brand
  requirements, stored locally under `public/images/`.

---

## 📜 License

MIT — build on top of this freely for your own EdTech venture.
