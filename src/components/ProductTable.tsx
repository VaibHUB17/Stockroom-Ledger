"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "../lib/types";
import { IconStar, IconEdit, IconTrash } from "./icons";
import { StockIndicator } from "./StockIndicator";

interface ProductTableProps {
  products: Product[];
  currentQueryString: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductTable({
  products,
  currentQueryString,
  onEdit,
  onDelete,
}: ProductTableProps) {
  return (
    <div className="hidden md:block w-full overflow-x-auto rounded border border-[var(--hairline)] bg-[var(--surface)]">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="border-b border-[var(--hairline)] bg-[var(--bg)]">
          <tr className="text-xs uppercase tracking-wider text-[var(--muted-ink)] font-mono">
            <th scope="col" className="py-3 px-4 w-16">Image</th>
            <th scope="col" className="py-3 px-4">Title</th>
            <th scope="col" className="py-3 px-4">Category</th>
            <th scope="col" className="py-3 px-4 text-right">Price</th>
            <th scope="col" className="py-3 px-4 text-right">Rating</th>
            <th scope="col" className="py-3 px-4">Stock</th>
            <th scope="col" className="py-3 px-4 text-right w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--hairline)]">
          {products.map((product) => {
            const detailHref = `/products/${product.id}${currentQueryString}`;

            return (
              <tr
                key={product.id}
                className="hover:bg-[var(--surface-hover)] transition-colors duration-150 group"
              >
                {/* Thumbnail */}
                <td className="py-2.5 px-4">
                  <Link href={detailHref} className="block w-12 h-12 relative rounded-md overflow-hidden bg-[var(--bg)] border border-[var(--hairline)]">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--muted-ink)] text-xs font-mono">
                        N/A
                      </div>
                    )}
                  </Link>
                </td>

                {/* Title */}
                <td className="py-2.5 px-4 font-medium text-[var(--ink)]">
                  <div className="flex items-center gap-2">
                    <Link
                      href={detailHref}
                      className="hover:text-[var(--accent)] hover:underline focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded"
                    >
                      {product.title}
                    </Link>
                    {product.isLocal && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--accent-tint)] text-[var(--accent)] border border-[var(--accent)]/20">
                        Local
                      </span>
                    )}
                  </div>
                </td>

                {/* Category */}
                <td className="py-2.5 px-4 text-[var(--muted-ink)] capitalize">
                  {product.category}
                </td>

                {/* Price */}
                <td className="py-2.5 px-4 text-right font-mono text-[var(--ink)] tabular-nums">
                  ${product.price.toFixed(2)}
                </td>

                {/* Rating */}
                <td className="py-2.5 px-4 text-right font-mono text-[var(--ink)] tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <IconStar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{product.rating.toFixed(2)}</span>
                  </span>
                </td>

                {/* Stock Status */}
                <td className="py-2.5 px-4">
                  <StockIndicator stock={product.stock} />
                </td>

                {/* Actions */}
                <td className="py-2.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="p-1.5 text-[var(--muted-ink)] hover:text-[var(--accent)] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      title={`Edit ${product.title}`}
                      aria-label={`Edit ${product.title}`}
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      className="p-1.5 text-[var(--muted-ink)] hover:text-[var(--danger)] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--danger)]"
                      title={`Delete ${product.title}`}
                      aria-label={`Delete ${product.title}`}
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
