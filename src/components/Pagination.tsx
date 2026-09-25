"use client";

import React from "react";
import { IconChevronLeft, IconChevronRight } from "./icons";
import { calculateMaxPage } from "../lib/url-state";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export function Pagination({
  currentPage,
  totalItems,
  limit,
  onPageChange,
}: PaginationProps) {
  const maxPage = calculateMaxPage(totalItems, limit);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(totalItems, currentPage * limit);

  // Generate sensible page window
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (maxPage <= 7) {
      for (let i = 1; i <= maxPage; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(maxPage - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < maxPage - 2) {
        pages.push("...");
      }
      pages.push(maxPage);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-1 border-t border-[var(--hairline)]">
      {/* Range text */}
      <div className="text-xs sm:text-sm text-[var(--muted-ink)] font-mono tabular-nums">
        Showing <span className="text-[var(--ink)] font-medium">{startItem}–{endItem}</span> of{" "}
        <span className="text-[var(--ink)] font-medium">{totalItems}</span>
      </div>

      {/* Navigation Buttons */}
      <nav
        aria-label="Pagination navigation"
        className="flex items-center gap-1 text-sm"
      >
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed hover:not-disabled:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
          aria-label="Previous page"
        >
          <IconChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) => {
            if (typeof p === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-[var(--muted-ink)] font-mono select-none"
                >
                  ...
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isCurrent ? "page" : undefined}
                className={`min-w-8 h-8 px-2 rounded font-mono text-xs sm:text-sm transition-colors tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                  isCurrent
                    ? "bg-[var(--accent)] text-[var(--surface)] font-medium"
                    : "bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= maxPage}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed hover:not-disabled:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <IconChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
