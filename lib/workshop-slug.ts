/**
 * Slug utilities for Workshop product pages.
 *
 * Strategy:
 *   DB products  → numeric slug  e.g. "42"
 *   Hardcoded    → string id    e.g. "flush-cutters"
 *
 * This keeps URLs stable: DB products never lose their page when
 * renamed, and hardcoded products use the human-readable ids already
 * defined in data/workshop-products.ts.
 */

import type { WorkshopProduct } from "@/data/workshop-products";

/** Returns the URL segment for a product. */
export function productSlug(product: WorkshopProduct): string {
  return product.id; // numeric string for DB products, string id for hardcoded
}

/** Canonical path for a product detail page. */
export function workshopProductPath(product: WorkshopProduct): string {
  return `/workshop/${productSlug(product)}`;
}

/**
 * Find a product in a flat list by slug.
 * Numeric slugs match products whose `id` is the same numeric string.
 * String slugs match by exact id.
 */
export function findBySlug(
  slug: string,
  products: WorkshopProduct[],
): WorkshopProduct | undefined {
  return products.find((p) => p.id === slug);
}
