import { NextRequest, NextResponse } from "next/server";
import { readAuthFromCookie } from "@/lib/auth";
import { workshopRecordClick } from "@/lib/repos/workshop";

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

  await workshopRecordClick({
    userId,
    productId,
    asin,
    category,
    relevant: Boolean(body.relevant),
    sourcePage,
  });

  return NextResponse.json({ ok: true });
}
