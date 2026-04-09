/** When set, the app uses PostgreSQL (recommended for Vercel). Otherwise SQLite on disk. */
export function isPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
