/**
 * Postgres connection string from the host environment (e.g. Vercel).
 *
 * Use bracket access so Next.js does not replace `process.env.DATABASE_URL` with a
 * build-time empty value when the var is only defined on the deployment host.
 */
function pickUrl(raw: string | undefined): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  return t || undefined;
}

export function getDatabaseUrl(): string | undefined {
  return (
    pickUrl(process.env["DATABASE_URL"]) ??
    pickUrl(process.env["POSTGRES_URL"])
  );
}

/** When set, the app uses PostgreSQL (required on Vercel). Otherwise SQLite on disk (local dev). */
export function isPostgres(): boolean {
  return Boolean(getDatabaseUrl());
}
