import Database from "better-sqlite3";
import path from "node:path";
import { getDatabaseUrl } from "./db-config";

function createDatabase(): Database.Database {
  if (process.env["VERCEL"] === "1" && !getDatabaseUrl()) {
    throw new Error(
      "Set DATABASE_URL (Neon connection string) in Vercel → Settings → Environment Variables, then Redeploy. SQLite does not work on Vercel.",
    );
  }
  const dbPath = path.join(process.cwd(), "data", "app.db");
  const db = new Database(dbPath);

 // ─── Enable WAL mode for better concurrent read performance ──────────────────
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

  type Migration = { version: number; up: string | (() => void) };

  const migrations: Migration[] = [
    {
      version: 1,
      up: `
      CREATE TABLE IF NOT EXISTS users (
        id                   INTEGER PRIMARY KEY AUTOINCREMENT,
        email                TEXT    UNIQUE NOT NULL,
        password_hash        TEXT    NOT NULL,
        email_verified       INTEGER NOT NULL DEFAULT 0,
        verification_token   TEXT,
        verification_expires_at TEXT,
        display_name         TEXT,
        avatar_url           TEXT,
        address              TEXT,
        printers_json        TEXT,
        workspace_brands_json TEXT   NOT NULL DEFAULT '[]',
        created_at           TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inventory_states (
        user_id    INTEGER PRIMARY KEY,
        data_json  TEXT    NOT NULL,
        updated_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `,
    },
    {
      version: 2,
      up() {
        const cols = new Set(
          (db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map(
            (c) => c.name,
          ),
        );
        const add = (col: string, def: string) => {
          if (!cols.has(col)) db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
        };
        add("email_verified", "INTEGER NOT NULL DEFAULT 0");
        add("verification_token", "TEXT");
        add("verification_expires_at", "TEXT");
        add("display_name", "TEXT");
        add("avatar_url", "TEXT");
        add("address", "TEXT");
        add("printers_json", "TEXT");
        add("workspace_brands_json", "TEXT NOT NULL DEFAULT '[]'");

        const needsGrandfathering = db
          .prepare("SELECT COUNT(*) as n FROM schema_migrations WHERE version = 2")
          .get() as { n: number };
        if (!cols.has("email_verified") && needsGrandfathering.n === 0) {
          db.exec("UPDATE users SET email_verified = 1");
        }
      },
    },
    {
      version: 3,
      up() {
        db.exec(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id                    TEXT    NOT NULL,
          user_id               INTEGER NOT NULL,
          name                  TEXT    NOT NULL DEFAULT '',
          brand                 TEXT    NOT NULL DEFAULT '',
          type                  TEXT    NOT NULL DEFAULT '',
          color                 TEXT    NOT NULL DEFAULT '',
          sku                   TEXT    NOT NULL DEFAULT '',
          color_hex             TEXT,
          status                TEXT    NOT NULL DEFAULT 'owned',
          buy_more              INTEGER NOT NULL DEFAULT 0,
          spools                INTEGER NOT NULL DEFAULT 0,
          refills               INTEGER NOT NULL DEFAULT 0,
          open_spool_weight     INTEGER NOT NULL DEFAULT 0,
          min_stock             INTEGER NOT NULL DEFAULT 0,
          favorite              INTEGER NOT NULL DEFAULT 0,
          note                  TEXT    NOT NULL DEFAULT '',
          updated_at            INTEGER NOT NULL DEFAULT 0,
          locations_json        TEXT    NOT NULL DEFAULT '["Default"]',
          stock_by_location_json TEXT   NOT NULL DEFAULT '[]',
          PRIMARY KEY (id, user_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_inventory_items_user
          ON inventory_items (user_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_items_brand_type
          ON inventory_items (user_id, brand, type);
      `);

        type BlobRow = { user_id: number; data_json: string };
        const blobs = db
          .prepare("SELECT user_id, data_json FROM inventory_states")
          .all() as BlobRow[];

        if (blobs.length === 0) return;

        const insert = db.prepare(`
        INSERT OR IGNORE INTO inventory_items
          (id, user_id, name, brand, type, color, sku, color_hex, status,
           buy_more, spools, refills, open_spool_weight, min_stock, favorite,
           note, updated_at, locations_json, stock_by_location_json)
        VALUES
          (@id, @user_id, @name, @brand, @type, @color, @sku, @color_hex, @status,
           @buy_more, @spools, @refills, @open_spool_weight, @min_stock, @favorite,
           @note, @updated_at, @locations_json, @stock_by_location_json)
      `);

        const migrateAll = db.transaction(() => {
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
              insert.run({
                id: String(item.id ?? crypto.randomUUID()),
                user_id: blob.user_id,
                name: String(item.name ?? ""),
                brand: String(item.brand ?? ""),
                type: String(item.type ?? ""),
                color: String(item.color ?? ""),
                sku: String(item.sku ?? ""),
                color_hex: item.colorHex ? String(item.colorHex) : null,
                status: String(item.status ?? "owned"),
                buy_more: item.buyMore ? 1 : 0,
                spools: Number(item.spools ?? 0),
                refills: Number(item.refills ?? 0),
                open_spool_weight: Number(item.openSpoolWeight ?? 0),
                min_stock: Number(item.minStock ?? 0),
                favorite: item.favorite ? 1 : 0,
                note: String(item.note ?? ""),
                updated_at: Number(item.updatedAt ?? Date.now()),
                locations_json: JSON.stringify(item.locations ?? ["Default"]),
                stock_by_location_json: JSON.stringify(item.stockByLocation ?? []),
              });
            }
          }
        });

        migrateAll();
        console.log(`[db] Migrated ${blobs.length} user blob(s) → inventory_items rows`);
      },
    },
    {
      version: 4,
      up: `
      CREATE TABLE IF NOT EXISTS workshop_click_events (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id       INTEGER,
        product_id    TEXT    NOT NULL,
        asin          TEXT    NOT NULL,
        category      TEXT    NOT NULL,
        relevant      INTEGER NOT NULL DEFAULT 0,
        source_page   TEXT    NOT NULL DEFAULT '/my-inventory/workshop',
        created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_workshop_click_events_created_at
        ON workshop_click_events (created_at);
      CREATE INDEX IF NOT EXISTS idx_workshop_click_events_product
        ON workshop_click_events (product_id, created_at);
    `,
    },
    // v5 — role-based access control
    {
      version: 5,
      up() {
        const cols = new Set(
          (db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map(
            (c) => c.name,
          ),
        );
        if (!cols.has("role")) {
          db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
        }
        // Bootstrap: promote ADMIN_EMAIL to admin if the env var is set.
        const adminEmail = process.env["ADMIN_EMAIL"]?.trim().toLowerCase();
        if (adminEmail) {
          db.prepare(`UPDATE users SET role = 'admin' WHERE lower(email) = ?`).run(adminEmail);
          console.log(`[db] Bootstrapped admin role for ${adminEmail}`);
        }
      },
    },
    // v6 — DB-backed affiliate products
    {
      version: 6,
      up: `
      CREATE TABLE IF NOT EXISTS affiliate_products (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        title         TEXT    NOT NULL,
        description   TEXT    NOT NULL DEFAULT '',
        image_url     TEXT    NOT NULL DEFAULT '',
        amazon_url    TEXT    NOT NULL,
        asin          TEXT    NOT NULL DEFAULT '',
        category      TEXT    NOT NULL DEFAULT 'essential',
        brand         TEXT    NOT NULL DEFAULT '',
        material_type TEXT    NOT NULL DEFAULT '',
        highlights    TEXT    NOT NULL DEFAULT '',
        price_range   TEXT    NOT NULL DEFAULT '',
        is_active     INTEGER NOT NULL DEFAULT 1,
        sort_order    INTEGER NOT NULL DEFAULT 0,
        created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_affiliate_products_active_sort
        ON affiliate_products (is_active, sort_order);
    `,
    },
    {
      version: 7,
      up: `
      ALTER TABLE affiliate_products ADD COLUMN is_deal       INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE affiliate_products ADD COLUMN original_price TEXT    NOT NULL DEFAULT '';
    `,
    },
  ];

  const applied = new Set(
    (db.prepare("SELECT version FROM schema_migrations").all() as { version: number }[]).map(
      (r) => r.version,
    ),
  );

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;

    db.transaction(() => {
      if (typeof migration.up === "string") {
        db.exec(migration.up);
      } else {
        migration.up();
      }
      db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(migration.version);
    })();

    console.log(`[db] Applied migration v${migration.version}`);
  }

  return db;
}

let singleton: Database.Database | null = null;

export function getSqliteDb(): Database.Database {
  if (!singleton) singleton = createDatabase();
  return singleton;
}
