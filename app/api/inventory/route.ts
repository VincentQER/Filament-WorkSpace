import { NextResponse } from "next/server";
import db from "@/lib/db";
import { readAuthFromCookie } from "@/lib/auth";
import type { Item } from "@/lib/inventory-item";

// ─── DB row → Item ────────────────────────────────────────────────────────────
type ItemRow = {
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

function rowToItem(row: ItemRow): Item {
  let locations: string[] = ["Default"];
  let stockByLocation: Item["stockByLocation"] = [];
  try { locations = JSON.parse(row.locations_json); } catch { /* keep default */ }
  try { stockByLocation = JSON.parse(row.stock_by_location_json); } catch { /* keep default */ }

  return {
    id:               row.id,
    name:             row.name,
    brand:            row.brand,
    type:             row.type,
    color:            row.color,
    sku:              row.sku,
    colorHex:         row.color_hex ?? undefined,
    location:         locations[0] ?? "Default",
    locations,
    stockByLocation,
    status:           (row.status as Item["status"]) ?? "owned",
    buyMore:          row.buy_more === 1,
    spools:           row.spools,
    refills:          row.refills,
    openSpoolWeight:  row.open_spool_weight,
    minStock:         row.min_stock,
    favorite:         row.favorite === 1,
    note:             row.note,
    updatedAt:        row.updated_at,
  };
}

// ─── Item → DB row params ─────────────────────────────────────────────────────
function itemToParams(item: Item, userId: number) {
  return {
    id:                    item.id,
    user_id:               userId,
    name:                  item.name ?? "",
    brand:                 item.brand ?? "",
    type:                  item.type ?? "",
    color:                 item.color ?? "",
    sku:                   item.sku ?? "",
    color_hex:             item.colorHex ?? null,
    status:                item.status ?? "owned",
    buy_more:              item.buyMore ? 1 : 0,
    spools:                Math.max(0, Math.floor(Number(item.spools) || 0)),
    refills:               Math.max(0, Math.floor(Number(item.refills) || 0)),
    open_spool_weight:     Math.max(0, Math.floor(Number(item.openSpoolWeight) || 0)),
    min_stock:             Math.max(0, Math.floor(Number(item.minStock) || 0)),
    favorite:              item.favorite ? 1 : 0,
    note:                  item.note ?? "",
    updated_at:            typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
    locations_json:        JSON.stringify(item.locations ?? ["Default"]),
    stock_by_location_json: JSON.stringify(item.stockByLocation ?? []),
  };
}

// ─── GET /api/inventory ───────────────────────────────────────────────────────
export async function GET() {
  const auth = await readAuthFromCookie();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = db
    .prepare("SELECT * FROM inventory_items WHERE user_id = ? ORDER BY updated_at DESC")
    .all(auth.userId) as ItemRow[];

  return NextResponse.json({ items: rows.map(rowToItem) });
}

// ─── PUT /api/inventory ───────────────────────────────────────────────────────
// The client sends the full items array on every save (debounced 500 ms).
// We replace the user's inventory atomically in a transaction.
export async function PUT(request: Request) {
  const auth = await readAuthFromCookie();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { items?: unknown };
  if (!Array.isArray(body.items))
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const items = body.items as Item[];

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

  const sync = db.transaction((userId: number, incoming: Item[]) => {
    // Upsert every incoming item
    for (const item of incoming) {
      upsert.run(itemToParams(item, userId));
    }
    // Remove rows that are no longer in the client state
    const ids = JSON.stringify(incoming.map((i) => i.id));
    deleteStale.run(userId, ids);
  });

  sync(auth.userId, items);

  // Keep inventory_states in sync as a backup blob (cheap, keeps old readers working)
  db.prepare(`
    INSERT INTO inventory_states (user_id, data_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      data_json  = excluded.data_json,
      updated_at = CURRENT_TIMESTAMP
  `).run(auth.userId, JSON.stringify(items));

  return NextResponse.json({ ok: true });
}
