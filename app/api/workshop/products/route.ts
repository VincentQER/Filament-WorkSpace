import { NextResponse } from "next/server";
import { affiliateProductListActive } from "@/lib/repos/affiliate-products";

/**
 * GET /api/workshop/products
 *
 * Public endpoint — no auth required.
 * Returns active affiliate products from the database, sorted by sort_order.
 * Returns an empty array (not an error) when the table is empty, so the
 * Workshop page can fall back to the hardcoded data/workshop-products.ts list.
 */
export async function GET() {
  try {
    const rows = await affiliateProductListActive();
    return NextResponse.json({ products: rows, source: "db" });
  } catch (err) {
    // During initial deploy the table may not exist yet (migrations pending).
    // Return empty so the client falls back to the hardcoded list gracefully.
    console.error("[/api/workshop/products] DB error, falling back to empty:", err);
    return NextResponse.json({ products: [], source: "fallback" });
  }
}
