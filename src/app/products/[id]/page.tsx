"use client";

import React, { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { IconArrowLeft, IconStar } from "../../../components/icons";
import { StockIndicator } from "../../../components/StockIndicator";
import { getProductById } from "../../../lib/api/products";
import { getToken } from "../../../lib/auth-storage";
import { getOverlay, applyOverlayToSingle } from "../../../lib/overlay";
import { Product, AppError } from "../../../lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const idStr = resolvedParams.id;
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

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted || !getToken()) {
        checkAuth();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preserve list URL filters when returning
  const backHref = `/products${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    let isMounted = true;
    const numericId = parseInt(idStr, 10);

    if (!getToken()) return;

    if (isNaN(numericId) || numericId <= 0) {
      setNotFoundState(true);
      setLoading(false);
      return;
    }

    async function fetchDetail() {
      setLoading(true);
      setErrorMessage(null);
      setNotFoundState(false);

      const overlay = getOverlay();

      // Check if product was locally deleted
      if (overlay.deleted.includes(numericId)) {
        if (isMounted) {
          setNotFoundState(true);
          setLoading(false);
        }
        return;
      }

      // Check if product was locally created
      const localCreated = overlay.created.find((p) => p.id === numericId);
      if (localCreated) {
        if (isMounted) {
          setProduct(localCreated);
          setActiveImage(localCreated.images[0] || localCreated.thumbnail || "");
          setLoading(false);
        }
        return;
      }

      try {
        const fetched = await getProductById(numericId);
        if (!isMounted) return;

        // Apply local edits if any
        const patched = applyOverlayToSingle(fetched, overlay);
        if (!patched) {
          setNotFoundState(true);
        } else {
          setProduct(patched);
          setActiveImage(patched.images[0] || patched.thumbnail || "");
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const appError = err as AppError;
        if (appError.status === 404) {
          setNotFoundState(true);
        } else {
          setErrorMessage(appError.message || "Failed to load product details.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [idStr]);

  if (notFoundState) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center text-center">
          <div className="max-w-md space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--muted-ink)]">
              Error 404
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink)]">
              Product not found
            </h1>
            <p className="text-sm text-[var(--muted-ink)]">
              The product ID &quot;{idStr}&quot; does not exist in the inventory catalogue or may have been deleted.
            </p>
            <div className="pt-2">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded bg-[var(--accent)] text-[var(--surface)] hover:bg-[var(--accent-hover)] transition-colors"
              >
                <IconArrowLeft className="w-4 h-4" />
                <span>Return to inventory</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-lg font-semibold text-[var(--danger)]">
              Could not load product
            </h1>
            <p className="text-sm text-[var(--ink)]">{errorMessage}</p>
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)]"
            >
              <IconArrowLeft className="w-4 h-4" />
              <span>Back to inventory</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--muted-ink)] hover:text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded py-1 px-1.5"
          >
            <IconArrowLeft className="w-4 h-4" />
            <span>Back to inventory</span>
          </Link>
        </div>

        {loading || !product || !isAuthenticated ? (
          /* Loading Skeleton for Detail Page */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[var(--surface)] p-6 rounded border border-[var(--hairline)] animate-pulse">
            <div className="space-y-4">
              <div className="w-full aspect-square bg-[var(--hairline)] rounded" />
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="w-16 h-16 bg-[var(--hairline)] rounded" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-6 w-3/4 bg-[var(--hairline)] rounded" />
              <div className="h-4 w-1/4 bg-[var(--hairline)] rounded" />
              <div className="h-8 w-1/3 bg-[var(--hairline)] rounded pt-4" />
              <div className="h-20 w-full bg-[var(--hairline)] rounded" />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Section: Gallery + Product Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-[var(--surface)] p-6 rounded border border-[var(--hairline)]">
              {/* Left Column: Image Gallery */}
              <div className="space-y-3">
                <div className="w-full aspect-square relative rounded border border-[var(--hairline)] bg-[var(--bg)] overflow-hidden">
                  {activeImage ? (
                    <Image
                      src={activeImage}
                      alt={product.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--muted-ink)] font-mono text-sm">
                      No image available
                    </div>
                  )}
                </div>

                {/* Thumbnails list */}
                {product.images && product.images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveImage(img)}
                        className={`relative w-16 h-16 rounded overflow-hidden flex-shrink-0 border transition-all ${
                          activeImage === img
                            ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                            : "border-[var(--hairline)] opacity-70 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={img}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Information & Specs */}
              <div className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-ink)] font-mono">
                      <span className="uppercase tracking-wider">
                        {product.category}
                      </span>
                      {product.brand && (
                        <>
                          <span>•</span>
                          <span>{product.brand}</span>
                        </>
                      )}
                      {product.isLocal && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-tint)] text-[var(--accent)] border border-[var(--accent)]/20">
                          Local overlay
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                      {product.title}
                    </h1>
                  </div>

                  {/* Price, Rating, Stock */}
                  <div className="flex flex-wrap items-baseline gap-4 py-3 border-y border-[var(--hairline)]">
                    <div className="font-mono text-2xl font-medium text-[var(--ink)] tabular-nums">
                      ${product.price.toFixed(2)}
                    </div>

                    <div className="flex items-center gap-1 font-mono text-sm text-[var(--ink)] tabular-nums">
                      <IconStar className="w-4 h-4 text-amber-500" />
                      <span className="font-medium">{product.rating.toFixed(2)}</span>
                      <span className="text-xs text-[var(--muted-ink)]">/ 5.0</span>
                    </div>

                    <div className="ml-auto">
                      <StockIndicator stock={product.stock} />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted-ink)]">
                      Description
                    </h2>
                    <p className="text-sm text-[var(--ink)] leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Specs List in Monospace */}
                <div className="space-y-2 pt-4 border-t border-[var(--hairline)]">
                  <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted-ink)]">
                    Specifications
                  </h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
                    {product.sku && (
                      <div>
                        <dt className="text-[var(--muted-ink)]">SKU</dt>
                        <dd className="text-[var(--ink)] font-medium">{product.sku}</dd>
                      </div>
                    )}
                    {product.weight !== undefined && (
                      <div>
                        <dt className="text-[var(--muted-ink)]">Weight</dt>
                        <dd className="text-[var(--ink)] font-medium">{product.weight} kg</dd>
                      </div>
                    )}
                    {product.warrantyInformation && (
                      <div>
                        <dt className="text-[var(--muted-ink)]">Warranty</dt>
                        <dd className="text-[var(--ink)] font-medium">{product.warrantyInformation}</dd>
                      </div>
                    )}
                    {product.shippingInformation && (
                      <div>
                        <dt className="text-[var(--muted-ink)]">Shipping</dt>
                        <dd className="text-[var(--ink)] font-medium">{product.shippingInformation}</dd>
                      </div>
                    )}
                    {product.returnPolicy && (
                      <div className="col-span-2">
                        <dt className="text-[var(--muted-ink)]">Return Policy</dt>
                        <dd className="text-[var(--ink)] font-medium">{product.returnPolicy}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            {/* Bottom Section: Customer Reviews */}
            <div className="bg-[var(--surface)] p-6 rounded border border-[var(--hairline)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                <h2 className="text-base font-semibold text-[var(--ink)]">
                  Customer reviews ({product.reviews?.length || 0})
                </h2>
              </div>

              {product.reviews && product.reviews.length > 0 ? (
                <div className="divide-y divide-[var(--hairline)]">
                  {product.reviews.map((review, idx) => (
                    <div key={idx} className="py-4 space-y-1.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--ink)]">
                            {review.reviewerName}
                          </span>
                          <span className="text-[var(--muted-ink)] font-mono">
                            {new Date(review.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[var(--ink)]">
                          <IconStar className="w-3.5 h-3.5 text-amber-500" />
                          <span>{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--ink)]">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-ink)] py-4 text-center">
                  No customer reviews have been submitted for this item.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
