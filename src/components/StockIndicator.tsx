import React from "react";

interface StockIndicatorProps {
  stock: number;
}

export function StockIndicator({ stock }: StockIndicatorProps) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--stock-out)] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--stock-out)]" aria-hidden="true" />
        <span>Out of stock</span>
      </span>
    );
  }

  if (stock <= 10) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--stock-low)] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--stock-low)]" aria-hidden="true" />
        <span>Low ({stock})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--stock-healthy)] font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--stock-healthy)]" aria-hidden="true" />
      <span>{stock} in stock</span>
    </span>
  );
}
