/**
 * Rebuilds data/search-catalog.json from:
 * - data/bambu-colors.json (official Bambu material line names)
 * - data/curated-brand-materials.json (seed lines for popular third-party brands)
 * - data/static-filament-brands.json (search autocomplete list)
 * - SQLite: workspace_brands_json + inventory_states (all users)
 *
 * Run from repo root: npm run sync:catalog
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function normKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

function uniqPreserveOrder(items) {
  const seen = new Set();
  const out = [];
  for (const x of items) {
    const k = normKey(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(String(x).trim());
  }
  return out;
}

const BAMBU_BRAND_KEY = normKey("Bambu Lab");

const bambuColors = readJson("data/bambu-colors.json");
const bambuMaterialLines = uniqPreserveOrder(bambuColors.map((e) => e.material));

const staticBrands = readJson("data/static-filament-brands.json");
const curatedRaw = readJson("data/curated-brand-materials.json");
/** @type {Record<string, string[]>} */
const curated = {};
for (const [k, v] of Object.entries(curatedRaw)) {
  if (!Array.isArray(v)) continue;
  curated[normKey(k)] = v.map((x) => String(x).trim()).filter(Boolean);
}

const dbPath = path.join(root, "data", "app.db");
const brandNames = new Set(staticBrands.map((b) => String(b).trim()).filter(Boolean));
brandNames.add("Bambu Lab");

/** @type {Map<string, Set<string>>} */
const fromDb = new Map();

function addMaterial(brandKey, mat) {
  const t = String(mat || "").trim();
  if (!t) return;
  if (!fromDb.has(brandKey)) fromDb.set(brandKey, new Set());
  fromDb.get(brandKey).add(t);
}

if (fs.existsSync(dbPath)) {
  const db = new Database(dbPath, { readonly: true });
  try {
    const users = db.prepare("SELECT workspace_brands_json FROM users").all();
    for (const row of users) {
      try {
        const arr = JSON.parse(row.workspace_brands_json || "[]");
        if (Array.isArray(arr)) {
          for (const b of arr) {
            const name = String(b || "").trim();
            if (name) brandNames.add(name);
          }
        }
      } catch {
        /* skip */
      }
    }

    const invRows = db.prepare("SELECT data_json FROM inventory_states").all();
    for (const row of invRows) {
      let items = [];
      try {
        items = JSON.parse(row.data_json || "[]");
      } catch {
        continue;
      }
      if (!Array.isArray(items)) continue;
      for (const raw of items) {
        const brand = raw?.brand;
        const type = raw?.type;
        if (!brand || !type) continue;
        const bk = normKey(brand);
        brandNames.add(String(brand).trim());
        if (bk === BAMBU_BRAND_KEY) continue;
        addMaterial(bk, type);
      }
    }
  } finally {
    db.close();
  }
}

/** @type {Record<string, string[]>} */
const brandMaterials = {};

function mergeMaterials(brandKey) {
  const curatedList = curated[brandKey] || [];
  const dbSet = fromDb.get(brandKey);
  const fromDbList = dbSet ? [...dbSet].sort((a, b) => a.localeCompare(b)) : [];
  return uniqPreserveOrder([...curatedList, ...fromDbList]);
}

const allBrandKeys = new Set([...Object.keys(curated), ...fromDb.keys()]);
for (const bk of allBrandKeys) {
  if (bk === BAMBU_BRAND_KEY) continue;
  const merged = mergeMaterials(bk);
  if (merged.length) brandMaterials[bk] = merged;
}

const brandNamesForSearch = [...brandNames].sort((a, b) => a.localeCompare(b));

const out = {
  generatedAt: new Date().toISOString(),
  bambuMaterialLines,
  brandNamesForSearch,
  brandMaterials,
};

fs.writeFileSync(path.join(root, "data", "search-catalog.json"), JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(
  `Wrote data/search-catalog.json (${brandNamesForSearch.length} brands, ${Object.keys(brandMaterials).length} third-party material maps, ${bambuMaterialLines.length} Bambu lines)`,
);
