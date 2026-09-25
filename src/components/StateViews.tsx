"use client";

import React from "react";
import { IconRefresh } from "./icons";

export function TableSkeletonRows({ count = 8 }: { count?: number }) {
  const rows = Array.from({ length: count });

  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden md:block w-full overflow-x-auto rounded border border-[var(--hairline)] bg-[var(--surface)]">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="border-b border-[var(--hairline)] bg-[var(--bg)]">
            <tr className="text-xs uppercase tracking-wider text-[var(--muted-ink)] font-mono">
              <th className="py-3 px-4 w-16">Image</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">Rating</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline)]">
            {rows.map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-2.5 px-4">
                  <div className="w-12 h-12 rounded bg-[var(--hairline)]" />
                </td>
                <td className="py-2.5 px-4">
                  <div className="h-4 w-44 bg-[var(--hairline)] rounded mb-1" />
                  <div className="h-3 w-28 bg-[var(--hairline)]/60 rounded" />
                </td>
                <td className="py-2.5 px-4">
                  <div className="h-4 w-20 bg-[var(--hairline)] rounded" />
                </td>
                <td className="py-2.5 px-4 text-right">
                  <div className="h-4 w-14 bg-[var(--hairline)] rounded ml-auto" />
                </td>
                <td className="py-2.5 px-4 text-right">
                  <div className="h-4 w-12 bg-[var(--hairline)] rounded ml-auto" />
                </td>
                <td className="py-2.5 px-4">
                  <div className="h-4 w-20 bg-[var(--hairline)] rounded" />
                </td>
                <td className="py-2.5 px-4 text-right">
                  <div className="h-4 w-12 bg-[var(--hairline)] rounded ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Skeleton */}
      <div className="md:hidden divide-y divide-[var(--hairline)] rounded border border-[var(--hairline)] bg-[var(--surface)]">
        {rows.slice(0, 5).map((_, i) => (
          <div key={i} className="p-3.5 flex gap-3.5 items-start animate-pulse">
            <div className="w-16 h-16 rounded bg-[var(--hairline)] flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-[var(--hairline)] rounded" />
              <div className="h-3 w-1/3 bg-[var(--hairline)]/60 rounded" />
              <div className="h-3 w-1/2 bg-[var(--hairline)]/60 rounded pt-2" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

interface EmptyStateProps {
  query?: string;
  category?: string;
  onClearFilters: () => void;
}

export function EmptyState({ query, category, onClearFilters }: EmptyStateProps) {
  let message = "No products found.";
  if (query) {
    message = `No products match "${query}".`;
  } else if (category) {
    message = `No products found in category "${category}".`;
  }

  return (
    <div className="py-16 px-4 text-center rounded border border-[var(--hairline)] bg-[var(--surface)]">
      <div className="max-w-md mx-auto space-y-3">
        <p className="text-base text-[var(--ink)] font-medium">{message}</p>
        <p className="text-sm text-[var(--muted-ink)]">
          Try adjusting your search terms or clearing current filters.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onClearFilters}
            className="px-4 py-2 text-sm font-medium rounded border border-[var(--hairline-strong)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
          >
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="py-12 px-4 text-center rounded border border-[var(--danger)]/30 bg-[var(--danger-tint)]">
      <div className="max-w-md mx-auto space-y-3">
        <p className="text-sm font-semibold text-[var(--danger)] uppercase tracking-wide font-mono">
          Request error
        </p>
        <p className="text-sm text-[var(--ink)]">{message}</p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded bg-[var(--surface)] border border-[var(--danger)]/40 text-[var(--ink)] hover:bg-[var(--danger)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--danger)] transition-colors"
          >
            <IconRefresh className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    </div>
  );
}
