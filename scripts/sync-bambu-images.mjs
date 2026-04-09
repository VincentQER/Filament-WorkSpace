/**
 * Populates `previewUrl` in bambu-colors.json with official Bambu Lab
 * product image URLs scraped from the Bambu Lab Shopify store HTML pages.
 *
 * Why HTML and not /products/handle.json?
 *   Bambu Lab has disabled the Shopify storefront REST JSON endpoints
 *   (they return 404), but the HTML product pages are public and embed the
 *   full product JSON inside a <script id="product-json"> tag.
 *
 * Run from your local machine (needs internet access):
 *   node scripts/sync-bambu-images.mjs
 */

import fs   from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.join(__dirname, "..");
const dataFile  = path.join(root, "data", "bambu-colors.json");
const STORE     = "https://us.store.bambulab.com";

const MATERIAL_HANDLES = {
  "PLA Basic":  "pla-basic-filament",
  "PLA Matte":  "pla-matte",
  "ABS":        "abs-filament",
  "PETG Basic": "petg-basic",
  "PETG CF":    "petg-cf",
  "PLA CF":     "pla-cf",
  "TPU 85A":    "tpu-85a-tpu-90a",
  "TPU 90A":    "tpu-85a-tpu-90a",
};

function normalize(s) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildColorMap(product) {
  const imgById = new Map();
  for (const img of product.images ?? []) {
    imgById.set(img.id, img.src.replace(/\?.*$/, ""));
  }
  const map = new Map();
  for (const v of product.variants ?? []) {
    const key = normalize(v.title);
    const src =
      v.featured_image?.src?.replace(/\?.*$/, "") ??
      (v.image_id ? imgById.get(v.image_id) : null);
    if (src && !map.has(key)) map.set(key, src);
  }
  return map;
}

async function fetchColorMap(handle) {
  const url = `${STORE}/products/${handle}`;
  console.log(`  Fetching ${url} …`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    console.warn(`  ⚠️  HTTP ${res.status}`);
    return new Map();
  }

  const html = await res.text();

  // Strategy 1 — embedded <script id="product-json">
  const m1 = html.match(/<script[^>]+id=["']product-json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (m1?.[1]) {
    try {
      return buildColorMap(JSON.parse(m1[1]));
    } catch { /* fall through */ }
  }

  // Strategy 2 — var meta = { product: {...} }
  const m2 = html.match(/var\s+meta\s*=\s*(\{[\s\S]*?"product"[\s\S]*?\})\s*;/);
  if (m2?.[1]) {
    try {
      const meta = JSON.parse(m2[1]);
      if (meta.product) return buildColorMap(meta.product);
    } catch { /* fall through */ }
  }

  // Strategy 3 — collect any /cdn/shop/products image URLs
  const imgs = [...html.matchAll(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*/gi)]
    .map((m) => m[0].replace(/\?.*$/, ""))
    .filter((u) => u.includes("/products/") || u.includes("/cdn/shop/"));
  if (imgs.length) {
    console.log(`  ℹ️  No variant JSON found — collected ${imgs.length} generic image(s)`);
    return new Map([["__default__", imgs[0]]]);
  }

  console.warn("  ❌  No usable product data found in HTML");
  return new Map();
}

function bestMatch(map, colorKey) {
  if (map.has(colorKey)) return map.get(colorKey);
  for (const [k, v] of map) {
    if (k === "__default__") continue;
    if (k.includes(colorKey) || colorKey.includes(k)) return v;
  }
  const words = colorKey.split(" ").filter((w) => w.length > 2);
  for (const [k, v] of map) {
    if (k === "__default__") continue;
    if (words.some((w) => k.includes(w))) return v;
  }
  return map.get("__default__") ?? null;
}

async function main() {
  const colors = JSON.parse(fs.readFileSync(dataFile, "utf8"));

  // Group colors by material so we fetch each product page once
  const byMaterial = {};
  for (const entry of colors) {
    (byMaterial[entry.material] ??= []).push(entry);
  }

  let updated = 0;
  let failed  = 0;
  const handleCache = new Map();

  for (const [material, entries] of Object.entries(byMaterial)) {
    const handle = MATERIAL_HANDLES[material];
    if (!handle) {
      console.log(`\n⚠️  No handle for material "${material}" — skipping`);
      failed += entries.length;
      continue;
    }

    console.log(`\n📦  ${material}`);

    if (!handleCache.has(handle)) {
      handleCache.set(handle, await fetchColorMap(handle));
    }
    const colorMap = handleCache.get(handle);

    for (const entry of entries) {
      const url = bestMatch(colorMap, normalize(entry.name));
      if (url) {
        entry.previewUrl = url;
        updated++;
        console.log(`  ✅  ${entry.name.padEnd(28)} ${url.slice(0, 72)}`);
      } else {
        delete entry.previewUrl;
        failed++;
        console.log(`  ❌  ${entry.name}`);
      }
    }
  }

  fs.writeFileSync(dataFile, Buffer.from(JSON.stringify(colors, null, 2) + "\n", "utf8"));
  console.log(`\n✨  Done — ${updated} updated, ${failed} not found.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
