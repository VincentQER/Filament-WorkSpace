/**
 * Database configuration
 * ----------------------
 * - Local dev: SQLite file `data/app.db` via `getSqliteDb()`.
 * - Production (Vercel): set `DATABASE_URL` to a Postgres connection string (e.g. Neon).
 *
 * Prefer using `@/lib/repos/*` from API routes rather than touching drivers directly.
 */
export { isPostgres } from "./db-config";
export { getSqliteDb } from "./db-sqlite";
export { getPool, ensurePostgresMigrated } from "./db-pg";
