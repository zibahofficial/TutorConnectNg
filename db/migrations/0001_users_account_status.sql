-- =========================================================================
-- 0001 — users.account_status (admin review lifecycle)
-- =========================================================================
-- Non-destructive and idempotent: it only adds one column with a default and
-- backfills it. No table is dropped, renamed, or rewritten, and no rows are
-- deleted.
--
-- Run with: psql "$DATABASE_URL" -f db/migrations/0001_users_account_status.sql
--
-- The application also applies exactly these statements lazily on first use
-- (see db/migrate.ts), so running this manually is optional.
-- =========================================================================

-- Every account starts as 'pending'; only an admin can approve/reject/suspend.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Backfill so existing accounts keep working:
--   * admins are the reviewers, so they stay approved;
--   * tutors already marked verified (is_verified = TRUE) were approved before;
--   * everything else stays 'pending' until an admin reviews it.
UPDATE users SET account_status = 'approved'
WHERE account_status = 'pending' AND role = 'admin';

UPDATE users u SET account_status = 'approved'
WHERE u.account_status = 'pending'
  AND u.role = 'tutor'
  AND EXISTS (
    SELECT 1 FROM tutor_profiles tp
    WHERE tp.user_id = u.id AND tp.is_verified = TRUE
  );
