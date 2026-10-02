/**
 * Neon Serverless Postgres client
 * ---------------------------------------------------------------------------
 * Uses @neondatabase/serverless so queries work over HTTP fetch in Vercel's
 * Edge/Serverless runtime (no TCP socket pooling required).
 *
 * In local/demo environments where DATABASE_URL is not configured, API
 * routes fall back to the in-memory mock dataset in `lib/mock-data.ts` so the
 * product remains fully explorable without a live database.
 */
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

export const hasDatabase = Boolean(connectionString);

// `sql` is a tagged-template query executor: sql`SELECT * FROM users WHERE id = ${id}`
export const sql = connectionString
  ? neon(connectionString)
  : (async () => {
      throw new Error(
        "DATABASE_URL is not configured. Add it to .env.local or your Vercel project settings."
      );
    });

export type SqlRow = Record<string, unknown>;
