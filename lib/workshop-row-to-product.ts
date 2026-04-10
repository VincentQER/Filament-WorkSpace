/**
 * Converts a DB affiliate_products row to the WorkshopProduct shape
 * used by product card components.
 *
 * Shared between the public /workshop page (server component) and the
 * authenticated /my-inventory/workshop section (client component).
 */
import type { AffiliateProductRow } from "@/lib/repos/affiliate-products";
import type { WorkshopProduct, ProductTag } from "@/data/workshop-products";

export function rowToWorkshopProduct(row: AffiliateProductRow): WorkshopProduct {
  const relevantMaterials = row.material_type
    ? row.material_type.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  return {
    id:            String(row.id),
    name:          row.title,
    brand:         row.brand,
    asin:          row.asin,
    directUrl:     row.amazon_url || undefined,
    tagline:       row.description || "",
    whyItMatters:  row.highlights || "",
    priceRange:    row.price_range,
    category:      row.category as ProductTag,
    relevantMaterials,
    imageId:       row.image_url || undefined,
    isDeal:        row.is_deal === 1,
    originalPrice: row.original_price || undefined,
  };
}
