import Database from "better-sqlite3";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "app.db");
const db = new Database(dbPath);

// ─── Enable WAL mode for better concurrent read performance ──────────────────
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// ─── Migration runner ────────────────────────────────────────────────────────
//
// Each migration is a { version: number, up: string | (() => void) } entry.
// Migrations are applied in order and each version is recorded in
// schema_migrations so it is never re-applied.

db.exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

type Migration = { version: number; up: string | (() => void) };

const migrations: Migration[] = [
  // ── v1: baseline schema ─────────────────────────────────────────────────────
  // The users and inventory_states tables may already exist (old installs) so we
  // use CREATE TABLE IF NOT EXISTS. New installs get both tables from scratch.
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

  // ── v2: add missing users columns for pre-v1 DBs ───────────────────────────
  // ALTER TABLE ignores errors so we run each individually via a function.
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

      // Mark users created before email verification existed as verified.
      const needsGrandfathering = db
        .prepare("SELECT COUNT(*) as n FROM schema_migrations WHERE version = 2")
        .get() as { n: number };
      if (!cols.has("email_verified") && needsGrandfathering.n === 0) {
        db.exec("UPDATE users SET email_verified = 1");
      }
    },
  },

  // ── v3: row-based inventory_items (replaces the single JSON blob) ───────────
  //
  // Each filament spool / roll is its own row.  Complex sub-objects
  // (stockByLocation, locations) are stored as JSON columns — they are always
  // read/written together with the rest of the row, so there is no need to
  // normalise them further at this stage.
  //
  // inventory_states is kept intact as a fallback/backup; the migration
  // function also moves any existing blob data into the new table.
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

      // ── migrate existing blob data ──────────────────────────────────────────
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
              id:                    String(item.id ?? crypto.randomUUID()),
              user_id:               blob.user_id,
              name:                  String(item.name ?? ""),
              brand:                 String(item.brand ?? ""),
              type:                  String(item.type ?? ""),
              color:                 String(item.color ?? ""),
              sku:                   String(item.sku ?? ""),
              color_hex:             item.colorHex ? String(item.colorHex) : null,
              status:                String(item.status ?? "owned"),
              buy_more:              item.buyMore ? 1 : 0,
              spools:                Number(item.spools ?? 0),
              refills:               Number(item.refills ?? 0),
              open_spool_weight:     Number(item.openSpoolWeight ?? 0),
              min_stock:             Number(item.minStock ?? 0),
              favorite:              item.favorite ? 1 : 0,
              note:                  String(item.note ?? ""),
              updated_at:            Number(item.updatedAt ?? Date.now()),
              locations_json:        JSON.stringify(item.locations ?? ["Default"]),
              stock_by_location_json: JSON.stringify(item.stockByLocation ?? []),
            });
          }
        }
      });

      migrateAll();
      console.log(`[db] Migrated ${blobs.length} user blob(s) → inventory_items rows`);
    },
  },
  // ── v4: workshop affiliate click analytics ─────────────────────────────────
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
];

// ─── Apply pending migrations ────────────────────────────────────────────────
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

export default db;
