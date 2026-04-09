import { Pool, type PoolClient } from "pg";
import { getDatabaseUrl } from "./db-config";

let pool: Pool | null = null;
let migrated = false;

export function getPool(): Pool {
  const url = getDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL or POSTGRES_URL is not set.");
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: 8,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 15_000,
      ssl:
        process.env["PGSSLMODE"] === "disable"
          ? undefined
          : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function ensurePostgresMigrated(): Promise<void> {
  if (migrated) return;
  const p = getPool();

  await p.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const { rows: appliedRows } = await p.query<{ version: number }>(
    "SELECT version FROM schema_migrations",
  );
  const applied = new Set(appliedRows.map((r) => r.version));

  type Migrator = {
    version: number;
    up: string | ((client: PoolClient) => Promise<void>);
  };

  const migrations: Migrator[] = [
    {
      version: 1,
      async up(client) {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email_verified INTEGER NOT NULL DEFAULT 0,
            verification_token TEXT,
            verification_expires_at TEXT,
            display_name TEXT,
            avatar_url TEXT,
            address TEXT,
            printers_json TEXT,
            workspace_brands_json TEXT NOT NULL DEFAULT '[]',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )`);
        await client.query(`
          CREATE TABLE IF NOT EXISTS inventory_states (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            data_json TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )`);
      },
    },
    {
      version: 2,
      async up(client) {
        await client.query(
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified INTEGER NOT NULL DEFAULT 0`,
        );
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`);
        await client.query(
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TEXT`,
        );
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS printers_json TEXT`);
        await client.query(
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_brands_json TEXT NOT NULL DEFAULT '[]'`,
        );
      },
    },
    {
      version: 3,
      async up(client) {
        await client.query(`
          CREATE TABLE IF NOT EXISTS inventory_items (
            id TEXT NOT NULL,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL DEFAULT '',
            brand TEXT NOT NULL DEFAULT '',
            type TEXT NOT NULL DEFAULT '',
            color TEXT NOT NULL DEFAULT '',
            sku TEXT NOT NULL DEFAULT '',
            color_hex TEXT,
            status TEXT NOT NULL DEFAULT 'owned',
            buy_more INTEGER NOT NULL DEFAULT 0,
            spools INTEGER NOT NULL DEFAULT 0,
            refills INTEGER NOT NULL DEFAULT 0,
            open_spool_weight INTEGER NOT NULL DEFAULT 0,
            min_stock INTEGER NOT NULL DEFAULT 0,
            favorite INTEGER NOT NULL DEFAULT 0,
            note TEXT NOT NULL DEFAULT '',
            updated_at BIGINT NOT NULL DEFAULT 0,
            locations_json TEXT NOT NULL DEFAULT '["Default"]',
            stock_by_location_json TEXT NOT NULL DEFAULT '[]',
            PRIMARY KEY (id, user_id)
          )`);
        await client.query(
          `CREATE INDEX IF NOT EXISTS idx_inventory_items_user ON inventory_items (user_id)`,
        );
        await client.query(
          `CREATE INDEX IF NOT EXISTS idx_inventory_items_brand_type ON inventory_items (user_id, brand, type)`,
        );

        const blobs = (
          await client.query<{ user_id: number; data_json: string }>(
            "SELECT user_id, data_json FROM inventory_states",
          )
        ).rows;

        for (const blob of blobs) {
          let items: unknown[];
          try {
            items = JSON.parse(blob.data_json);
          } catch {
            continue;
          }
          if (!Array.isArray(items)) continue;

          for (const raw of items) {
            const item = raw as Record<string, unknown>;
            await client.query(
              `INSERT INTO inventory_items
                (id, user_id, name, brand, type, color, sku, color_hex, status,
                 buy_more, spools, refills, open_spool_weight, min_stock, favorite,
                 note, updated_at, locations_json, stock_by_location_json)
              VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
              ON CONFLICT (id, user_id) DO NOTHING`,
              [
                String(item.id ?? crypto.randomUUID()),
                blob.user_id,
                String(item.name ?? ""),
                String(item.brand ?? ""),
                String(item.type ?? ""),
                String(item.color ?? ""),
                String(item.sku ?? ""),
                item.colorHex ? String(item.colorHex) : null,
                String(item.status ?? "owned"),
                item.buyMore ? 1 : 0,
                Number(item.spools ?? 0),
                Number(item.refills ?? 0),
                Number(item.openSpoolWeight ?? 0),
                Number(item.minStock ?? 0),
                item.favorite ? 1 : 0,
                String(item.note ?? ""),
                Number(item.updatedAt ?? Date.now()),
                JSON.stringify(item.locations ?? ["Default"]),
                JSON.stringify(item.stockByLocation ?? []),
              ],
            );
          }
        }
      },
    },
    {
      version: 4,
      async up(client) {
        await client.query(`
          CREATE TABLE IF NOT EXISTS workshop_click_events (
            id BIGSERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            product_id TEXT NOT NULL,
            asin TEXT NOT NULL,
            category TEXT NOT NULL,
            relevant INTEGER NOT NULL DEFAULT 0,
            source_page TEXT NOT NULL DEFAULT '/my-inventory/workshop',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )`);
        await client.query(
          `CREATE INDEX IF NOT EXISTS idx_workshop_click_events_created_at ON workshop_click_events (created_at)`,
        );
        await client.query(
          `CREATE INDEX IF NOT EXISTS idx_workshop_click_events_product ON workshop_click_events (product_id, created_at)`,
        );
      },
    },
    // v5 — role-based access control
    {
      version: 5,
      async up(client) {
        await client.query(
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`,
        );
        // Bootstrap: promote ADMIN_EMAIL to admin if the env var is set.
        const adminEmail = process.env["ADMIN_EMAIL"]?.trim().toLowerCase();
        if (adminEmail) {
          await client.query(
            `UPDATE users SET role = 'admin' WHERE lower(email) = $1`,
            [adminEmail],
          );
          console.log(`[db-pg] Bootstrapped admin role for ${adminEmail}`);
        }
      },
    },
    // v6 — DB-backed affiliate products
    {
      version: 6,
      async up(client) {
        await client.query(`
          CREATE TABLE IF NOT EXISTS affiliate_products (
            id          BIGSERIAL PRIMARY KEY,
            title       TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            image_url   TEXT NOT NULL DEFAULT '',
            amazon_url  TEXT NOT NULL,
            asin        TEXT NOT NULL DEFAULT '',
            category    TEXT NOT NULL DEFAULT 'essential',
            brand       TEXT NOT NULL DEFAULT '',
            material_type TEXT NOT NULL DEFAULT '',
            highlights  TEXT NOT NULL DEFAULT '',
            price_range TEXT NOT NULL DEFAULT '',
            is_active   INTEGER NOT NULL DEFAULT 1,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )`);
        await client.query(
          `CREATE INDEX IF NOT EXISTS idx_affiliate_products_active_sort ON affiliate_products (is_active, sort_order)`,
        );
      },
    },
  ];

  for (const m of migrations) {
    if (applied.has(m.version)) continue;
    const c = await p.connect();
    try {
      await c.query("BEGIN");
      if (typeof m.up === "string") {
        await c.query(m.up);
      } else {
        await m.up(c);
      }
      await c.query("INSERT INTO schema_migrations (version) VALUES ($1)", [m.version]);
      await c.query("COMMIT");
      console.log(`[db-pg] Applied migration v${m.version}`);
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }

  migrated = true;
}
