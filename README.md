# Filament workspace (inventory + workshop)

Next.js app: Bambu Lab filament inventory, Amazon affiliate **Workshop** picks, auth, and optional Postgres for production.

## Local development

```bash
npm install
npm run dev
```

- Data defaults to **SQLite** at `data/app.db` (created on first run). The file is gitignored; do not commit real user data.
- Copy `.env.example` to `.env.local` if you need SMTP or a fixed `AUTH_SECRET` locally.

## Deploy on Vercel

1. Create a **Postgres** database (e.g. [Neon](https://neon.tech) or [Supabase](https://supabase.com)) and copy the connection string.
2. In the Vercel project → **Settings → Environment Variables**, set at least:
   - `AUTH_SECRET` — long random string (e.g. `openssl rand -base64 32`).
   - `DATABASE_URL` — Postgres URL (required so inventory and users persist; serverless filesystem is not safe for SQLite).
   - Optional but needed for email verification in production: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (see `.env.example`).
3. Remove any placeholder keys (e.g. `EXAMPLE_NAME`) and deploy from the repo root (framework: **Next.js**, root `./`).

If `DATABASE_URL` is **not** set, the app still uses SQLite — fine for your machine, **not** for Vercel production.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run sync:catalog` | Regenerate search catalog JSON |
| `npm run sync:bambu-images` | Fill `previewUrl` in Bambu colors from store HTML |
| `npm run sync:sunlu` | SUNLU colors from Shopify (if used) |

## Learn More

To learn more about Next.js, take a look at the [Next.js Documentation](https://nextjs.org/docs).
