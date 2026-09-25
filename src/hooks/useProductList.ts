import { useState, useEffect, useCallback, useRef } from "react";
import { FilterParams, Product, AppError } from "../lib/types";
import { getProducts, searchProducts, getProductsByCategory } from "../lib/api/products";
import { getOverlay, applyOverlay, OverlayData } from "../lib/overlay";

interface UseProductListResult {
  products: Product[];
  total: number;
  loading: boolean;
  error: string | null;
  overlay: OverlayData;
  refetch: () => void;
  syncOverlay: () => void;
}

export function useProductList(filters: FilterParams): UseProductListResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<OverlayData>(getOverlay());
  const [refreshKey, setRefreshKey] = useState(0);

  // Keep track of the active request controller to abort on filter changes
  const abortControllerRef = useRef<AbortController | null>(null);

  const syncOverlay = useCallback(() => {
    const currentOverlay = getOverlay();
    setOverlay(currentOverlay);
    setProducts((prev) =>
      applyOverlay(prev, currentOverlay, {
        q: filters.q,
        category: filters.category,
        page: filters.page,
      })
    );
  }, [filters.q, filters.category, filters.page]);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    // Abort previous in-flight request so stale results never overwrite newer ones
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const skip = (filters.page - 1) * filters.limit;

    async function loadData() {
      try {
        let response;
        if (filters.q) {
          response = await searchProducts({
            q: filters.q,
            limit: filters.limit,
            skip,
            sortBy: filters.sortBy,
            order: filters.order,
            signal: controller.signal,
          });
        } else if (filters.category) {
          response = await getProductsByCategory({
            category: filters.category,
            limit: filters.limit,
            skip,
            sortBy: filters.sortBy,
            order: filters.order,
            signal: controller.signal,
          });
        } else {
          response = await getProducts({
            limit: filters.limit,
            skip,
            sortBy: filters.sortBy,
            order: filters.order,
            signal: controller.signal,
          });
        }

        const currentOverlay = getOverlay();
        setOverlay(currentOverlay);

        const merged = applyOverlay(response.products, currentOverlay, {
          q: filters.q,
          category: filters.category,
          page: filters.page,
        });

        setProducts(merged);
        setTotal(response.total);
        setLoading(false);
      } catch (err: unknown) {
        const appError = err as AppError;
        // Ignore aborted requests; do not show error banner
        if (appError?.isCanceled) {
          return;
        }

        setError(
          appError?.message ||
            "Could not load products. Check your connection and retry."
        );
        setLoading(false);
      }
    }

    loadData();

    return () => {
      controller.abort();
    };
  }, [
    filters.page,
    filters.limit,
    filters.q,
    filters.category,
    filters.sortBy,
    filters.order,
    refreshKey,
  ]);

  return {
    products,
    total,
    loading,
    error,
    overlay,
    refetch,
    syncOverlay,
  };
}
