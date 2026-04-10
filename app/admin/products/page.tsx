import Link from "next/link";
import { affiliateProductListAll } from "@/lib/repos/affiliate-products";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";

export const dynamic = "force-dynamic"; // always fresh — no caching

export default async function AdminProductsPage() {
  const products = await affiliateProductListAll();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Affiliate Products</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Manage what appears on the Workshop page.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="shrink-0 rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400"
        >
          + New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-2xl">📦</p>
          <p className="mt-3 font-medium text-zinc-400">No products yet</p>
          <p className="mt-1 text-sm text-zinc-600">
            The Workshop page uses the built-in fallback list until you add products here.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-5 inline-block rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <AdminProductsTable initialProducts={products} />
      )}
    </div>
  );
}
