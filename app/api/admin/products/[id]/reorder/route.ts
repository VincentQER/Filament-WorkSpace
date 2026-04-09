import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/auth";
import { affiliateProductReorder } from "@/lib/repos/affiliate-products";

type RouteContext = { params: Promise<{ id: string }> };

function adminAuthResponse(err: AdminAuthError) {
  return NextResponse.json({ error: err.message }, { status: err.status });
}

/**
 * PATCH /api/admin/products/[id]/reorder
 * Body: { direction: "up" | "down" }
 * Swaps sort_order with the nearest neighbour.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AdminAuthError) return adminAuthResponse(err);
    throw err;
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: { direction?: string };
  try {
    body = (await request.json()) as { direction?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const direction = body.direction;
  if (direction !== "up" && direction !== "down") {
    return NextResponse.json({ error: 'direction must be "up" or "down"' }, { status: 400 });
  }

  await affiliateProductReorder(id, direction);
  return NextResponse.json({ ok: true });
}
