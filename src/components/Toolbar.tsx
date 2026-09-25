"use client";

import React, { useState, useEffect } from "react";
import { Category, FilterParams, PageLimit, SortField, SortOrder } from "../lib/types";
import { IconSearch, IconPlus, IconClose } from "./icons";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

interface ToolbarProps {
  filters: FilterParams;
  onFilterChange: (updates: Partial<FilterParams>) => void;
  categories: Category[];
  onOpenAddDialog: () => void;
}

export function Toolbar({
  filters,
  onFilterChange,
  categories,
  onOpenAddDialog,
}: ToolbarProps) {
  // Local search input state for immediate typing feedback
  const [searchInput, setSearchInput] = useState(filters.q);
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  // Sync internal state when external filter changes (e.g. browser back/forward or clear)
  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  // When debounced search changes, propagate to URL state & reset to page 1
  useEffect(() => {
    if (debouncedSearch !== filters.q) {
      onFilterChange({
        q: debouncedSearch,
        category: debouncedSearch ? "" : filters.category,
        page: 1,
      });
    }
  }, [debouncedSearch, filters.q, filters.category, onFilterChange]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    // Choosing a category clears any search query
    setSearchInput("");
    onFilterChange({
      category: selected,
      q: "",
      page: 1,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split(":") as [SortField, SortOrder];
    onFilterChange({
      sortBy: field,
      order: order,
      page: 1,
    });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value, 10) as PageLimit;
    onFilterChange({
      limit: newLimit,
      page: 1,
    });
  };

  const clearSearch = () => {
    setSearchInput("");
    onFilterChange({ q: "", page: 1 });
  };

  const currentSortValue = `${filters.sortBy}:${filters.order}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[var(--surface)] p-3 sm:p-4 rounded border border-[var(--hairline)]">
        {/* Search & Category Group */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Debounced Search */}
          <div className="relative flex-1">
            <label htmlFor="search-input" className="sr-only">
              Search products
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-ink)]">
              <IconSearch className="w-4 h-4" />
            </div>
            <input
              id="search-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products by title..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-transparent border border-[var(--hairline)] rounded text-[var(--ink)] placeholder:text-[var(--muted-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--muted-ink)] hover:text-[var(--ink)]"
                title="Clear search"
              >
                <IconClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="sm:w-48">
            <label htmlFor="category-select" className="sr-only">
              Filter by category
            </label>
            <select
              id="category-select"
              value={filters.category}
              onChange={handleCategoryChange}
              disabled={Boolean(filters.q)}
              className="w-full py-2 px-3 text-sm bg-[var(--surface)] border border-[var(--hairline)] rounded text-[var(--ink)] disabled:opacity-50 disabled:bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort, Page Size, and Add Product */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            {/* Sort Selector */}
            <div className="flex-1 sm:w-44">
              <label htmlFor="sort-select" className="sr-only">
                Sort by
              </label>
              <select
                id="sort-select"
                value={currentSortValue}
                onChange={handleSortChange}
                className="w-full py-2 px-3 text-sm bg-[var(--surface)] border border-[var(--hairline)] rounded text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
              >
                <option value="title:asc">Title (A to Z)</option>
                <option value="title:desc">Title (Z to A)</option>
                <option value="price:asc">Price (Low to High)</option>
                <option value="price:desc">Price (High to Low)</option>
                <option value="rating:desc">Rating (High to Low)</option>
                <option value="rating:asc">Rating (Low to High)</option>
              </select>
            </div>

            {/* Page Size Selector */}
            <div className="w-28 sm:w-32">
              <label htmlFor="limit-select" className="sr-only">
                Items per page
              </label>
              <select
                id="limit-select"
                value={filters.limit}
                onChange={handleLimitChange}
                className="w-full py-2 px-2.5 text-sm bg-[var(--surface)] border border-[var(--hairline)] rounded text-[var(--ink)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>

          {/* Add Product Button */}
          <button
            id="add-product-button"
            type="button"
            onClick={onOpenAddDialog}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[var(--surface)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 shrink-0"
          >
            <IconPlus className="w-4 h-4" />
            <span>Add product</span>
          </button>
        </div>
      </div>

      {/* Helper text explaining mutual exclusivity */}
      <div className="px-1 text-xs text-[var(--muted-ink)] flex items-center justify-between">
        <span>
          {filters.q
            ? "Search covers all categories. Clear search to select a category."
            : filters.category
            ? `Filtered by "${filters.category}". Typing in search clears category filter.`
            : "Search covers all categories."}
        </span>
      </div>
    </div>
  );
}
