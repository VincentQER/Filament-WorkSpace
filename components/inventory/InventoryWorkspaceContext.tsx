"use client";

import { createContext, useContext } from "react";
import type { PublicUserProfile } from "@/lib/user-profile";
import type { Item } from "@/lib/inventory-item";
import type { summarizeInventoryForShell } from "@/lib/inventory-item";

type InventoryWorkspaceContextValue = {
  user: PublicUserProfile | null;
  authChecked: boolean;
  items: Item[];
  shellStats: ReturnType<typeof summarizeInventoryForShell> | null;
};

const InventoryWorkspaceContext = createContext<InventoryWorkspaceContextValue | null>(null);

export function InventoryWorkspaceProvider({
  value,
  children,
}: {
  value: InventoryWorkspaceContextValue;
  children: React.ReactNode;
}) {
  return (
    <InventoryWorkspaceContext.Provider value={value}>
      {children}
    </InventoryWorkspaceContext.Provider>
  );
}

export function useInventoryWorkspaceContext() {
  const ctx = useContext(InventoryWorkspaceContext);
  if (!ctx) {
    throw new Error("useInventoryWorkspaceContext must be used within InventoryWorkspaceProvider.");
  }
  return ctx;
}
