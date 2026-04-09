/**
 * GET /api/bambu-image?material=PLA+Basic&color=Jade+White
 *
 * Strategy: Shopify stores embed full product JSON inside the HTML page in a
 * <script id="product-json" type="application/json"> tag — even when the
 * /products/handle.json REST endpoint is disabled (returns 404).
 *
 * We fetch the HTML product page, extract that embedded JSON, build a
 * color-name → image-URL map, and return the best match.
 * Results are cached in memory for the process lifetime.
 */
import { NextRequest, NextResponse } from "next/server";

const STORE = "https://us.store.bambulab.com";

const MATERIAL_HANDLES: Record<string, string> = {
  "PLA Basic":  "pla-basic-filament",
  "PLA Matte":  "pla-matte",
  "ABS":        "abs-filament",
  "PETG Basic": "petg-basic",
  "PETG CF":    "petg-cf",
  "PLA CF":     "pla-cf",
  "TPU 85A":    "tpu-85a-tpu-90a",   // Bambu sells 85A & 90A on one page
  "TPU 90A":    "tpu-85a-tpu-90a",
};

// ── caches ──────────────────────────────────────────────────────────────────
const perColorCache   = new Map<string, string | null>();   // "mat|color" → url
const perProductCache = new Map<string, Map<string, string>>(); // handle → colorMap

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// ── Shopify product JSON types (minimal) ────────────────────────────────────
interface ShopifyImage    { id: number; src: string }
interface ShopifyVariant  { title: string; image_id: number | null; featured_image?: { src: string } | null }
interface ShopifyProduct  { images: ShopifyImage[]; variants: ShopifyVariant[] }

function buildColorMap(product: ShopifyProduct): Map<string, string> {
  const imgById = new Map<number, string>();
  for (const img of product.images ?? []) {
    imgById.set(img.id, img.src.replace(/\?.*$/, ""));
  }
  const map = new Map<string, string>();
  for (const v of product.variants ?? []) {
    const key = normalize(v.title);
    // Prefer the variant's own featured_image, fall back to image_id lookup
    const src =
      v.featured_image?.src?.replace(/\?.*$/, "") ??
      (v.image_id ? imgById.get(v.image_id) : undefined);
    if (src && !map.has(key)) map.set(key, src);
  }
  return map;
}

async function fetchColorMap(handle: string): Promise<Map<string, string> | null> {
  if (perProductCache.has(handle)) return perProductCache.get(handle)!;

  const url = `${STORE}/products/${handle}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      perProductCache.set(handle, new Map());
      return null;
    }

    const html = await res.text();

    // ── Strategy 1: <script id="product-json" type="application/json"> ──────
    const jsonTagMatch = html.match(
      /<script[^>]+id=["']product-json["'][^>]*>([\s\S]*?)<\/script>/i,
    );
    if (jsonTagMatch?.[1]) {
      try {
        const product = JSON.parse(jsonTagMatch[1]) as ShopifyProduct;
        const map = buildColorMap(product);
        perProductCache.set(handle, map);
        return map;
      } catch { /* fall through */ }
    }

    // ── Strategy 2: window.__INITIAL_STATE__ or similar embedded JSON ────────
    const variantMatch = html.match(
      /var\s+meta\s*=\s*(\{[\s\S]*?"product"[\s\S]*?\})\s*;/,
    );
    if (variantMatch?.[1]) {
      try {
        const meta = JSON.parse(variantMatch[1]) as { product?: ShopifyProduct };
        if (meta.product) {
          const map = buildColorMap(meta.product);
          perProductCache.set(handle, map);
          return map;
        }
      } catch { /* fall through */ }
    }

    // ── Strategy 3: extract image URLs from og:image / product thumbnails ───
    // Collect all unique product image URLs from the HTML as a last resort
    const imgUrls = [
      ...html.matchAll(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*/gi),
    ]
      .map((m) => m[0].replace(/\?.*$/, ""))
      .filter((u) => u.includes("/products/") || u.includes("/cdn/shop/"));

    if (imgUrls.length > 0) {
      // Can't match by color name, store as "default" for fallback
      const map = new Map<string, string>([["__default__", imgUrls[0]!]]);
      perProductCache.set(handle, map);
      return map;
    }

    perProductCache.set(handle, new Map());
    return null;
  } catch {
    return null;
  }
}

function bestMatch(map: Map<string, string>, colorKey: string): string | null {
  if (map.has(colorKey)) return map.get(colorKey)!;
  // Partial match
  for (const [k, v] of map) {
    if (k === "__default__") continue;
    if (k.includes(colorKey) || colorKey.includes(k)) return v;
  }
  // Word-overlap match
  const words = colorKey.split(" ").filter((w) => w.length > 2);
  for (const [k, v] of map) {
    if (k === "__default__") continue;
    if (words.some((w) => k.includes(w))) return v;
  }
  // Last resort: return the default image if we have one
  return map.get("__default__") ?? null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const material = searchParams.get("material")?.trim() ?? "";
  const color    = searchParams.get("color")?.trim()    ?? "";

  if (!material || !color) {
    return NextResponse.json({ error: "material and color are required" }, { status: 400 });
  }

  const cacheKey = `${material}|${color}`;
  if (perColorCache.has(cacheKey)) {
    return NextResponse.json(
      { url: perColorCache.get(cacheKey) ?? null },
      { headers: { "X-Cache": "HIT" } },
    );
  }

  const handle = MATERIAL_HANDLES[material];
  if (!handle) {
    perColorCache.set(cacheKey, null);
    return NextResponse.json({ url: null, reason: "unknown material" });
  }

  const colorMap = await fetchColorMap(handle);
  const url = colorMap ? bestMatch(colorMap, normalize(color)) : null;
  perColorCache.set(cacheKey, url);

  return NextResponse.json({ url }, { headers: { "X-Cache": "MISS" } });
}
