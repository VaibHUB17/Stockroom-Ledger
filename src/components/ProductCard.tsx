"use client";

import React from "react";
import Link from "next/link";
import { Product } from "../lib/types";
import { IconStar, IconEdit, IconTrash } from "./icons";
import { StockIndicator } from "./StockIndicator";
import { ProductImage } from "./ProductImage";

interface ProductCardListProps {
  products: Product[];
  currentQueryString: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductCardList({
  products,
  currentQueryString,
  onEdit,
  onDelete,
}: ProductCardListProps) {
  return (
    <div className="md:hidden divide-y divide-[var(--hairline)] rounded border border-[var(--hairline)] bg-[var(--surface)]">
      {products.map((product) => {
        const detailHref = `/products/${product.id}${currentQueryString}`;

        return (
          <div key={product.id} className="p-3.5 flex gap-3.5 items-start">
            {/* Thumbnail */}
            <Link
              href={detailHref}
              className="w-16 h-16 relative flex-shrink-0 rounded-md overflow-hidden bg-[var(--bg)] border border-[var(--hairline)]"
            >
              <ProductImage
                src={product.thumbnail}
                alt={product.title}
                fill
                sizes="64px"
                className="object-cover"
              />
            </Link>

            {/* Content Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={detailHref}
                  className="text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] line-clamp-1"
                >
                  {product.title}
                </Link>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="p-1 text-[var(--muted-ink)] hover:text-[var(--accent)] rounded"
                    title={`Edit ${product.title}`}
                    aria-label={`Edit ${product.title}`}
                  >
                    <IconEdit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(product)}
                    className="p-1 text-[var(--muted-ink)] hover:text-[var(--danger)] rounded"
                    title={`Delete ${product.title}`}
                    aria-label={`Delete ${product.title}`}
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[var(--muted-ink)] capitalize">
                  {product.category}
                </span>
                {product.isLocal && (
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[var(--accent-tint)] text-[var(--accent)] border border-[var(--accent)]/20">
                    Local
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--hairline)] text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium text-[var(--ink)] tabular-nums text-sm">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[var(--muted-ink)] tabular-nums">
                    <IconStar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{product.rating.toFixed(2)}</span>
                  </span>
                </div>

                <StockIndicator stock={product.stock} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
