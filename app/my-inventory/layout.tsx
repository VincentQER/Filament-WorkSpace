import { InventoryAppShell } from "@/components/inventory/InventoryAppShell";

export default function MyInventoryLayout({ children }: { children: React.ReactNode }) {
  return <InventoryAppShell>{children}</InventoryAppShell>;
}
