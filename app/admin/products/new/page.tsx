import Link from "next/link";
import { AdminProductForm } from "@/components/admin/AdminProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <Link href="/admin/products" className="hover:text-zinc-300">Products</Link>
          {" / New"}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-white">New affiliate product</h1>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-6">
        <AdminProductForm />
      </div>
    </div>
  );
}
