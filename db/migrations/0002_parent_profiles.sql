-- =========================================================================
-- 0002 — parent_profiles table
-- =========================================================================
-- Non-destructive and idempotent. The API has always written to this table on
-- parent registration and read it for the parent dashboard's children list, but
-- it was missing from db/schema.sql, so parent signup failed on any database
-- created from that schema.
--
-- `CREATE TABLE IF NOT EXISTS` leaves an already-existing table (and all of its
-- data) completely untouched.
--
-- Run with: psql "$DATABASE_URL" -f db/migrations/0002_parent_profiles.sql
-- (also applied lazily by the app — see db/migrate.ts).
-- =========================================================================

CREATE TABLE IF NOT EXISTS parent_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  child_name        VARCHAR(150),
  child_age         SMALLINT,
  educational_level VARCHAR(100),
  tutor_budget      NUMERIC(10, 2),
  learning_mode     VARCHAR(50),
  terms_agreed_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_profiles_user ON parent_profiles(user_id);
