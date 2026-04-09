import { NextResponse } from "next/server";
import { readAuthFromCookie } from "@/lib/auth";
import type { Item } from "@/lib/inventory-item";
import { inventoryListForUser, inventoryReplaceAllForUser, type ItemRow } from "@/lib/repos/inventory";

function rowToItem(row: ItemRow): Item {
  let locations: string[] = ["Default"];
  let stockByLocation: Item["stockByLocation"] = [];
  try {
    locations = JSON.parse(row.locations_json);
  } catch {
    /* keep default */
  }
  try {
    stockByLocation = JSON.parse(row.stock_by_location_json);
  } catch {
    /* keep default */
  }

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    type: row.type,
    color: row.color,
    sku: row.sku,
    colorHex: row.color_hex ?? undefined,
    location: locations[0] ?? "Default",
    locations,
    stockByLocation,
    status: (row.status as Item["status"]) ?? "owned",
    buyMore: row.buy_more === 1,
    spools: row.spools,
    refills: row.refills,
    openSpoolWeight: row.open_spool_weight,
    minStock: row.min_stock,
    favorite: row.favorite === 1,
    note: row.note,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const auth = await readAuthFromCookie();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await inventoryListForUser(auth.userId);
  return NextResponse.json({ items: rows.map(rowToItem) });
}

export async function PUT(request: Request) {
  const auth = await readAuthFromCookie();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { items?: unknown };
  if (!Array.isArray(body.items))
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const items = body.items as Item[];

  await inventoryReplaceAllForUser(auth.userId, items);

  return NextResponse.json({ ok: true });
}
