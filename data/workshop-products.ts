/**
 * Workshop — curated 3D-printing product recommendations with Amazon affiliate links.
 *
 * Affiliate tag:  rollcheckspac-20
 * Image URLs:     Amazon CDN  https://m.media-amazon.com/images/I/{ID}._AC_SL400_.jpg
 *                 Use Chrome devtools → #landingImage[data-a-dynamic-image] to get the ID
 *                 for any new product, then add it to the imageId field below.
 */

export const AMAZON_TAG = "rollcheckspac-20";

// Convenience: build a full Amazon CDN image URL from the image hash Amazon uses internally.
export function amazonImageUrl(imageId: string): string {
  return `https://m.media-amazon.com/images/I/${imageId}._AC_SL400_.jpg`;
}

export type ProductTag =
  | "essential"
  | "storage"
  | "filament"
  | "tools"
  | "printers"
  | "post-processing";

export type WorkshopProduct = {
  id: string;
  name: string;
  brand: string;
  asin: string;
  /**
   * When set, this URL is used directly as the product link (overrides amazonUrl(asin)).
   * DB products always populate this from affiliate_products.amazon_url so short links
   * like amzn.to/... and full affiliate URLs work even when ASIN is empty.
   */
  directUrl?: string;
  /** Amazon CDN image ID  e.g. "41W4+oUpeNL"  →  use amazonImageUrl() to build the full URL */
  imageId?: string;
  tagline: string;
  whyItMatters: string;
  priceRange: string;
  category: ProductTag;
  relevantMaterials?: string[];
  badge?: string;
  /** True when the admin has marked this as a current sale / deal price. */
  isDeal?: boolean;
  /** Original / before-sale price shown as strikethrough next to priceRange. */
  originalPrice?: string;
};

export const WORKSHOP_CATEGORIES: { key: ProductTag; label: string; emoji: string }[] = [
  { key: "essential",       label: "Must-Have Tools",   emoji: "🔧" },
  { key: "storage",         label: "Filament Storage",  emoji: "📦" },
  { key: "filament",        label: "Popular Filaments", emoji: "🎨" },
  { key: "post-processing", label: "Post-Processing",   emoji: "✨" },
  { key: "printers",        label: "Printers",          emoji: "🖨️" },
];

