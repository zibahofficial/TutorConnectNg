/**
 * Idempotent, non-destructive schema guards.
 * ---------------------------------------------------------------------------
 * These run lazily (once per server process) the first time an endpoint that
 * needs them is hit. They only ever ADD a column / backfill a value — nothing
 * is dropped, renamed, or deleted, so running them against an existing
 * production database is safe. The same statements live in
 * `db/migrations/0001_users_account_status.sql` for manual/DBA execution.
 */
import { hasDatabase, sql } from "./neon";

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

let usersAccountStatusReady: Promise<boolean> | null = null;
let parentProfilesReady: Promise<boolean> | null = null;

/**
 * Ensures the `parent_profiles` table exists.
 *
 * The API has always written to this table on parent registration (and reads it
 * for the parent dashboard's children list), but it was missing from
 * `db/schema.sql` — so on a database created from that schema, parent signup
 * failed. `CREATE TABLE IF NOT EXISTS` is a no-op wherever the table already
 * exists, so this is safe to run against an existing production database.
 */
export function ensureParentProfiles(): Promise<boolean> {
  if (!hasDatabase) return Promise.resolve(false);
  if (!parentProfilesReady) {
    parentProfilesReady = (async () => {
      const typedSql = sql as unknown as SqlTag;
      try {
        await typedSql`
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
          )
        `;
        await typedSql`
          CREATE INDEX IF NOT EXISTS idx_parent_profiles_user ON parent_profiles(user_id)
        `;
        return true;
      } catch (err) {
        console.error("Could not ensure the parent_profiles table exists:", err);
        parentProfilesReady = null; // allow a later request to retry
        return false;
      }
    })();
  }
  return parentProfilesReady;
}

/**
 * Ensures `users.account_status` exists (pending | approved | rejected | suspended).
 *
 * New rows default to 'pending' so a successful registration never looks
 * approved. Existing accounts are backfilled so the change is non-disruptive:
 *   - admins become 'approved' (they are the reviewers),
 *   - tutors that were already verified become 'approved',
 *   - everyone else stays 'pending' until an admin reviews them.
 *
 * Resolves to `true` when the column is available, `false` when we could not
 * confirm it (e.g. the request timed out) so callers can degrade safely
 * instead of crashing.
 */
export function ensureUsersAccountStatus(): Promise<boolean> {
  if (!hasDatabase) return Promise.resolve(false);
  if (!usersAccountStatusReady) {
    usersAccountStatusReady = (async () => {
      const typedSql = sql as unknown as SqlTag;
      try {
        await typedSql`
          ALTER TABLE users
          ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        `;
        await typedSql`
          UPDATE users SET account_status = 'approved'
          WHERE account_status = 'pending' AND role = 'admin'
        `;
        await typedSql`
          UPDATE users u SET account_status = 'approved'
          WHERE u.account_status = 'pending'
            AND u.role = 'tutor'
            AND EXISTS (
              SELECT 1 FROM tutor_profiles tp
              WHERE tp.user_id = u.id AND tp.is_verified = TRUE
            )
        `;
        return true;
      } catch (err) {
        console.error("Could not ensure users.account_status column exists:", err);
        usersAccountStatusReady = null; // allow a later request to retry
        return false;
      }
    })();
  }
  return usersAccountStatusReady;
}
