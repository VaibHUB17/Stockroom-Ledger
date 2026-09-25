"use client";

import React, { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { Toolbar } from "../../components/Toolbar";
import { ProductTable } from "../../components/ProductTable";
import { ProductCardList } from "../../components/ProductCard";
import { Pagination } from "../../components/Pagination";
import { TableSkeletonRows, EmptyState, ErrorState } from "../../components/StateViews";
import { ProductFormDialog } from "../../components/ProductFormDialog";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { LocalNotice } from "../../components/LocalNotice";
import { useProductList } from "../../hooks/useProductList";
import { parseUrlParams, buildQueryString, calculateMaxPage } from "../../lib/url-state";
import { getCategories } from "../../lib/api/categories";
import { addProduct, updateProduct, deleteProduct, ProductInput, isLocalId } from "../../lib/api/products";
import {
  recordLocalCreate,
  recordLocalUpdate,
  recordLocalDelete,
  generateLocalId,
  hasLocalChanges,
} from "../../lib/overlay";
import { getToken } from "../../lib/auth-storage";
import { Category, FilterParams, Product } from "../../lib/types";

function ProductListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Client-side authentication guard and bfcache back-navigation listener
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      if (!token) {
        setIsAuthenticated(false);
        const from = window.location.pathname + window.location.search;
        window.location.replace(`/login?from=${encodeURIComponent(from)}`);
        return false;
      }
      setIsAuthenticated(true);
      return true;
    };

    checkAuth();

    // Re-check when restored from browser back/forward cache (bfcache)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted || !getToken()) {
        checkAuth();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // URL is the single source of truth: parse and sanitise parameters
  const filters: FilterParams = useMemo(
    () => parseUrlParams(searchParams),
    [searchParams]
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Load product list via hook (with abort controller, delay safety, and overlay)
  const { products, total, loading, error, overlay, refetch, syncOverlay } =
    useProductList(filters);

  // Load categories once for filter dropdown and form select
  useEffect(() => {
    let active = true;
    getCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch(() => {
        // Fallback or retry silently
      });
    return () => {
      active = false;
    };
  }, []);

  // Gracefully clamp ?page=999 to maxPage if total exceeds valid bounds
  useEffect(() => {
    if (!loading && total > 0) {
      const maxPage = calculateMaxPage(total, filters.limit);
      if (filters.page > maxPage) {
        const nextUrl = buildQueryString({ ...filters, page: maxPage });
        router.replace(`/products${nextUrl}`);
      }
    }
  }, [loading, total, filters, router]);

  // Navigate to updated query params
  const handleFilterChange = useCallback(
    (updates: Partial<FilterParams>) => {
      const nextFilters = { ...filters, ...updates };
      const nextQuery = buildQueryString(nextFilters);
      router.push(`/products${nextQuery}`);
    },
    [filters, router]
  );

  // Add / Edit form submit handler
  const handleFormSubmit = async (data: ProductInput, id?: number) => {
    try {
      if (id !== undefined) {
        if (!isLocalId(id)) {
          await updateProduct(id, data);
        }
        recordLocalUpdate(id, data);
      } else {
        await addProduct(data);
        const newProduct: Product = {
          id: generateLocalId(),
          title: data.title,
          description: data.description,
          category: data.category,
          price: data.price,
          stock: data.stock,
          brand: data.brand,
          thumbnail: data.thumbnail || "",
          images: data.thumbnail ? [data.thumbnail] : [],
          rating: 5,
        };
        recordLocalCreate(newProduct);
      }
      syncOverlay();
      refetch();
    } catch {
      // Still apply local overlay for offline / demo simulation if network throws
      if (id !== undefined) {
        recordLocalUpdate(id, data);
      }
      syncOverlay();
    }
  };

  // Delete product handler
  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    try {
      if (!isLocalId(deletingProduct.id)) {
        await deleteProduct(deletingProduct.id);
      }
    } catch {
      // Proceed with local deletion even if demo API fails
    } finally {
      recordLocalDelete(deletingProduct.id);
      syncOverlay();
      refetch();
      setDeletingProduct(null);
    }
  };

  const currentQuery = buildQueryString(filters);
  if (!isAuthenticated) {
    return <TableSkeletonRows count={filters.limit === 10 ? 8 : 12} />;
  }

  const showNotice = hasLocalChanges(overlay);

  return (
    <div className="space-y-4">
      {/* Search, Filter, Sort and Actions Toolbar */}
      <Toolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        onOpenAddDialog={() => {
          setEditingProduct(null);
          setIsFormOpen(true);
        }}
      />

      {/* Local Overlay Transparency Notice */}
      {showNotice && <LocalNotice />}

      {/* Main Content Area */}
      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading ? (
        <TableSkeletonRows count={filters.limit === 10 ? 8 : 12} />
      ) : products.length === 0 ? (
        <EmptyState
          query={filters.q}
          category={filters.category}
          onClearFilters={() => handleFilterChange({ q: "", category: "", page: 1 })}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <ProductTable
            products={products}
            currentQueryString={currentQuery}
            onEdit={(product) => {
              setEditingProduct(product);
              setIsFormOpen(true);
            }}
            onDelete={(product) => {
              setDeletingProduct(product);
              setIsConfirmOpen(true);
            }}
          />

          {/* Mobile Card List View */}
          <ProductCardList
            products={products}
            currentQueryString={currentQuery}
            onEdit={(product) => {
              setEditingProduct(product);
              setIsFormOpen(true);
            }}
            onDelete={(product) => {
              setDeletingProduct(product);
              setIsConfirmOpen(true);
            }}
          />

          {/* Pagination Controls */}
          <Pagination
            currentPage={filters.page}
            totalItems={total}
            limit={filters.limit}
            onPageChange={(page) => handleFilterChange({ page })}
          />
        </>
      )}

      {/* Add / Edit Native Dialog */}
      <ProductFormDialog
        isOpen={isFormOpen}
        productToEdit={editingProduct}
        categories={categories}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Native Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete product"
        message={`Are you sure you want to delete "${deletingProduct?.title}"? This action will remove the product from your inventory.`}
        confirmLabel="Delete product"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsConfirmOpen(false);
          setDeletingProduct(null);
        }}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-5">
        <Suspense fallback={<TableSkeletonRows />}>
          <ProductListContent />
        </Suspense>
      </main>
    </div>
  );
}
