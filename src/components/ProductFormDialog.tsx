"use client";

import React, { useEffect, useRef, useState } from "react";
import { Category, Product } from "../lib/types";
import { ProductInput } from "../lib/api/products";
import { useSubmitGuard } from "../hooks/useSubmitGuard";
import { IconClose } from "./icons";

interface ProductFormDialogProps {
  isOpen: boolean;
  productToEdit: Product | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: ProductInput, id?: number) => Promise<void>;
}

interface FormErrors {
  title?: string;
  price?: string;
  stock?: string;
  category?: string;
  description?: string;
}

export function ProductFormDialog({
  isOpen,
  productToEdit,
  categories,
  onClose,
  onSubmit,
}: ProductFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { isSubmitting, execute } = useSubmitGuard();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [brand, setBrand] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  // Sync state when dialog opens or edited product changes
  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title || "");
      setDescription(productToEdit.description || "");
      setCategory(productToEdit.category || "");
      setPrice(productToEdit.price !== undefined ? productToEdit.price.toString() : "");
      setStock(productToEdit.stock !== undefined ? productToEdit.stock.toString() : "");
      setBrand(productToEdit.brand || "");
      setThumbnail(productToEdit.thumbnail || "");
    } else {
      setTitle("");
      setDescription("");
      setCategory(categories[0]?.slug || "beauty");
      setPrice("");
      setStock("");
      setBrand("");
      setThumbnail("");
    }
    setErrors({});
  }, [productToEdit, categories, isOpen]);

  // Manage native <dialog> lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = "Title is required.";
    }

    const parsedPrice = parseFloat(price);
    if (!price.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      newErrors.price = "Price must be a positive number.";
    }

    const parsedStock = parseInt(stock, 10);
    if (!stock.trim() || isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
      newErrors.stock = "Stock must be a whole number (0 or higher).";
    }

    if (!category.trim()) {
      newErrors.category = "Category is required.";
    }

    if (!description.trim() || description.trim().length < 8) {
      newErrors.description = "Description must be at least 8 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await execute(async () => {
      const payload: ProductInput = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        brand: brand.trim() || undefined,
        thumbnail: thumbnail.trim() || undefined,
      };

      await onSubmit(payload, productToEdit?.id);
      onClose();
    });
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-black/40 backdrop:backdrop-blur-none p-0 bg-transparent rounded-lg max-w-lg w-full m-auto open:flex open:flex-col shadow-xl border border-[var(--hairline)]"
    >
      <div className="bg-[var(--surface)] text-[var(--ink)] w-full rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--hairline)] bg-[var(--bg)]">
          <h2 className="text-base font-semibold text-[var(--ink)]">
            {productToEdit ? `Edit: ${productToEdit.title}` : "Add new product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--muted-ink)] hover:text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            aria-label="Close dialog"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="form-title" className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-ink)] mb-1">
              Title <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              id="form-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base sm:text-sm px-3 py-2 rounded border border-[var(--hairline)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
              placeholder="e.g. Wireless Noise-Cancelling Headphones"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.title}</p>
            )}
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="form-category" className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-ink)] mb-1">
                Category <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                id="form-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-base sm:text-sm px-3 py-2 rounded border border-[var(--hairline)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors capitalize"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-[var(--danger)]">{errors.category}</p>
              )}
            </div>

            <div>
              <label htmlFor="form-brand" className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-ink)] mb-1">
                Brand
              </label>
              <input
                id="form-brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full text-base sm:text-sm px-3 py-2 rounded border border-[var(--hairline)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                placeholder="e.g. Acme Studio"
              />
            </div>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="form-price" className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-ink)] mb-1">
                Price (USD) <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="form-price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-base sm:text-sm px-3 py-2 rounded border border-[var(--hairline)] bg-[var(--surface)] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-xs text-[var(--danger)]">{errors.price}</p>
              )}
            </div>

            <div>
              <label htmlFor="form-stock" className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-ink)] mb-1">
                Stock count <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="form-stock"
                type="number"
                step="1"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full text-base sm:text-sm px-3 py-2 rounded border border-[var(--hairline)] bg-[var(--surface)] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                placeholder="0"
              />
              {errors.stock && (
                <p className="mt-1 text-xs text-[var(--danger)]">{errors.stock}</p>
              )}
            </div>
          </div>

          {/* Thumbnail URL */}
          <div>
            <label htmlFor="form-thumbnail" className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-ink)] mb-1">
              Thumbnail image URL
            </label>
            <input
              id="form-thumbnail"
              type="url"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full text-base sm:text-sm px-3 py-2 rounded border border-[var(--hairline)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="form-description" className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-ink)] mb-1">
              Description <span className="text-[var(--danger)]">*</span>
            </label>
            <textarea
              id="form-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-base sm:text-sm px-3 py-2 rounded border border-[var(--hairline)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
              placeholder="Provide a clear description of the product and its specifications..."
            />
            {errors.description && (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--hairline)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-product-button"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded bg-[var(--accent)] text-[var(--surface)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
            >
              {isSubmitting ? "Saving..." : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
