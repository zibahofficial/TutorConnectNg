-- =========================================================================
-- TutorConnect NG — PostgreSQL schema (Neon Serverless Postgres)
-- =========================================================================
-- Run with: psql "$DATABASE_URL" -f db/schema.sql
-- Idempotent: safe to re-run (uses IF NOT EXISTS / DROP ... CASCADE guards).
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- -------------------------------------------------------------------------
-- ENUM TYPES
-- -------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'parent', 'tutor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE session_mode AS ENUM ('online', 'in_person');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curriculum_type AS ENUM ('nigerian_national', 'british_cambridge', 'american', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -------------------------------------------------------------------------
-- 1. USERS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(150) NOT NULL,
  role            user_role NOT NULL DEFAULT 'student',
  phone           VARCHAR(30),
  city            VARCHAR(100),
  state           VARCHAR(100),
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_state_city ON users(state, city);

-- -------------------------------------------------------------------------
-- 2. TUTOR PROFILES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tutor_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio               TEXT,
  headline          VARCHAR(200),
  hourly_rate       NUMERIC(10, 2) NOT NULL DEFAULT 2000,
  currency          VARCHAR(5) NOT NULL DEFAULT 'NGN',
  years_experience  INTEGER NOT NULL DEFAULT 0,
  curriculum        curriculum_type NOT NULL DEFAULT 'nigerian_national',
  rating_avg        NUMERIC(3, 2) NOT NULL DEFAULT 0,
  total_reviews     INTEGER NOT NULL DEFAULT 0,
  total_sessions    INTEGER NOT NULL DEFAULT 0,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  id_card_url       TEXT,
  degree_url        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_profiles_verified ON tutor_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_rate ON tutor_profiles(hourly_rate);

-- -------------------------------------------------------------------------
-- 3. TUTOR SUBJECTS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tutor_subjects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id      UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  subject_name  VARCHAR(100) NOT NULL,
  level         VARCHAR(50) NOT NULL DEFAULT 'All Levels', -- Primary, Secondary, WAEC/JAMB, Undergraduate
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_subjects_tutor ON tutor_subjects(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_subjects_name ON tutor_subjects(subject_name);

-- -------------------------------------------------------------------------
-- 4. TUTOR AVAILABILITY
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tutor_availability (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id      UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday ... 6=Saturday
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor ON tutor_availability(tutor_id);

-- -------------------------------------------------------------------------
-- 5. BOOKINGS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutor_id        UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  subject_id      UUID REFERENCES tutor_subjects(id) ON DELETE SET NULL,
  grade_level     VARCHAR(50),
  scheduled_date  DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  status          booking_status NOT NULL DEFAULT 'pending',
  session_mode    session_mode NOT NULL DEFAULT 'online',
  meeting_link    TEXT,
  total_price     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor ON bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(scheduled_date);

-- -------------------------------------------------------------------------
-- 6. REVIEWS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutor_id    UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_tutor ON reviews(tutor_id);

-- -------------------------------------------------------------------------
-- TRIGGERS: keep tutor_profiles.rating_avg / total_reviews in sync
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_tutor_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE tutor_profiles tp
  SET total_reviews = sub.cnt,
      rating_avg = sub.avg_rating
  FROM (
    SELECT tutor_id, COUNT(*) AS cnt, ROUND(AVG(rating)::numeric, 2) AS avg_rating
    FROM reviews
    WHERE tutor_id = COALESCE(NEW.tutor_id, OLD.tutor_id)
    GROUP BY tutor_id
  ) sub
  WHERE tp.id = sub.tutor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_tutor_rating ON reviews;
CREATE TRIGGER trg_update_tutor_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION fn_update_tutor_rating();

-- -------------------------------------------------------------------------
-- updated_at auto-touch trigger for bookings
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_touch ON bookings;
CREATE TRIGGER trg_bookings_touch
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- -------------------------------------------------------------------------
-- SEED DATA (light demo data for first-run experience)
-- -------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, full_name, role, phone, city, state, avatar_url)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@tutorconnect.ng', '$2a$10$abcdefghijklmnopqrstuv', 'TutorConnect Admin', 'admin', '+2348000000000', 'Lagos', 'Lagos', NULL)
ON CONFLICT (email) DO NOTHING;
