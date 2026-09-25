import { Product } from "./types";

const OVERLAY_STORAGE_KEY = "product_admin_overlay_v1";

export interface OverlayData {
  created: Product[];
  updated: Record<number, Partial<Product>>;
  deleted: number[];
}

const EMPTY_OVERLAY: OverlayData = {
  created: [],
  updated: {},
  deleted: [],
};

export function getOverlay(): OverlayData {
  if (typeof window === "undefined") return EMPTY_OVERLAY;

  try {
    const raw = localStorage.getItem(OVERLAY_STORAGE_KEY);
    if (!raw) return EMPTY_OVERLAY;
    const parsed = JSON.parse(raw) as OverlayData;
    return {
      created: Array.isArray(parsed.created) ? parsed.created : [],
      updated: typeof parsed.updated === "object" && parsed.updated !== null ? parsed.updated : {},
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
    };
  } catch {
    return EMPTY_OVERLAY;
  }
}

export function saveOverlay(overlay: OverlayData): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(overlay));
  } catch {
    // Gracefully handle storage quota or private window limits
  }
}

export function generateLocalId(): number {
  // Use timestamp-based IDs above 10000 to prevent collisions with API IDs (1-194)
  return 10000 + (Date.now() % 89999);
}

export function recordLocalCreate(product: Product): OverlayData {
  const overlay = getOverlay();
  const markedProduct: Product = { ...product, isLocal: true };
  const updatedCreated = [markedProduct, ...overlay.created.filter((p) => p.id !== product.id)];
  const updated: OverlayData = {
    ...overlay,
    created: updatedCreated,
  };
  saveOverlay(updated);
  return updated;
}

export function recordLocalUpdate(id: number, patch: Partial<Product>): OverlayData {
  const overlay = getOverlay();

  // If it's a created item in overlay, update in place
  const existingCreatedIndex = overlay.created.findIndex((p) => p.id === id);
  if (existingCreatedIndex !== -1) {
    const nextCreated = [...overlay.created];
    nextCreated[existingCreatedIndex] = {
      ...nextCreated[existingCreatedIndex],
      ...patch,
      isLocal: true,
    };
    const updated: OverlayData = { ...overlay, created: nextCreated };
    saveOverlay(updated);
    return updated;
  }

  // Otherwise record in updated map
  const currentPatch = overlay.updated[id] || {};
  const nextUpdatedMap = {
    ...overlay.updated,
    [id]: { ...currentPatch, ...patch, isLocal: true },
  };

  const updated: OverlayData = {
    ...overlay,
    updated: nextUpdatedMap,
  };
  saveOverlay(updated);
  return updated;
}

export function recordLocalDelete(id: number): OverlayData {
  const overlay = getOverlay();

  const nextCreated = overlay.created.filter((p) => p.id !== id);
  const nextDeleted = overlay.deleted.includes(id)
    ? overlay.deleted
    : [...overlay.deleted, id];

  const updated: OverlayData = {
    ...overlay,
    created: nextCreated,
    deleted: nextDeleted,
  };
  saveOverlay(updated);
  return updated;
}

/**
 * Pure function: merges local overlay state onto fetched products.
 * Documented trade-off: Server-side pagination total counts reflect remote records.
 * Local additions and deletions alter visible row counts for the current page.
 */
export function applyOverlay(
  fetchedProducts: Product[],
  overlay: OverlayData,
  filters?: { q?: string; category?: string; page?: number }
): Product[] {
  // 1. Exclude deleted products and any products already tracked in created overlay
  const createdIds = new Set(overlay.created.map((p) => p.id));
  const remaining = fetchedProducts.filter(
    (product) => !overlay.deleted.includes(product.id) && !createdIds.has(product.id)
  );

  // 2. Apply updates
  const patched = remaining.map((product) => {
    const patch = overlay.updated[product.id];
    return patch ? { ...product, ...patch, isLocal: true } : product;
  });

  // 3. On page 1, prepend created items that match active filters
  const page = filters?.page || 1;
  let combined: Product[] = patched;

  if (page === 1 && overlay.created.length > 0) {
    const matchingCreated = overlay.created.filter((p) => {
      if (overlay.deleted.includes(p.id)) return false;

      if (filters?.q) {
        const query = filters.q.toLowerCase();
        return (
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
        );
      }

      if (filters?.category) {
        return p.category.toLowerCase() === filters.category.toLowerCase();
      }

      return true;
    });

    combined = [...matchingCreated, ...patched];
  }

  // 4. Strictly deduplicate by ID to guarantee unique React keys
  const seenIds = new Set<number>();
  return combined.filter((product) => {
    if (seenIds.has(product.id)) {
      return false;
    }
    seenIds.add(product.id);
    return true;
  });
}

export function applyOverlayToSingle(
  product: Product,
  overlay: OverlayData
): Product | null {
  if (overlay.deleted.includes(product.id)) {
    return null;
  }

  const patch = overlay.updated[product.id];
  return patch ? { ...product, ...patch, isLocal: true } : product;
}

export function hasLocalChanges(overlay: OverlayData): boolean {
  return (
    overlay.created.length > 0 ||
    Object.keys(overlay.updated).length > 0 ||
    overlay.deleted.length > 0
  );
}
