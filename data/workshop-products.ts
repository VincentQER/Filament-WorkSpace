/**
 * Workshop — curated 3D-printing product recommendations with Amazon affiliate links.
 *
 * HOW TO SET YOUR AFFILIATE TAG
 * ─────────────────────────────
 * 1. Sign up at https://affiliate-program.amazon.com
 * 2. Your tag looks like: "yoursite-20"
 * 3. Replace the AMAZON_TAG constant below with your real tag.
 *
 * Link format: https://www.amazon.com/dp/{ASIN}?tag={AMAZON_TAG}
 */

export const AMAZON_TAG = "YOUR_TAG-20"; // ← replace with your Associates tag

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
  /** Short pitch — one line */
  tagline: string;
  /** Who needs this */
  whyItMatters: string;
  priceRange: string;
  category: ProductTag;
  /** Which inventory materials make this extra relevant */
  relevantMaterials?: string[];
  badge?: string;
};

export const WORKSHOP_CATEGORIES: { key: ProductTag; label: string; emoji: string }[] = [
  { key: "essential",       label: "Must-Have Tools",    emoji: "🔧" },
  { key: "storage",         label: "Filament Storage",   emoji: "📦" },
  { key: "filament",        label: "Popular Filaments",  emoji: "🎨" },
  { key: "post-processing", label: "Post-Processing",    emoji: "✨" },
  { key: "printers",        label: "Printers",           emoji: "🖨️" },
];

export const WORKSHOP_PRODUCTS: WorkshopProduct[] = [
  // ── Must-Have Tools ──────────────────────────────────────────────────────
  {
    id: "flush-cutters",
    name: "Hakko CHP-170 Flush Cutters",
    brand: "Hakko",
    asin: "B00FZPDG1K",
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
    tagline: "Verify dimensions and filament diameter",
    whyItMatters: "Essential for calibration and quality control.",
    priceRange: "$12–18",
    category: "essential",
  },
  {
    id: "spatula-set",
    name: "Printer Spatula & Scraper Set",
    brand: "TAODAN",
    asin: "B08HN4VMD5",
    tagline: "Remove prints without wrecking your build plate",
    whyItMatters: "Flexible steel blades for PEI, glass, or garolite beds.",
    priceRange: "$8–14",
    category: "essential",
  },
  {
    id: "pei-sheet",
    name: "Energetic PEI Spring Steel Sheet",
    brand: "Energetic",
    asin: "B09GXFKFC2",
    tagline: "Magnetic flex plate — prints pop off when cooled",
    whyItMatters: "Massive adhesion upgrade over plain glass for PLA, PETG, ABS.",
    priceRange: "$18–30",
    category: "essential",
    relevantMaterials: ["PLA Basic", "PLA Matte", "PETG Basic", "ABS"],
  },

  // ── Filament Storage ─────────────────────────────────────────────────────
  {
    id: "sunlu-dryer-s4",
    name: "Sunlu S4 Filament Dryer (4-spool)",
    brand: "Sunlu",
    asin: "B0C7CVJNFK",
    tagline: "Dry and print simultaneously — fits 4 spools",
    whyItMatters: "Moisture ruins PETG, TPU, and Nylon. This fixes it permanently.",
    priceRange: "$50–70",
    category: "storage",
    relevantMaterials: ["PETG Basic", "PETG CF", "TPU 85A", "TPU 90A"],
    badge: "Top Pick",
  },
  {
    id: "sunlu-dryer-s2",
    name: "Sunlu S2 Filament Dryer (1-spool)",
    brand: "Sunlu",
    asin: "B09MN7BDNQ",
    tagline: "Compact single-spool dryer with humidity display",
    whyItMatters: "Budget-friendly option for occasional PETG or TPU printing.",
    priceRange: "$25–35",
    category: "storage",
    relevantMaterials: ["PETG Basic", "TPU 85A", "TPU 90A"],
  },
  {
    id: "dry-box",
    name: "Polymaker PolyDryer Box",
    brand: "Polymaker",
    asin: "B07X96WMQJ",
    tagline: "Airtight storage with built-in hygrometer",
    whyItMatters: "Print-while-drying design. Keeps filament dry between sessions.",
    priceRange: "$20–28",
    category: "storage",
  },
  {
    id: "desiccant",
    name: "Eva-Dry Silica Gel Desiccant Packs (50g × 10)",
    brand: "Eva-Dry",
    asin: "B00GE4UPYW",
    tagline: "Cheap moisture protection for your storage bins",
    whyItMatters: "Toss one in any sealed container. Rechargeable in the oven.",
    priceRange: "$10–15",
    category: "storage",
  },

  // ── Popular Filaments ────────────────────────────────────────────────────
  {
    id: "hatchbox-pla",
    name: "Hatchbox PLA Filament 1.75mm 1kg",
    brand: "Hatchbox",
    asin: "B00J0ECR5I",
    tagline: "The most trusted budget PLA on Amazon",
    whyItMatters: "Consistent diameter, low warp, huge color selection. Great backup brand.",
    priceRange: "$20–25",
    category: "filament",
    relevantMaterials: ["PLA Basic", "PLA Matte"],
  },
  {
    id: "polymaker-asa",
    name: "Polymaker PolyLite ASA 1.75mm 1kg",
    brand: "Polymaker",
    asin: "B089DKRSF5",
    tagline: "UV-resistant, outdoor-rated — ABS without the warp",
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
    whyItMatters: "Great mechanical parts that need more strength than PLA.",
    priceRange: "$22–28",
    category: "filament",
    relevantMaterials: ["PETG Basic", "PETG CF"],
  },

  // ── Post-Processing ──────────────────────────────────────────────────────
  {
    id: "sandpaper-kit",
    name: "AUSTOR 102-pc Wet-Dry Sandpaper Assortment",
    brand: "AUSTOR",
    asin: "B075TGZJH9",
    tagline: "80 to 3000 grit — full surface finishing kit",
    whyItMatters: "The fastest way to get smooth, paint-ready prints.",
    priceRange: "$10–14",
    category: "post-processing",
  },
  {
    id: "uv-resin-light",
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
    whyItMatters: "One coat hides 90% of visible layer artifacts before painting.",
    priceRange: "$8–12",
    category: "post-processing",
  },

  // ── Printers ─────────────────────────────────────────────────────────────
  {
    id: "bambu-a1-mini",
    name: "Bambu Lab A1 Mini Combo",
    brand: "Bambu Lab",
    asin: "B0CK7JLTRY",
    tagline: "Multi-color, no fuss — best value Bambu",
    whyItMatters: "AMS Lite included. Perfect second printer or gift for a fellow maker.",
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
    whyItMatters: "Needed for engineering materials. Runs quiet with great results.",
    priceRange: "$600–700",
    category: "printers",
    relevantMaterials: ["ABS", "PETG CF", "PLA CF"],
  },
];

/** Build an Amazon affiliate URL for a given ASIN. */
export function amazonUrl(asin: string, tag = AMAZON_TAG): string {
  return `https://www.amazon.com/dp/${asin}?tag=${tag}&linkCode=ogi&th=1&psc=1`;
}
