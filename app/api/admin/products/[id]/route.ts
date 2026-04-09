import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/auth";
import {
  affiliateProductGetById,
  affiliateProductUpdate,
  affiliateProductSetActive,
  affiliateProductDelete,
  type AffiliateProductInput,
} from "@/lib/repos/affiliate-products";

type RouteContext = { params: Promise<{ id: string }> };

function adminAuthResponse(err: AdminAuthError) {
  return NextResponse.json({ error: err.message }, { status: err.status });
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * GET /api/admin/products/[id]
 * Returns a single product for the edit form.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AdminAuthError) return adminAuthResponse(err);
    throw err;
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const product = await affiliateProductGetById(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

/**
 * PATCH /api/admin/products/[id]
 * Accepts either a full update payload, or { is_active: 0|1 } for toggle-only.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AdminAuthError) return adminAuthResponse(err);
    throw err;
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const existing = await affiliateProductGetById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Partial<AffiliateProductInput>;
  try {
    body = (await request.json()) as Partial<AffiliateProductInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Toggle-only path (just is_active sent from the list page activate button)
  const onlyToggle =
    Object.keys(body).length === 1 && "is_active" in body;

  if (onlyToggle) {
    await affiliateProductSetActive(id, body.is_active !== 0);
    return NextResponse.json({ ok: true });
  }

  // Full update path — merge with existing values so partial payloads work too
  const data: AffiliateProductInput = {
    title:         body.title?.trim()         ?? existing.title,
    description:   body.description?.trim()   ?? existing.description,
    image_url:     body.image_url?.trim()     ?? existing.image_url,
    amazon_url:    body.amazon_url?.trim()    ?? existing.amazon_url,
    asin:          body.asin?.trim()          ?? existing.asin,
    category:      body.category?.trim()      ?? existing.category,
    brand:         body.brand?.trim()         ?? existing.brand,
    material_type: body.material_type?.trim() ?? existing.material_type,
    highlights:    body.highlights?.trim()    ?? existing.highlights,
    price_range:   body.price_range?.trim()   ?? existing.price_range,
    is_active:     body.is_active === 0 ? 0 : (body.is_active === 1 ? 1 : existing.is_active),
    sort_order:    typeof body.sort_order === "number" ? body.sort_order : existing.sort_order,
  };

  if (!data.title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!data.amazon_url) return NextResponse.json({ error: "amazon_url is required" }, { status: 400 });

  await affiliateProductUpdate(id, data);
  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/admin/products/[id]
 * Permanently deletes a product.
 */
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AdminAuthError) return adminAuthResponse(err);
    throw err;
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const existing = await affiliateProductGetById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await affiliateProductDelete(id);
  return NextResponse.json({ ok: true });
}
