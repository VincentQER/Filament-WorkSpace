import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { readAuthFromCookie } from "@/lib/auth";

type ClickPayload = {
  productId?: string;
  asin?: string;
  category?: string;
  relevant?: boolean;
  sourcePage?: string;
};

export async function POST(req: NextRequest) {
  let body: ClickPayload;
  try {
    body = (await req.json()) as ClickPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const productId = body.productId?.trim() ?? "";
  const asin = body.asin?.trim() ?? "";
  const category = body.category?.trim() ?? "";
  const sourcePage = body.sourcePage?.trim() || "/my-inventory/workshop";

  if (!productId || !asin || !category) {
    return NextResponse.json(
      { error: "productId, asin, and category are required." },
      { status: 400 },
    );
  }

  const auth = await readAuthFromCookie();
  const userId = auth?.userId ?? null;

  db.prepare(`
    INSERT INTO workshop_click_events
      (user_id, product_id, asin, category, relevant, source_page)
    VALUES
      (?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    productId,
    asin,
    category,
    body.relevant ? 1 : 0,
    sourcePage,
  );

  return NextResponse.json({ ok: true });
}
