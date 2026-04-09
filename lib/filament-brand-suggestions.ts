import { searchCatalog } from "@/lib/search-catalog";

/**
 * Brand name pool for search (from `data/search-catalog.json`, rebuilt by `npm run sync:catalog`).
 * Includes hot brands, Bambu Lab, and any brands seen in the SQLite workspace.
 */
export const FILAMENT_BRAND_SUGGESTIONS: string[] = searchCatalog.brandNamesForSearch;

export function filterFilamentBrandSuggestions(query: string, limit = 12): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return FILAMENT_BRAND_SUGGESTIONS.filter((b) => b.toLowerCase().includes(q)).slice(0, limit);
}

export function filamentBrandWebSearchUrl(brandName: string): string {
  const q = encodeURIComponent(`${brandName.trim()} 3D printer filament`);
  return `https://duckduckgo.com/?q=${q}`;
}
