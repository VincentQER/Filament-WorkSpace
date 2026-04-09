/**
 * Pulls SUNLU filament variant Color + SKU from the official Shopify store (products.json).
 * Source: https://store.sunlu.com/products.json
 *
 * Run: node scripts/sync-sunlu-from-shopify.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const BASE = "https://store.sunlu.com";

const COMMON_HEX = {
  black: "#1A1A1A",
  white: "#F5F5F5",
  grey: "#6B6B6B",
  gray: "#6B6B6B",
  red: "#C62828",
  blue: "#1565C0",
  green: "#2E7D32",
  yellow: "#F9A825",
  orange: "#EF6C00",
  purple: "#6A1B9A",
  pink: "#EC407A",
  gold: "#FFC107",
  silver: "#B0BEC5",
  transparent: "#ECEFF1",
  clear: "#E8EAF0",
  brown: "#5D4037",
  beige: "#D7CCC8",
  cream: "#FFF8E1",
  mint: "#69F0AE",
  coral: "#FF7043",
  lavender: "#B39DDB",
  olive: "#827717",
  navy: "#0D1B4C",
  sky: "#4FC3F7",
  lemon: "#FFF176",
  cherry: "#D32F2F",
  wood: "#8D6E63",
  marble: "#9E9E9E",
  rainbow: "#AB47BC",
  glow: "#C5E1A5",
  "klein blue": "#002FA7",
  "bone white": "#F5F2EA",
  "roasted chestnut": "#6D4C41",
  mocha: "#795548",
  "jelly green": "#00E676",
  "coral pink": "#F48FB1",
  "mocha mousse": "#6D4C41",
  "olive green": "#827717",
  "sunny orange": "#FF9800",
  "vivid yellow": "#FFEB3B",
  "clay": "#A1887F",
  "sakura": "#F8BBD9",
  "macaron": "#E1BEE7",
  "oreo": "#424242",
  "brick red": "#B71C1C",
  "forest green": "#1B5E20",
  "chestnut": "#6D4C41",
  "shadow": "#37474F",
  "ashen": "#78909C",
  "chocolate": "#4E342E",
  "future green": "#00C853",
  "anti-string": "#525252",
};

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  for (;;) {
    const url = `${BASE}/products.json?limit=250&page=${page}`;
    const r = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
    const j = await r.json();
    const products = j.products || [];
    if (products.length === 0) break;
    all.push(...products);
    if (products.length < 250) break;
    page += 1;
  }
  return all;
}

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function optionByName(options, re) {
  return (options || []).find((o) => re.test(o.name));
}

function variantOption(v, opt) {
  if (!opt) return null;
  const p = opt.position;
  return p === 1 ? v.option1 : p === 2 ? v.option2 : p === 3 ? v.option3 : null;
}

function shipmentPreference(opt1) {
  const s = String(opt1 || "");
  if (/usa|united states/i.test(s)) return 0;
  if (/europe|eu\b/i.test(s)) return 1;
  if (/canada/i.test(s)) return 2;
  if (/australia/i.test(s)) return 3;
  return 9;
}

function inferMaterialLine(p) {
  const t = `${p.title} ${p.handle || ""} ${p.product_type || ""}`.toLowerCase();
  if (/anti-string|\bapla\b/i.test(t)) return "Anti-string PLA";
  if (/high speed.*pla|hs\s*pla/i.test(t)) return "High Speed PLA";
  if (/pla\s*meta|meta.*pla/i.test(t)) return "PLA Meta";
  if (/pla\+2|pla\s*plus\s*2|pla\+ 2/i.test(t)) return "PLA+2.0";
  if (/silk/i.test(t) && /pla/i.test(t)) return "Silk PLA";
  if (/matte/i.test(t) && /pla/i.test(t)) return "PLA Matte";
  if (/wood/i.test(t) && /pla/i.test(t)) return "Wood PLA";
  if (/marble/i.test(t) && /pla/i.test(t)) return "Marble PLA";
  if (/rainbow/i.test(t) && /pla/i.test(t)) return "Rainbow PLA";
  if (/glow/i.test(t) && /pla/i.test(t)) return "Glow PLA";
  if (/pla\+|pla plus/i.test(t)) return "PLA+";
  if (/\bpetg\b/i.test(t) && /matte|high speed/i.test(t)) return "PETG HS Matte";
  if (/\bpetg\b/i.test(t)) return "PETG";
  if (/\babs\b/i.test(t)) return "ABS";
  if (/\btpu\b/i.test(t)) return "TPU";
  if (/\basa\b/i.test(t)) return "ASA";
  if (/\bpla\b/i.test(t) && !/petg|abs|tpu|resin|pack/i.test(t)) return "PLA";
  return null;
}

function typeOptionMaterial(typeVal) {
  if (!typeVal) return null;
  const s = String(typeVal).trim();
  const map = {
    PLA: "PLA",
    "PLA+": "PLA+",
    "PLA+2.0": "PLA+2.0",
    "PLA Matte": "PLA Matte",
    "PLA Meta": "PLA Meta",
    "Silk PLA+": "Silk PLA",
    "Silk PLA": "Silk PLA",
    PETG: "PETG",
    ABS: "ABS",
    TPU: "TPU",
    ASA: "ASA",
  };
  if (map[s]) return map[s];
  if (/high speed matte petg/i.test(s)) return "PETG HS Matte";
  return s;
}

function cleanColorName(raw) {
  let s = String(raw).trim();
  s = s.replace(/\s*\d+(\.\d+)?\s*kg\s*spool/gi, "").trim();
  return s;
}

function isPlaFamilyProduct(p) {
  const t = `${p.title} ${p.handle || ""} ${p.product_type || ""}`.toLowerCase();
  if (/resin|water washable|photopolymer/i.test(t)) return false;
  if (!/filament|spool|1\.75|3d printer|printer filament/i.test(t)) return false;
  if (!/\bpla\b|pla\+|pla meta|silk pla|pla matte|wood pla|marble|rainbow|petg|abs|tpu|asa|anti-string|apla|high speed/i.test(t))
    return false;
  return true;
}

function isBadColorName(c) {
  const s = c.toLowerCase();
  if (s.includes("+")) return true;
  if (/\d+\s*\*\s*\d+\s*rolls?/i.test(s)) return true;
  if (/total\s*\d|filament packs?|fdm filament packs/i.test(s)) return true;
  if (s.length > 55) return true;
  return false;
}

function hexFromName(name) {
  const n = norm(name);
  for (const [word, hx] of Object.entries(COMMON_HEX)) {
    if (n.includes(word)) return hx;
  }
  let h = 2166136261;
  for (let i = 0; i < n.length; i++) {
    h ^= n.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hue = (h >>> 0) % 360;
  const s = 42 + ((h >>> 8) % 25);
  const l = 38 + ((h >>> 16) % 20);
  const a = (s * Math.min(l / 100, 1 - l / 100)) / 100;
  const q = l / 100 < 0.5 ? l / 100 + a : l / 100 - a;
  const p = 2 * (l / 100) - q;
  const hk = hue / 360;
  const tR = hk + 1 / 3;
  const tG = hk;
  const tB = hk - 1 / 3;
  const R = Math.round(255 * hue2rgb(p, q, tR));
  const G = Math.round(255 * hue2rgb(p, q, tG));
  const B = Math.round(255 * hue2rgb(p, q, tB));
  return `#${R.toString(16).padStart(2, "0")}${G.toString(16).padStart(2, "0")}${B.toString(16).padStart(2, "0")}`.toUpperCase();
}

function hue2rgb(p, q, t) {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function collectRows(products) {
  const typeOptRe = /^type$/i;
  const colorOptRe = /^color$/i;
  const shipOptRe = /^shipment$/i;

  /** @type {Map<string, { material: string, name: string, sku: string, shipRank: number }>} */
  const best = new Map();

  for (const p of products) {
    if (!isPlaFamilyProduct(p)) continue;
    const colorOpt = optionByName(p.options, colorOptRe);
    if (!colorOpt) continue;
    const typeOpt = optionByName(p.options, typeOptRe);
    const shipOpt = optionByName(p.options, shipOptRe);

    for (const v of p.variants || []) {
      const colorRaw = variantOption(v, colorOpt);
      if (!colorRaw) continue;
      const color = cleanColorName(colorRaw);
      if (!color || isBadColorName(color)) continue;

      let material = typeOpt ? typeOptionMaterial(variantOption(v, typeOpt)) : null;
      if (!material) material = inferMaterialLine(p);
      if (!material) continue;

      const sku = String(v.sku || "").trim();
      const shipRank = shipOpt ? shipmentPreference(variantOption(v, shipOpt)) : 0;
      const key = `${norm(material)}|||${norm(color)}`;
      const prev = best.get(key);
      if (!prev || shipRank < prev.shipRank || (shipRank === prev.shipRank && sku && !prev.sku)) {
        best.set(key, { material, name: color, sku, shipRank });
      }
    }
  }
  return [...best.values()].map(({ material, name, sku }) => ({ material, name, sku }));
}

async function main() {
  console.log("Fetching", BASE, "products.json …");
  const products = await fetchAllProducts();
  console.log("Products:", products.length);
  const rows = collectRows(products);
  const out = rows
    .map((r) => ({
      material: r.material,
      name: r.name,
      hex: hexFromName(r.name),
      sku: r.sku || undefined,
      source: "store.sunlu.com products.json",
    }))
    .sort((a, b) => a.material.localeCompare(b.material) || a.name.localeCompare(b.name));

  const dest = path.join(root, "data", "sunlu-colors.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
  const byM = {};
  for (const r of out) {
    byM[r.material] = (byM[r.material] || 0) + 1;
  }
  console.log("Wrote", out.length, "rows to data/sunlu-colors.json");
  console.log("By material:", JSON.stringify(byM, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