export const WORKSHOP_PRODUCTS: WorkshopProduct[] = [
  // ── Must-Have Tools ───────────────────────────────────────────────────────
  {
    id: "flush-cutters",
    name: "Hakko CHP-170 Flush Cutters",
    brand: "Hakko",
    asin: "B00FZPDG1K",
    imageId: "41W4+oUpeNL",           // ✓ verified
    tagline: "The #1 tool every 3D printer owner needs",
    whyItMatters: "Clean support removal without damaging your print surface.",
    priceRange: "$8–12",
    category: "essential",
    badge: "Best Seller",
  },
  {
    id: "calipers",
    name: "Adoric Digital Caliper 0–6″",
    brand: "Adoric",
    asin: "B07DFFYCXS",
    imageId: "614gKlEGiwL",           // ✓ verified
    tagline: "Verify dimensions and filament diameter",
    whyItMatters: "Essential for calibration and quality control.",
    priceRange: "$12–18",
    category: "essential",
  },
  {
    id: "spatula-set",
    name: "Minatee 3D Printer Spatula Set (5 pcs)",
    brand: "Minatee",
    asin: "B0BP9TRZW2",
    imageId: "61f8te2GFJL",           // ✓ verified
    tagline: "Remove prints without wrecking your build plate",
    whyItMatters: "Flexible steel blades for PEI, glass, or garolite beds.",
    priceRange: "$8–14",
    category: "essential",
  },
  {
    id: "pei-sheet",
    name: "Energetic PEI Spring Steel Sheet 235×235mm",
    brand: "Energetic",
    asin: "B07R9PCYH8",
    imageId: "71V9aJJf+wL",           // standard PEI flex sheet listing
    tagline: "Magnetic flex plate — prints pop off when cooled",
    whyItMatters: "Massive adhesion upgrade over plain glass for PLA, PETG, ABS.",
    priceRange: "$18–28",
    category: "essential",
    relevantMaterials: ["PLA Basic", "PLA Matte", "PETG Basic", "ABS"],
  },

  // ── Filament Storage ──────────────────────────────────────────────────────
  {
    id: "sunlu-dryer-s4",
    name: "Sunlu S4 Filament Dryer Box (4 Spools)",
    brand: "Sunlu",
    asin: "B0CQJMV71Z",
    imageId: "71SPvo6i7XL",           // ✓ verified
    tagline: "Dry and print simultaneously — fits 4 spools",
    whyItMatters: "Moisture ruins PETG, TPU, and Nylon. This fixes it permanently.",
    priceRange: "$50–70",
    category: "storage",
    relevantMaterials: ["PETG Basic", "PETG CF", "TPU 85A", "TPU 90A"],
    badge: "Top Pick",
  },
  {
    id: "sunlu-dryer-s2",
    name: "Sunlu Filament Dryer S2 (Single Spool)",
    brand: "Sunlu",
    asin: "B09XMT9SVX",
    imageId: "81NXOP-y2tL",           // ✓ from search results
    tagline: "Compact single-spool dryer with humidity display",
    whyItMatters: "Budget-friendly option for occasional PETG or TPU printing.",
    priceRange: "$25–35",
    category: "storage",
    relevantMaterials: ["PETG Basic", "TPU 85A", "TPU 90A"],
  },
  {
    id: "dry-box",
    name: "Polymaker PolyDryer Box — Print While Dry",
    brand: "Polymaker",
    asin: "B07X96WMQJ",
    tagline: "Airtight storage with built-in hygrometer",
    whyItMatters: "Keeps filament dry between sessions with PTFE tube outlet.",
    priceRange: "$20–28",
    category: "storage",
  },
  {
    id: "desiccant",
    name: "Dry & Dry Silica Gel Packets 10×50g",
    brand: "Dry & Dry",
    asin: "B00GJBKPIQ",
    tagline: "Cheap moisture protection for any storage bin",
    whyItMatters: "Toss one in any sealed container. Rechargeable in the oven.",
    priceRange: "$10–15",
    category: "storage",
  },

  // ── Popular Filaments ─────────────────────────────────────────────────────
  {
    id: "hatchbox-pla",
    name: "Hatchbox PLA 1.75mm 1kg",
    brand: "Hatchbox",
    asin: "B00J0ECR5I",
    tagline: "The most trusted budget PLA on Amazon",
    whyItMatters: "Consistent diameter, low warp, huge color selection.",
    priceRange: "$20–25",
    category: "filament",
    relevantMaterials: ["PLA Basic", "PLA Matte"],
    badge: "Top Rated",
  },
  {
    id: "polymaker-asa",
    name: "Polymaker PolyLite ASA 1.75mm 1kg",
    brand: "Polymaker",
    asin: "B089DKRSF5",
    tagline: "UV-resistant outdoor-rated — ABS without the warp",
    whyItMatters: "Perfect for anything left outside. Far easier to print than ABS.",
    priceRange: "$25–30",
    category: "filament",
    relevantMaterials: ["ABS"],
    badge: "ABS Alternative",
  },
  {
    id: "esun-petg",
    name: "eSUN PETG Filament 1.75mm 1kg",
    brand: "eSUN",
    asin: "B07VK2LGMD",
    tagline: "Strong, food-safe-ish, low odor PETG",
    whyItMatters: "Great for mechanical parts that need more strength than PLA.",
    priceRange: "$22–28",
    category: "filament",
    relevantMaterials: ["PETG Basic", "PETG CF"],
  },

  // ── Post-Processing ───────────────────────────────────────────────────────
  {
    id: "sandpaper-kit",
    name: "AUSTOR 102-pc Wet/Dry Sandpaper Kit",
    brand: "AUSTOR",
    asin: "B075TGZJH9",
    tagline: "80 to 3000 grit — full surface finishing set",
    whyItMatters: "The fastest way to get smooth, paint-ready prints.",
    priceRange: "$10–14",
    category: "post-processing",
  },
  {
    id: "uv-station",
    name: "ELEGOO Mercury Plus UV Curing Station",
    brand: "ELEGOO",
    asin: "B08XYP9B6X",
    tagline: "360° rotating UV cure for resin prints",
    whyItMatters: "If you ever add a resin printer, this is non-negotiable.",
    priceRange: "$35–50",
    category: "post-processing",
  },
  {
    id: "priming-spray",
    name: "Rust-Oleum Filler Primer Spray",
    brand: "Rust-Oleum",
    asin: "B000BZZ3M8",
    tagline: "Fills layer lines before painting",
    whyItMatters: "One coat hides 90% of visible layer artifacts.",
    priceRange: "$8–12",
    category: "post-processing",
  },

  // ── Printers ──────────────────────────────────────────────────────────────
  {
    id: "bambu-a1-mini",
    name: "Bambu Lab A1 Mini Combo",
    brand: "Bambu Lab",
    asin: "B0CK7JLTRY",
    tagline: "Multi-color, no fuss — best value Bambu",
    whyItMatters: "AMS Lite included. Perfect second printer or gift.",
    priceRange: "$350–400",
    category: "printers",
    badge: "Bambu Pick",
  },
  {
    id: "bambu-p1s",
    name: "Bambu Lab P1S (Fully Enclosed)",
    brand: "Bambu Lab",
    asin: "B0CLQZ3MHN",
    tagline: "ABS, ASA, PA-CF — fully enclosed high-temp beast",
    whyItMatters: "For engineering filaments. Runs quiet with great results.",
    priceRange: "$600–700",
    category: "printers",
    relevantMaterials: ["ABS", "PETG CF", "PLA CF"],
  },
];

/** Build a full Amazon affiliate URL for a given ASIN. */
export function amazonUrl(asin: string, tag = AMAZON_TAG): string {
  return `https://www.amazon.com/dp/${asin}?tag=${tag}&linkCode=ogi&th=1&psc=1`;
}
