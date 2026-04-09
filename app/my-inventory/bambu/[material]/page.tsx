"use client";

import { useParams } from "next/navigation";
import { BambuMaterialStock } from "@/components/inventory/BambuMaterialStock";

export default function BambuMaterialPage() {
  const params = useParams();
  const raw = params.material;
  const encoded = Array.isArray(raw) ? raw[0] : raw;
  const material = encoded ? decodeURIComponent(encoded) : "";
  return <BambuMaterialStock material={material} />;
}
