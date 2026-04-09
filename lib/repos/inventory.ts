import type { Item } from "@/lib/inventory-item";
import { isPostgres } from "../db-config";
import { ensurePostgresMigrated, getPool } from "../db-pg";
import { getSqlite } from "./_sqlite";

export type ItemRow = {
  id: string;
  user_id: number;
  name: string;
  brand: string;
  type: string;
  color: string;
  sku: string;
  color_hex: string | null;
  status: string;
  buy_more: number;
  spools: number;
  refills: number;
  open_spool_weight: number;
  min_stock: number;
  favorite: number;
  note: string;
  updated_at: number;
  locations_json: string;
  stock_by_location_json: string;
};

function itemToParams(item: Item, userId: number) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name ?? "",
    brand: item.brand ?? "",
    type: item.type ?? "",
    color: item.color ?? "",
    sku: item.sku ?? "",
    color_hex: item.colorHex ?? null,
    status: item.status ?? "owned",
    buy_more: item.buyMore ? 1 : 0,
    spools: Math.max(0, Math.floor(Number(item.spools) || 0)),
    refills: Math.max(0, Math.floor(Number(item.refills) || 0)),
    open_spool_weight: Math.max(0, Math.floor(Number(item.openSpoolWeight) || 0)),
    min_stock: Math.max(0, Math.floor(Number(item.minStock) || 0)),
    favorite: item.favorite ? 1 : 0,
    note: item.note ?? "",
    updated_at: typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
    locations_json: JSON.stringify(item.locations ?? ["Default"]),
    stock_by_location_json: JSON.stringify(item.stockByLocation ?? []),
  };
}

export async function inventoryListForUser(userId: number): Promise<ItemRow[]> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const r = await getPool().query<ItemRow>(
      `SELECT * FROM inventory_items WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId],
    );
    return r.rows;
  }
  const db = await getSqlite();
  return db
    .prepare("SELECT * FROM inventory_items WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId) as ItemRow[];
}

export async function inventoryReplaceAllForUser(userId: number, items: Item[]): Promise<void> {
  if (isPostgres()) {
    await ensurePostgresMigrated();
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const item of items) {
        const p = itemToParams(item, userId);
        await client.query(
          `INSERT INTO inventory_items
            (id, user_id, name, brand, type, color, sku, color_hex, status,
             buy_more, spools, refills, open_spool_weight, min_stock, favorite,
             note, updated_at, locations_json, stock_by_location_json)
          VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
          ON CONFLICT (id, user_id) DO UPDATE SET
            name                   = EXCLUDED.name,
            brand                  = EXCLUDED.brand,
            type                   = EXCLUDED.type,
            color                  = EXCLUDED.color,
            sku                    = EXCLUDED.sku,
            color_hex              = EXCLUDED.color_hex,
            status                 = EXCLUDED.status,
            buy_more               = EXCLUDED.buy_more,
            spools                 = EXCLUDED.spools,
            refills                = EXCLUDED.refills,
            open_spool_weight      = EXCLUDED.open_spool_weight,
            min_stock              = EXCLUDED.min_stock,
            favorite               = EXCLUDED.favorite,
            note                   = EXCLUDED.note,
            updated_at             = EXCLUDED.updated_at,
            locations_json         = EXCLUDED.locations_json,
            stock_by_location_json = EXCLUDED.stock_by_location_json`,
          [
            p.id,
            p.user_id,
            p.name,
            p.brand,
            p.type,
            p.color,
            p.sku,
            p.color_hex,
            p.status,
            p.buy_more,
            p.spools,
            p.refills,
            p.open_spool_weight,
            p.min_stock,
            p.favorite,
            p.note,
            p.updated_at,
            p.locations_json,
            p.stock_by_location_json,
          ],
        );
      }
      const ids = items.map((i) => i.id);
      await client.query(
        `DELETE FROM inventory_items WHERE user_id = $1 AND NOT (id = ANY($2::text[]))`,
        [userId, ids],
      );
      await client.query(
        `INSERT INTO inventory_states (user_id, data_json, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           data_json = EXCLUDED.data_json,
           updated_at = NOW()`,
        [userId, JSON.stringify(items)],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return;
  }

  const db = await getSqlite();
  const upsert = db.prepare(`
    INSERT INTO inventory_items
      (id, user_id, name, brand, type, color, sku, color_hex, status,
       buy_more, spools, refills, open_spool_weight, min_stock, favorite,
       note, updated_at, locations_json, stock_by_location_json)
    VALUES
      (@id, @user_id, @name, @brand, @type, @color, @sku, @color_hex, @status,
       @buy_more, @spools, @refills, @open_spool_weight, @min_stock, @favorite,
       @note, @updated_at, @locations_json, @stock_by_location_json)
    ON CONFLICT(id, user_id) DO UPDATE SET
      name                  = excluded.name,
      brand                 = excluded.brand,
      type                  = excluded.type,
      color                 = excluded.color,
      sku                   = excluded.sku,
      color_hex             = excluded.color_hex,
      status                = excluded.status,
      buy_more              = excluded.buy_more,
      spools                = excluded.spools,
      refills               = excluded.refills,
      open_spool_weight     = excluded.open_spool_weight,
      min_stock             = excluded.min_stock,
      favorite              = excluded.favorite,
      note                  = excluded.note,
      updated_at            = excluded.updated_at,
      locations_json        = excluded.locations_json,
      stock_by_location_json = excluded.stock_by_location_json
  `);

  const deleteStale = db.prepare(`
    DELETE FROM inventory_items
    WHERE user_id = ? AND id NOT IN (SELECT value FROM json_each(?))
  `);

  const sync = db.transaction((uid: number, incoming: Item[]) => {
    for (const item of incoming) {
      upsert.run(itemToParams(item, uid));
    }
    const ids = JSON.stringify(incoming.map((i) => i.id));
    deleteStale.run(uid, ids);
  });

  sync(userId, items);

  db.prepare(`
    INSERT INTO inventory_states (user_id, data_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      data_json  = excluded.data_json,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, JSON.stringify(items));
}
