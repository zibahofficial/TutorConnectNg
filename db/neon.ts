/**
 * Neon Serverless Postgres client
 * ---------------------------------------------------------------------------
 * Uses @neondatabase/serverless so queries work over HTTP fetch in Vercel's
 * Edge/Serverless runtime (no TCP socket pooling required).
 *
 * When DATABASE_URL is not configured the API routes degrade to explicit
 * empty states (never fabricated data) so missing configuration is obvious.
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
