import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/auth";
import {
  affiliateProductListAll,
  affiliateProductCreate,
  type AffiliateProductInput,
} from "@/lib/repos/affiliate-products";

function adminAuthResponse(err: AdminAuthError) {
  return NextResponse.json({ error: err.message }, { status: err.status });
}

/**
 * GET /api/admin/products
 * Returns all products (active and inactive) for the admin list view.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AdminAuthError) return adminAuthResponse(err);
    throw err;
  }

  const rows = await affiliateProductListAll();
  return NextResponse.json({ products: rows });
}

/**
 * POST /api/admin/products
 * Creates a new affiliate product. Returns { id } on success.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AdminAuthError) return adminAuthResponse(err);
    throw err;
  }

  let body: Partial<AffiliateProductInput>;
  try {
    body = (await request.json()) as Partial<AffiliateProductInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  const amazon_url = body.amazon_url?.trim() ?? "";
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!amazon_url) return NextResponse.json({ error: "amazon_url is required" }, { status: 400 });

  const data: AffiliateProductInput = {
    title,
    description:    body.description?.trim()    ?? "",
    image_url:      body.image_url?.trim()      ?? "",
    amazon_url,
    asin:           body.asin?.trim()           ?? "",
    category:       body.category?.trim()       ?? "essential",
    brand:          body.brand?.trim()          ?? "",
    material_type:  body.material_type?.trim()  ?? "",
    highlights:     body.highlights?.trim()     ?? "",
    price_range:    body.price_range?.trim()    ?? "",
    original_price: body.original_price?.trim() ?? "",
    is_active:      body.is_active === 0 ? 0 : 1,
    is_deal:        body.is_deal === 1 ? 1 : 0,
    sort_order:     typeof body.sort_order === "number" ? body.sort_order : 0,
  };

  const id = await affiliateProductCreate(data);
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
