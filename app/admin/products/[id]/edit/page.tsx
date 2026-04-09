import { notFound } from "next/navigation";
import Link from "next/link";
import { affiliateProductGetById } from "@/lib/repos/affiliate-products";
import { AdminProductForm } from "@/components/admin/AdminProductForm";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) notFound();

  const product = await affiliateProductGetById(id);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <Link href="/admin/products" className="hover:text-zinc-300">Products</Link>
          {" / Edit"}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-white">
          Edit: {product.title}
        </h1>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-6">
        <AdminProductForm product={product} />
      </div>
    </div>
  );
}
