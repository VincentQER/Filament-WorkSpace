"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type Item, normalizeItem } from "@/lib/inventory-item";

export function useInventoryWorkspace() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [undoStack, setUndoStack] = useState<Item[][]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const meRes = await fetch("/api/auth/me");
      if (cancelled) return;
      if (!meRes.ok) {
        router.push("/auth/login");
        return;
      }
      const invRes = await fetch("/api/inventory");
      if (cancelled) return;
      if (!invRes.ok) {
        setItems([]);
        setInventoryLoaded(true);
        setAuthReady(true);
        return;
      }
      const inv = (await invRes.json()) as { items: Item[] };
      if (Array.isArray(inv.items) && inv.items.length > 0) {
        setItems(inv.items.map(normalizeItem));
      } else {
        setItems([]);
      }
      setInventoryLoaded(true);
      setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!authReady || !inventoryLoaded) return;
    const t = window.setTimeout(() => {
      fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
        .then((res) => {
          if (res.ok) window.dispatchEvent(new CustomEvent("workspace:inventory-saved"));
        })
        .catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(t);
  }, [items, authReady, inventoryLoaded]);

  const updateItems = useCallback((updater: (prev: Item[]) => Item[]) => {
    setItems((prev) => {
      const next = updater(prev);
      setUndoStack((s) => [...s, prev].slice(-40));
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setUndoStack((s) => {
      if (s.length === 0) return s;
      const prev = s[s.length - 1]!;
      setItems(prev);
      return s.slice(0, -1);
    });
  }, []);

  return {
    items,
    authReady,
    updateItems,
    undo,
    undoStackLength: undoStack.length,
  };
}
